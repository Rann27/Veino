<?php

namespace App\Services;

use App\Models\Advertisement;
use App\Models\Blog;
use App\Models\Chapter;
use App\Models\EbookItem;
use App\Models\EbookSeries;
use App\Models\Series;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

/**
 * Works out which stored files the site still needs, and which are dead weight.
 *
 * The whole feature rests on one number being right: whether a file is in use.
 * Getting that wrong in the safe direction leaves rubbish on disk; getting it
 * wrong the other way tears an image out of a published chapter. So every rule
 * here is written to fail towards "in use".
 *
 * Three traps this has to survive, all of them found in this codebase:
 *
 *  1. Not every reference lives in the database. Homepage banners are stored in
 *     storage/app/private/homepage-config.json — a database-only sweep would
 *     report every live banner as an orphan.
 *
 *  2. Most images are referenced from inside HTML, not from a path column.
 *     chapter-images is the largest directory on disk and is reached almost
 *     entirely through <img> tags in chapters.content.
 *
 *  3. Stored paths have three shapes, because the URL accessors accept three:
 *     a full CDN URL, a "storage/…"-prefixed path, and a bare relative path.
 *     Matching on the raw column value alone would miss two of them.
 */
class StorageScanner
{
    /**
     * Directories under the public disk that this manager owns.
     *
     * Kept explicit rather than globbed: a directory nobody has taught the
     * scanner to resolve references for must never be offered for deletion.
     */
    public const PUBLIC_DIRS = [
        'advertisements',
        'avatars',
        'banners',
        'blog-images',
        'chapter-images',
        'ebook-covers',
        'ebook-item-covers',
        'ebook-preview-images',
        'series-covers',
    ];

    /** Directories on the private disk. */
    public const PRIVATE_DIRS = [
        'ebook-files',
    ];

    /** Files larger than this are not hashed; duplicate detection skips them. */
    private const MAX_HASH_BYTES = 16 * 1024 * 1024;

    /** Rows pulled per chunk when sweeping longText columns. */
    private const CHUNK = 200;

    /**
     * @var array<string, array<int, array{type: string, label: string, url: ?string}>>|null
     *      relative path => the things that reference it
     */
    private ?array $references = null;

    // ─── Path normalisation ──────────────────────────────────────────────────

    /**
     * Reduces any stored value to the relative path used on disk.
     *
     * Handles all three shapes the accessors accept, plus query strings and the
     * leading slash a CDN URL leaves behind. Returns null when the value points
     * somewhere this manager does not own — an external image host, say.
     */
    public function normalise(?string $value): ?string
    {
        if (! $value || ! is_string($value)) {
            return null;
        }

        $value = trim($value);

        // A full URL: keep only the path component.
        if (preg_match('#^https?://#i', $value)) {
            $value = (string) parse_url($value, PHP_URL_PATH);
        }

        $value = ltrim(explode('?', $value, 2)[0], '/');
        $value = preg_replace('#^storage/#', '', $value);
        $value = ltrim((string) $value, '/');

        if ($value === '') {
            return null;
        }

        // Only paths inside a directory this scanner understands count. Anything
        // else is someone else's file and is not ours to judge.
        $dir = explode('/', $value)[0];

        if (! in_array($dir, array_merge(self::PUBLIC_DIRS, self::PRIVATE_DIRS), true)) {
            return null;
        }

        return rawurldecode($value);
    }

    /**
     * Pulls every path this manager owns out of a blob of HTML.
     *
     * Matching on "<known-directory>/<filename>" rather than on src attributes
     * is deliberate: it catches src, srcset, inline background styles, and
     * absolute CDN URLs in one pass, and cannot be defeated by an editor
     * rewriting the markup around the reference.
     *
     * @return array<int, string>
     */
    public function extractFromHtml(?string $html): array
    {
        if (! $html) {
            return [];
        }

        $dirs = implode('|', array_map('preg_quote', array_merge(self::PUBLIC_DIRS, self::PRIVATE_DIRS)));

        if (! preg_match_all('#(?:'.$dirs.')/[A-Za-z0-9._\-%]+#', $html, $matches)) {
            return [];
        }

        $paths = [];

        foreach (array_unique($matches[0]) as $hit) {
            if ($path = $this->normalise($hit)) {
                $paths[] = $path;
            }
        }

        return $paths;
    }

    // ─── Reference map ───────────────────────────────────────────────────────

    /**
     * Every referenced path, mapped to what references it.
     *
     * The "used by" list is not decoration: it is how an admin checks the
     * verdict instead of trusting it. A file marked in use that shows no
     * referrer would be a bug worth seeing.
     *
     * @return array<string, array<int, array{type: string, label: string, url: ?string}>>
     */
    public function references(): array
    {
        if ($this->references !== null) {
            return $this->references;
        }

        $map = [];

        $add = function (?string $value, string $type, string $label, ?string $url = null) use (&$map): void {
            if ($path = $this->normalise($value)) {
                $map[$path][] = ['type' => $type, 'label' => $label, 'url' => $url];
            }
        };

        $addMany = function (array $paths, string $type, string $label, ?string $url = null) use (&$map): void {
            foreach ($paths as $path) {
                $map[$path][] = ['type' => $type, 'label' => $label, 'url' => $url];
            }
        };

        // ── Plain path columns ──
        User::whereNotNull('avatar')->select('id', 'display_name', 'avatar')->chunk(500, function ($rows) use ($add) {
            foreach ($rows as $r) {
                $add($r->avatar, 'avatar', 'Avatar — '.$r->display_name, '/admin/user-management?search='.urlencode($r->display_name));
            }
        });

        Series::whereNotNull('cover_url')->select('id', 'title', 'slug', 'cover_url')->chunk(500, function ($rows) use ($add) {
            foreach ($rows as $r) {
                $add($r->cover_url, 'series-cover', 'Series cover — '.$r->title, '/admin/series/'.$r->id);
            }
        });

        EbookSeries::whereNotNull('cover')->select('id', 'title', 'cover')->chunk(500, function ($rows) use ($add) {
            foreach ($rows as $r) {
                $add($r->cover, 'ebook-cover', 'EPUB series cover — '.$r->title, '/admin/ebook-series/'.$r->id);
            }
        });

        EbookItem::select('id', 'ebook_series_id', 'title', 'cover', 'file_path', 'pdf_file_path')
            ->chunk(500, function ($rows) use ($add) {
                foreach ($rows as $r) {
                    $url = '/admin/ebook-series/'.$r->ebook_series_id;
                    $add($r->cover, 'ebook-item-cover', 'Volume cover — '.$r->title, $url);
                    $add($r->file_path, 'epub', 'EPUB file — '.$r->title, $url);
                    $add($r->pdf_file_path, 'pdf', 'PDF file — '.$r->title, $url);
                }
            });

        if (class_exists(Advertisement::class)) {
            Advertisement::select('id', 'advertiser_name', 'file_path_desktop', 'file_path_mobile')
                ->chunk(500, function ($rows) use ($add) {
                    foreach ($rows as $r) {
                        $label = $r->advertiser_name ?: 'Advertisement #'.$r->id;
                        $add($r->file_path_desktop, 'ad', $label.' (desktop)', '/admin/advertisements');
                        $add($r->file_path_mobile, 'ad', $label.' (mobile)', '/admin/advertisements');
                    }
                });
        }

        // ── HTML bodies ──
        // Chunked and column-limited: chapters.content is longText and there are
        // thousands of rows, so loading them all at once would exhaust memory.
        Chapter::select('id', 'series_id', 'title', 'chapter_number', 'chapter_link', 'content')
            ->with('series:id,title,slug')
            ->chunkById(self::CHUNK, function ($rows) use ($addMany) {
                foreach ($rows as $r) {
                    $paths = $this->extractFromHtml($r->content);

                    if (! $paths) {
                        continue;
                    }

                    $series = $r->series?->title ?? 'Unknown series';
                    $label = $series.' — '.($r->title ?: 'Chapter '.$r->chapter_number);

                    $addMany($paths, 'chapter', $label, '/admin/chapters/'.$r->id.'/edit');
                }
            });

        EbookItem::whereNotNull('preview_content')
            ->select('id', 'ebook_series_id', 'title', 'preview_content')
            ->chunkById(self::CHUNK, function ($rows) use ($addMany) {
                foreach ($rows as $r) {
                    $addMany(
                        $this->extractFromHtml($r->preview_content),
                        'preview',
                        'Volume preview — '.$r->title,
                        '/admin/ebook-series/'.$r->ebook_series_id
                    );
                }
            });

        if (class_exists(Blog::class)) {
            Blog::select('id', 'title', 'content')->chunkById(self::CHUNK, function ($rows) use ($addMany) {
                foreach ($rows as $r) {
                    $addMany($this->extractFromHtml($r->content), 'blog', 'Blog — '.$r->title, '/admin/blogs/'.$r->id.'/edit');
                }
            });
        }

        // ── Homepage banners: a JSON file, not a table ──
        // Missing this source would condemn every live banner as an orphan.
        foreach ($this->homepageBannerPaths() as $path) {
            $map[$path][] = ['type' => 'banner', 'label' => 'Homepage banner', 'url' => '/admin/misc'];
        }

        return $this->references = $map;
    }

    /**
     * Banner paths from storage/app/private/homepage-config.json.
     *
     * Read defensively: if the file is unreadable or malformed we cannot prove
     * anything is unused, so the safe answer is to claim every banner on disk is
     * referenced rather than to return an empty list.
     *
     * @return array<int, string>
     */
    private function homepageBannerPaths(): array
    {
        $disk = Storage::disk('local');

        try {
            if (! $disk->exists('homepage-config.json')) {
                return $this->allFilesIn('public', 'banners');
            }

            $config = json_decode((string) $disk->get('homepage-config.json'), true, 512, JSON_THROW_ON_ERROR);
        } catch (\Throwable) {
            return $this->allFilesIn('public', 'banners');
        }

        if (! is_array($config)) {
            return $this->allFilesIn('public', 'banners');
        }

        $paths = [];

        foreach ($config['banners'] ?? [] as $banner) {
            if ($path = $this->normalise($banner['image_path'] ?? null)) {
                $paths[] = $path;
            }
        }

        // Any other value in the file that happens to name a file we own.
        foreach ($this->extractFromHtml(json_encode($config)) as $path) {
            $paths[] = $path;
        }

        return array_values(array_unique($paths));
    }

    /** @return array<int, string> */
    private function allFilesIn(string $disk, string $dir): array
    {
        return array_values(array_filter(
            Storage::disk($disk)->files($dir),
            fn ($p) => ! str_ends_with($p, '.gitignore')
        ));
    }

    // ─── Scanning ────────────────────────────────────────────────────────────

    /**
     * Every file this manager owns, with its verdict.
     *
     * @return array<int, array<string, mixed>>
     */
    public function scan(): array
    {
        $references = $this->references();
        $thumbs = app(ThumbnailService::class);
        $files = [];

        foreach ([['public', self::PUBLIC_DIRS], ['local', self::PRIVATE_DIRS]] as [$diskName, $dirs]) {
            $disk = Storage::disk($diskName);

            foreach ($dirs as $dir) {
                if (! $disk->directoryExists($dir)) {
                    continue;
                }

                foreach ($disk->files($dir) as $path) {
                    if (str_ends_with($path, '.gitignore')) {
                        continue;
                    }

                    $size = (int) $disk->size($path);
                    $usedBy = $references[$path] ?? [];

                    $files[] = [
                        'path' => $path,
                        'disk' => $diskName,
                        'dir' => $dir,
                        'name' => basename($path),
                        'ext' => strtolower(pathinfo($path, PATHINFO_EXTENSION)),
                        'size' => $size,
                        'modified' => $disk->lastModified($path),
                        'used' => $usedBy !== [],
                        'used_by' => array_slice($usedBy, 0, 6),
                        'used_by_count' => count($usedBy),
                        // Relative on purpose. The public disk's url() is built
                        // from APP_URL, so browsing the admin from any other host
                        // — a staging subdomain, say — pointed every thumbnail at
                        // a domain that may be unreachable. A root-relative path
                        // resolves against whatever host is serving the page.
                        'url' => $diskName === 'public' ? '/storage/'.$path : null,
                        // Optional by design. The listing shows this when it
                        // exists and an icon when it does not — what it must
                        // never do is fall back to the full image, which is the
                        // half-megabyte file this page existed to help manage.
                        'thumb' => $diskName === 'public' && $thumbs->has($path)
                            ? '/storage/'.$thumbs->pathFor($path)
                            : null,
                        'hash' => $size <= self::MAX_HASH_BYTES ? $this->hash($diskName, $path) : null,
                    ];
                }
            }
        }

        return $files;
    }

    private function hash(string $disk, string $path): ?string
    {
        try {
            $full = Storage::disk($disk)->path($path);

            return is_readable($full) ? sha1_file($full) : null;
        } catch (\Throwable) {
            return null;
        }
    }

    /**
     * References pointing at files that are no longer on disk.
     *
     * The mirror image of an orphan, and the more urgent of the two: these are
     * broken images already visible to readers.
     *
     * @return array<int, array<string, mixed>>
     */
    public function missing(): array
    {
        $missing = [];

        foreach ($this->references() as $path => $referrers) {
            $disk = str_starts_with($path, 'ebook-files/') ? 'local' : 'public';

            if (Storage::disk($disk)->exists($path)) {
                continue;
            }

            $missing[] = [
                'path' => $path,
                'disk' => $disk,
                'used_by' => array_slice($referrers, 0, 6),
                'used_by_count' => count($referrers),
            ];
        }

        return $missing;
    }

    /**
     * Summary counts, grouped by directory.
     *
     * @param  array<int, array<string, mixed>>  $files
     * @return array<string, mixed>
     */
    public function summarise(array $files): array
    {
        $dirs = [];
        $totalSize = 0;
        $unusedSize = 0;
        $unusedCount = 0;

        foreach ($files as $f) {
            $d = $f['dir'];
            $dirs[$d] ??= ['dir' => $d, 'disk' => $f['disk'], 'files' => 0, 'size' => 0, 'unused' => 0, 'unused_size' => 0];
            $dirs[$d]['files']++;
            $dirs[$d]['size'] += $f['size'];
            $totalSize += $f['size'];

            if (! $f['used']) {
                $dirs[$d]['unused']++;
                $dirs[$d]['unused_size'] += $f['size'];
                $unusedCount++;
                $unusedSize += $f['size'];
            }
        }

        ksort($dirs);

        return [
            'total_files' => count($files),
            'total_size' => $totalSize,
            'unused_files' => $unusedCount,
            'unused_size' => $unusedSize,
            'directories' => array_values($dirs),
        ];
    }

    /**
     * Groups of byte-identical files, largest wasted space first.
     *
     * @param  array<int, array<string, mixed>>  $files
     * @return array<int, array<string, mixed>>
     */
    public function duplicates(array $files): array
    {
        $byHash = [];

        foreach ($files as $f) {
            if ($f['hash']) {
                $byHash[$f['hash']][] = $f;
            }
        }

        $groups = [];

        foreach ($byHash as $hash => $group) {
            if (count($group) < 2) {
                continue;
            }

            $groups[] = [
                'hash' => $hash,
                'count' => count($group),
                'size' => $group[0]['size'],
                // What could be reclaimed by keeping one copy.
                'wasted' => $group[0]['size'] * (count($group) - 1),
                'files' => array_map(fn ($f) => [
                    'path' => $f['path'],
                    'used' => $f['used'],
                    'url' => $f['url'],
                ], $group),
            ];
        }

        usort($groups, fn ($a, $b) => $b['wasted'] <=> $a['wasted']);

        return $groups;
    }

    /** Total bytes held by the public and private disks this manager covers. */
    public function diskUsage(): array
    {
        $root = Storage::disk('public')->path('');

        return [
            'free' => @disk_free_space($root) ?: null,
            'total' => @disk_total_space($root) ?: null,
        ];
    }
}
