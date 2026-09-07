<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Chapter;
use App\Models\Series;
use App\Services\DocxParser;
use HTMLPurifier;
use HTMLPurifier_Config;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class BatchController extends Controller
{
    /**
     * How long the per-series upload lock survives without being released.
     *
     * Only a backstop for a process killed mid-batch — the normal path releases
     * it in a finally block. Generous enough that a genuinely large batch is
     * never cut short by it.
     */
    private const UPLOAD_LOCK_SECONDS = 600;

    // ── Pages ────────────────────────────────────────────────────────────────

    public function batchUploadPage(Series $series)
    {
        return Inertia::render('Admin/Series/BatchUpload', [
            'series' => [
                'id'    => $series->id,
                'title' => $series->title,
                'slug'  => $series->slug,
            ],
        ]);
    }

    public function batchManagerPage(Series $series)
    {
        $chapters = Chapter::where('series_id', $series->id)
            ->orderBy('volume')
            ->orderBy('chapter_number')
            ->get(['id', 'chapter_number', 'volume', 'chapter_link', 'title', 'is_premium']);

        return Inertia::render('Admin/Series/BatchManager', [
            'series'   => [
                'id'    => $series->id,
                'title' => $series->title,
                'slug'  => $series->slug,
            ],
            'chapters' => $chapters,
        ]);
    }

    // ── API: Parse DOCX files ─────────────────────────────────────────────────

    public function parseDocx(Request $request)
    {
        $request->validate([
            'files'            => 'required|array|min:1',
            'files.*.filename' => 'required|string',
            'files.*.content'  => 'required|string',
        ]);

        $parser  = new DocxParser();
        $results = [];

        foreach ($request->input('files') as $fileData) {
            $filename = $fileData['filename'];

            if (strtolower(pathinfo($filename, PATHINFO_EXTENSION)) !== 'docx') {
                $results[] = ['filename' => $filename, 'error' => 'Not a .docx file'];
                continue;
            }

            try {
                $decoded = base64_decode($fileData['content'], strict: true);
                if ($decoded === false) {
                    throw new \RuntimeException('Invalid file encoding');
                }

                $tmpPath = tempnam(sys_get_temp_dir(), 'docx_');
                file_put_contents($tmpPath, $decoded);

                try {
                    $parsed = $parser->parse($tmpPath);
                } finally {
                    @unlink($tmpPath);
                }

                $results[] = [
                    'filename' => $filename,
                    'title'    => $parsed['title'],
                    'content'  => $parsed['content'],
                ];
            } catch (\Throwable $e) {
                $results[] = ['filename' => $filename, 'error' => $e->getMessage()];
            }
        }

        return response()->json($results);
    }

    // ── API: Batch store chapters ─────────────────────────────────────────────

    public function batchStore(Request $request, Series $series)
    {
        $request->validate([
            'chapters'                  => 'required|array|min:1',
            'chapters.*.title'          => 'required|string|max:255',
            'chapters.*.content'        => 'required|string',
            'chapters.*.is_premium'     => 'boolean',
            'chapters.*.chapter_number' => 'nullable|numeric|min:0',
            'chapters.*.volume'         => 'nullable|numeric|min:0',
        ]);

        // One upload per series at a time, and a second attempt is turned away
        // immediately instead of queueing behind the first.
        //
        // The numbering below takes a row lock per chapter, held for the whole
        // transaction. When a batch is still running server-side but the browser
        // has already given up and shown a network error, a retry used to sit in
        // that queue in silence — which is how a single upload came to be logged
        // at 296 seconds, nearly all of it spent waiting. Worse, once the queue
        // drained, both runs would insert the same chapters under different
        // numbers.
        $lock = Cache::lock('batch-store:series:'.$series->id, self::UPLOAD_LOCK_SECONDS);

        if (! $lock->get()) {
            return response()->json([
                'success' => false,
                'message' => 'An upload for this series is already running. Give it a moment, then check the chapter list before trying again.',
            ], 409);
        }

        $created = [];

        try {
            DB::transaction(function () use ($request, $series, &$created) {
                foreach ($request->chapters as $item) {
                    $volume        = isset($item['volume']) && $item['volume'] !== '' ? (float) $item['volume'] : null;
                    $chapterNumber = isset($item['chapter_number']) && $item['chapter_number'] !== ''
                        ? (float) $item['chapter_number']
                        : null;

                    if ($chapterNumber === null) {
                        $query = Chapter::where('series_id', $series->id)->lockForUpdate();
                        if ($volume !== null) {
                            $query->where('volume', $volume);
                        } else {
                            $query->whereNull('volume');
                        }
                        $max           = $query->max('chapter_number');
                        $chapterNumber = $max ? $max + 1 : 1;
                    }

                    $chapterLink = $this->buildChapterLink($volume, $chapterNumber);
                    $content     = $this->sanitize($item['content']);

                    $chapter = Chapter::create([
                        'series_id'      => $series->id,
                        'title'          => $item['title'],
                        'content'        => $content,
                        'is_premium'     => (bool) ($item['is_premium'] ?? false),
                        'coin_price'     => 0,
                        'is_published'   => true,
                        'chapter_number' => $chapterNumber,
                        'chapter_link'   => $chapterLink,
                        'volume'         => $volume,
                        'views'          => 0,
                    ]);

                    $created[] = [
                        'id'             => $chapter->id,
                        'title'          => $chapter->title,
                        'chapter_number' => $chapter->chapter_number,
                        'volume'         => $chapter->volume,
                        'chapter_link'   => $chapter->chapter_link,
                        'is_premium'     => $chapter->is_premium,
                        ];
                    }
            });
        } finally {
            // Released even if the batch throws, so one failure cannot wedge the
            // series shut until the TTL expires.
            $lock->release();
        }

        return response()->json(['success' => true, 'created' => $created]);
    }

    // ── API: Batch update chapters ────────────────────────────────────────────

    public function batchUpdate(Request $request, Series $series)
    {
        $request->validate([
            'chapters'                  => 'required|array',
            'chapters.*.id'             => 'required|integer|exists:chapters,id',
            'chapters.*.title'          => 'required|string|max:255',
            'chapters.*.chapter_number' => 'required|numeric|min:0',
            'chapters.*.volume'         => 'nullable|numeric|min:0',
            'chapters.*.is_premium'     => 'boolean',
        ]);

        DB::transaction(function () use ($request, $series) {
            foreach ($request->chapters as $item) {
                $chapter = Chapter::where('id', $item['id'])
                    ->where('series_id', $series->id)
                    ->firstOrFail();

                $volume        = isset($item['volume']) && $item['volume'] !== '' ? (float) $item['volume'] : null;
                $chapterNumber = (float) $item['chapter_number'];

                // Renumbering changes the URL; anything else must leave it alone,
                // which is also what keeps older dotted links intact.
                $chapterLink = $chapter->hasSameNumbering($volume, $chapterNumber)
                    ? $chapter->chapter_link
                    : $this->buildChapterLink($volume, $chapterNumber);

                $chapter->update([
                    'title'          => $item['title'],
                    'chapter_number' => $chapterNumber,
                    'volume'         => $volume,
                    'chapter_link'   => $chapterLink,
                    'is_premium'     => (bool) ($item['is_premium'] ?? false),
                ]);
            }
        });

        return response()->json(['success' => true]);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private function buildChapterLink(?float $volume, float $chapterNumber): string
    {
        return Chapter::buildLink($volume, $chapterNumber);
    }

    /**
     * Built once per request and reused for every chapter in the batch.
     *
     * A batch is a loop, and HTMLPurifier is expensive to construct: measured
     * locally at ~0.16s per instantiation against ~0.003s when reused — about
     * 50x. On a shared host with a cold definition cache it is far worse, which
     * is how a batch upload ended up taking minutes rather than seconds.
     */
    private ?HTMLPurifier $purifier = null;

    private function sanitize(string $content): string
    {
        if ($this->purifier) {
            return $this->purifier->purify($content);
        }

        $config = HTMLPurifier_Config::createDefault();

        // Keep the compiled definition inside storage/, which Laravel already
        // guarantees is writable. The library's default is a folder under
        // vendor/ — routinely read-only in production, and when the cache
        // cannot be written HTMLPurifier rebuilds the whole definition on
        // every single call.
        $cacheDir = storage_path('framework/cache/htmlpurifier');

        if (! is_dir($cacheDir)) {
            @mkdir($cacheDir, 0775, true);
        }

        if (is_writable($cacheDir)) {
            $config->set('Cache.SerializerPath', $cacheDir);
        }

        $config->set('HTML.DefinitionID', 'batch-chapter');
        $config->set('HTML.DefinitionRev', 1);
        // Mirrors ChapterController's allow-list. `img` matters here: chapters
        // imported from .docx carry their extracted illustrations, and without
        // it HTMLPurifier would silently strip every one of them.
        $config->set('HTML.Allowed',
            // `p[style]` keeps the paragraph alignment DocxParser reads out of
            // the .docx — a bare `p` silently dropped every centred line.
            'p[style|class],br,strong,em,b,i,u,s,sup,sub,' .
            'h1,h2,h3,h4,h5,h6,' .
            'ul,ol,li,' .
            'img[src|alt|title|width|height|style|class],' .
            'a[href|title|target],' .
            'blockquote,code,pre,' .
            'span[style|class],div[style|class],' .
            'hr'
        );
        $config->set('URI.AllowedSchemes', [
            'http' => true,
            'https' => true,
            'data' => true,
        ]);
        $config->set('AutoFormat.RemoveEmpty', false);
        $config->set('AutoFormat.AutoParagraph', false);

        $this->purifier = new HTMLPurifier($config);

        return $this->purifier->purify($content);
    }
}
