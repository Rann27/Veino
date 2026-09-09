<?php

namespace App\Console\Commands;

use App\Models\EbookItem;
use App\Models\EbookSeries;
use App\Models\Series;
use App\Services\StorageScanner;
use App\Services\ThumbnailService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;

/**
 * Backfills thumbnails for images uploaded before thumbnails existed.
 *
 * Safe to run repeatedly: files that already have one are skipped unless
 * --force is passed, so an interrupted run simply picks up where it stopped.
 */
class GenerateThumbnails extends Command
{
    protected $signature = 'thumbs:generate
                            {--force : Rebuild thumbnails that already exist}
                            {--dir= : Limit the run to one storage directory}
                            {--skip-remote : Leave CDN-hosted covers alone}
                            {--orphans : Include files nothing references}';

    protected $description = 'Generate listing thumbnails for stored images';

    public function handle(ThumbnailService $thumbs, StorageScanner $scanner): int
    {
        if (! $thumbs->available()) {
            $this->error('GD with WebP support is not available on this server. Nothing generated.');
            $this->line('Listings will keep using the original images, so nothing is broken.');

            return self::FAILURE;
        }

        $dirs = $this->option('dir')
            ? [$this->option('dir')]
            : array_values(array_diff(StorageScanner::PUBLIC_DIRS, ThumbnailService::SKIP_DIRS));

        $disk = Storage::disk('public');
        $force = (bool) $this->option('force');

        // Orphans are skipped unless asked for. A file nothing points at is
        // either about to be deleted or already forgotten, and on the storage
        // page it falls back to an icon rather than a picture — so a thumbnail
        // for one would never be loaded by anything.
        $referenced = $this->option('orphans') ? null : array_keys($scanner->references());

        $made = $skipped = $failed = 0;
        $sourceBytes = $thumbBytes = 0;

        foreach ($dirs as $dir) {
            if (in_array($dir, ThumbnailService::SKIP_DIRS, true)) {
                $this->warn("Skipping {$dir} — excluded by design.");

                continue;
            }

            $files = $disk->files($dir);

            if (! $files) {
                continue;
            }

            $this->line("<info>{$dir}</info> — ".count($files).' file(s)');
            $bar = $this->output->createProgressBar(count($files));

            foreach ($files as $file) {
                if ($referenced !== null && ! in_array($file, $referenced, true)) {
                    $skipped++;
                    $bar->advance();

                    continue;
                }

                $path = $thumbs->pathFor($file);

                if (! $path) {
                    $skipped++;
                    $bar->advance();

                    continue;
                }

                if (! $force && $disk->exists($path)) {
                    $skipped++;
                    $bar->advance();

                    continue;
                }

                if ($thumbs->generate($file, $force)) {
                    $made++;
                    $sourceBytes += $disk->size($file);
                    $thumbBytes += $disk->size($path);
                } else {
                    $failed++;
                }

                $bar->advance();
            }

            $bar->finish();
            $this->newLine(2);
        }

        if (! $this->option('dir') && ! $this->option('skip-remote')) {
            [$m, $s, $f] = $this->remoteCovers($thumbs, $force);
            $made += $m;
            $skipped += $s;
            $failed += $f;
        }

        $this->info("Generated {$made}, skipped {$skipped}, failed {$failed}.");

        if ($made > 0) {
            $this->line(sprintf(
                'Listings now load %s instead of %s for those images — %d%% less.',
                $this->human($thumbBytes),
                $this->human($sourceBytes),
                (int) round((1 - $thumbBytes / max(1, $sourceBytes)) * 100),
            ));
        }

        return self::SUCCESS;
    }

    /**
     * Covers that live on a CDN rather than in storage.
     *
     * Nearly every series cover is a jsdelivr link, and a CDN serves whatever
     * it was given — full resolution, every time. Without this pass the listing
     * pages named in the brief would gain nothing at all, since none of their
     * images are ours to begin with.
     *
     * @return array{0: int, 1: int, 2: int} made, skipped, failed
     */
    private function remoteCovers(ThumbnailService $thumbs, bool $force): array
    {
        $sources = collect()
            ->merge(Series::whereNotNull('cover_url')->pluck('cover_url'))
            ->merge(EbookSeries::whereNotNull('cover')->pluck('cover'))
            ->merge(EbookItem::whereNotNull('cover')->pluck('cover'))
            ->filter(fn ($c) => filter_var($c, FILTER_VALIDATE_URL))
            ->unique()
            ->values();

        if ($sources->isEmpty()) {
            return [0, 0, 0];
        }

        $this->line('<info>CDN covers</info> — '.$sources->count().' link(s), downloading once each');
        $bar = $this->output->createProgressBar($sources->count());

        $made = $skipped = $failed = 0;
        $disk = Storage::disk('public');

        foreach ($sources as $url) {
            $path = $thumbs->pathFor($url);

            if (! $force && $path && $disk->exists($path)) {
                $skipped++;
            } elseif ($thumbs->generate($url, $force)) {
                $made++;
            } else {
                $failed++;
            }

            $bar->advance();
        }

        $bar->finish();
        $this->newLine(2);

        return [$made, $skipped, $failed];
    }

    private function human(int $bytes): string
    {
        foreach (['B', 'KB', 'MB', 'GB'] as $unit) {
            if ($bytes < 1024 || $unit === 'GB') {
                return round($bytes, 1).' '.$unit;
            }
            $bytes /= 1024;
        }

        return $bytes.' B';
    }
}
