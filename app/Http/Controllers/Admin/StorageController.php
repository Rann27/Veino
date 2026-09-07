<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\StorageTrash;
use App\Services\StorageScanner;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class StorageController extends Controller
{
    /** Where quarantined files live, on the private disk. */
    private const TRASH_DIR = 'storage-trash';

    /**
     * A full scan reads every chapter body, so the result is cached and
     * refreshed on demand rather than recomputed on every page view.
     */
    private const CACHE_KEY = 'storage-manager:scan';

    private const CACHE_MINUTES = 15;

    public function __construct(private StorageScanner $scanner) {}

    public function index(Request $request)
    {
        if ($request->boolean('refresh')) {
            Cache::forget(self::CACHE_KEY);
        }

        $data = Cache::remember(self::CACHE_KEY, now()->addMinutes(self::CACHE_MINUTES), function () {
            $files = $this->scanner->scan();

            return [
                'files' => $files,
                'summary' => $this->scanner->summarise($files),
                'duplicates' => $this->scanner->duplicates($files),
                'missing' => $this->scanner->missing(),
                'scanned_at' => now()->toIso8601String(),
            ];
        });

        $trash = StorageTrash::with('deletedBy:id,display_name')
            ->orderByDesc('deleted_at')
            ->limit(500)
            ->get()
            ->map(fn ($t) => [
                'id' => $t->id,
                'original_path' => $t->original_path,
                'size' => $t->size,
                'deleted_at' => $t->deleted_at?->toIso8601String(),
                'expires_at' => $t->expires_at?->toIso8601String(),
                'deleted_by' => $t->deletedBy?->display_name,
            ]);

        return Inertia::render('Admin/Storage/Index', [
            'files' => $data['files'],
            'summary' => $data['summary'],
            'duplicates' => $data['duplicates'],
            'missing' => $data['missing'],
            'scannedAt' => $data['scanned_at'],
            'trash' => $trash,
            'trashSize' => (int) StorageTrash::sum('size'),
            'retentionDays' => StorageTrash::RETENTION_DAYS,
            'diskUsage' => $this->scanner->diskUsage(),
        ]);
    }

    /**
     * Quarantines the selected files.
     *
     * The usage check is repeated here against a freshly built reference map.
     * The browser's idea of what is unused can be minutes old — long enough for
     * an editor to have inserted the image into a chapter in the meantime — and
     * a delete request must never be trusted to have got that right.
     */
    public function destroy(Request $request)
    {
        $validated = $request->validate([
            'paths' => 'required|array|min:1|max:500',
            'paths.*' => 'required|string',
        ]);

        $references = $this->scanner->references();

        $moved = 0;
        $freed = 0;
        $inUse = [];
        $rejected = [];
        $failed = [];

        foreach ($validated['paths'] as $raw) {
            $path = $this->scanner->normalise($raw);

            // Rejects traversal and anything outside the managed directories in
            // one move: normalise() only returns paths under a known directory.
            if (! $path) {
                $rejected[] = $raw;

                continue;
            }

            if (isset($references[$path])) {
                $inUse[] = $path;

                continue;
            }

            $disk = str_starts_with($path, 'ebook-files/') ? 'local' : 'public';

            if (! Storage::disk($disk)->exists($path)) {
                $failed[] = $path;

                continue;
            }

            try {
                $size = (int) Storage::disk($disk)->size($path);
                // Timestamped so two files of the same name from different
                // directories cannot collide inside the quarantine.
                $trashPath = self::TRASH_DIR.'/'.now()->format('Ymd-His').'-'.bin2hex(random_bytes(4)).'-'.basename($path);

                Storage::disk('local')->put(
                    $trashPath,
                    Storage::disk($disk)->get($path)
                );

                Storage::disk($disk)->delete($path);

                StorageTrash::create([
                    'original_path' => $path,
                    'trash_path' => $trashPath,
                    'disk' => $disk,
                    'size' => $size,
                    'deleted_by' => Auth::id(),
                    'deleted_at' => now(),
                ]);

                $moved++;
                $freed += $size;
            } catch (\Throwable $e) {
                Log::error('Storage manager: failed to quarantine file', [
                    'path' => $path,
                    'error' => $e->getMessage(),
                ]);
                $failed[] = $path;
            }
        }

        Cache::forget(self::CACHE_KEY);

        $message = $moved > 0
            ? "Moved {$moved} file(s) to quarantine, freeing ".$this->human($freed).'.'
            : 'No files were moved.';

        // Kept apart on purpose: "in use" is a normal, expected refusal, while a
        // rejected path means something sent a value outside the managed
        // directories — worth an admin noticing rather than blending in.
        if ($inUse) {
            $message .= ' '.count($inUse).' skipped — still in use.';
        }

        if ($rejected) {
            $message .= ' '.count($rejected).' rejected — not a managed storage path.';
        }

        if ($failed) {
            $message .= ' '.count($failed).' could not be read.';
        }

        return back()->with($moved > 0 ? 'success' : 'error', $message);
    }

    /** Puts a quarantined file back where it came from. */
    public function restore(Request $request)
    {
        $validated = $request->validate([
            'ids' => 'required|array|min:1',
            'ids.*' => 'required|integer',
        ]);

        $restored = 0;
        $failed = 0;

        foreach (StorageTrash::whereIn('id', $validated['ids'])->get() as $entry) {
            try {
                if (! Storage::disk('local')->exists($entry->trash_path)) {
                    $entry->delete();
                    $failed++;

                    continue;
                }

                // Never clobber: if something now occupies the original path,
                // that file is the live one and must win.
                if (Storage::disk($entry->disk)->exists($entry->original_path)) {
                    $failed++;

                    continue;
                }

                Storage::disk($entry->disk)->put(
                    $entry->original_path,
                    Storage::disk('local')->get($entry->trash_path)
                );

                Storage::disk('local')->delete($entry->trash_path);
                $entry->delete();
                $restored++;
            } catch (\Throwable $e) {
                Log::error('Storage manager: restore failed', ['id' => $entry->id, 'error' => $e->getMessage()]);
                $failed++;
            }
        }

        Cache::forget(self::CACHE_KEY);

        return back()->with($restored > 0 ? 'success' : 'error',
            "Restored {$restored} file(s)".($failed ? ", {$failed} could not be restored." : '.'));
    }

    /**
     * Empties the quarantine for good.
     *
     * Without `all`, only entries past the retention window go — the same set
     * the scheduled command would take.
     */
    public function purge(Request $request)
    {
        $all = $request->boolean('all');

        $query = StorageTrash::query();

        if (! $all) {
            $query->expired();
        }

        $purged = 0;
        $freed = 0;

        foreach ($query->get() as $entry) {
            Storage::disk('local')->delete($entry->trash_path);
            $freed += $entry->size;
            $entry->delete();
            $purged++;
        }

        return back()->with('success',
            "Purged {$purged} file(s) permanently, freeing ".$this->human($freed).'.');
    }

    private function human(int $bytes): string
    {
        if ($bytes >= 1073741824) {
            return round($bytes / 1073741824, 2).' GB';
        }

        if ($bytes >= 1048576) {
            return round($bytes / 1048576, 2).' MB';
        }

        if ($bytes >= 1024) {
            return round($bytes / 1024, 1).' KB';
        }

        return $bytes.' B';
    }
}
