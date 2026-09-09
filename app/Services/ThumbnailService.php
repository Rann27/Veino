<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;

/**
 * Small stand-ins for the images shown in listings.
 *
 * Covers are uploaded at print-ish sizes — routinely half a megabyte — and a
 * homepage that shows two dozen of them was shipping more image bytes than the
 * rest of the page put together, at a display size of about 200 pixels. These
 * are the same pictures at the size they are actually looked at.
 *
 * Thumbnails are an optimisation and nothing more. Every reader of this class
 * falls back to the original when one is missing, so a failed generation, a
 * server without GD, or a file added before any of this existed all degrade to
 * exactly the behaviour from before rather than to a broken image.
 */
class ThumbnailService
{
    /** Where generated files live, mirroring the source directory beneath. */
    public const DIR = 'thumbs';

    /**
     * Chapter illustrations are deliberately excluded.
     *
     * They are the bulk of the library by a wide margin and they are never
     * shown in a listing — the only place they appear is inside the chapter
     * body, at full size. Generating them would multiply the backfill for no
     * one's benefit.
     */
    public const SKIP_DIRS = ['chapter-images'];

    /**
     * Wide enough to stay sharp on a retina card, small enough to be cheap.
     *
     * The largest a cover is ever drawn is about 187px — the series card, whose
     * 280px height at 2:3 works out that wide — with the explore grid just
     * behind it at 176px. Double that for a high-DPI screen and 400 clears both
     * with room to spare, where the 300 this started at would have been under
     * 2x on exactly the two biggest placements. The extra costs ~13 KB an image
     * against an original of 826 KB, which is not a trade worth agonising over.
     */
    private const WIDTH = 400;

    private const QUALITY = 72;

    /** Sources beyond this are left alone rather than risking the memory. */
    private const MAX_PIXELS = 50_000_000;

    /** Ceiling on a remote fetch, so one bad URL cannot stall a backfill. */
    private const MAX_DOWNLOAD_BYTES = 20 * 1024 * 1024;

    private const READABLE = ['jpg', 'jpeg', 'png', 'webp', 'gif'];

    /** Per-request memo so a listing does not stat the same file repeatedly. */
    private array $exists = [];

    /** Whether this server can make thumbnails at all. */
    public function available(): bool
    {
        return extension_loaded('gd') && function_exists('imagewebp');
    }

    /**
     * Where a source image's thumbnail belongs, or null if it should not have
     * one.
     *
     * The source extension is kept in the name — `cover.jpg` becomes
     * `cover.jpg.webp` — so two uploads that differ only by format cannot
     * collide on a single thumbnail.
     */
    public function pathFor(string $source): ?string
    {
        // Most series covers are CDN links rather than uploads, and a CDN does
        // not resize on our behalf — the homepage was pulling full-resolution
        // files straight from jsdelivr. Those get a locally generated thumbnail
        // keyed by a hash of the URL, so the listing loads ours while the
        // original link stays as the fallback and the source of truth.
        if (filter_var($source, FILTER_VALIDATE_URL)) {
            // A cover saved while the app ran on another host comes back as an
            // absolute link to our own storage — `http://localhost:8000/storage/…`
            // from a dev session, or the live domain. Fetching those over the
            // network to reach a file already on disk would be absurd, and off a
            // dev machine it simply fails, so they are unwound to a plain path.
            if ($local = $this->localise($source)) {
                $source = $local;
            } else {
                return in_array(parse_url($source, PHP_URL_SCHEME), ['http', 'https'], true)
                    ? self::DIR.'/remote/'.sha1($source).'.webp'
                    : null;
            }
        }

        $source = ltrim(str_replace('\\', '/', $source), '/');
        $source = preg_replace('#^storage/#', '', $source);

        if ($source === '' || str_contains($source, '..')) {
            return null;
        }

        $dir = strtok($source, '/');

        if ($dir === self::DIR || in_array($dir, self::SKIP_DIRS, true)) {
            return null;
        }

        if (! in_array(strtolower(pathinfo($source, PATHINFO_EXTENSION)), self::READABLE, true)) {
            return null;
        }

        return self::DIR.'/'.$source.'.webp';
    }

    /** Whether a thumbnail is on disk for this source. */
    public function has(string $source): bool
    {
        $path = $this->pathFor($source);

        if (! $path) {
            return false;
        }

        return $this->exists[$path] ??= Storage::disk('public')->exists($path);
    }

    /**
     * The URL a listing should use: the thumbnail when there is one, the
     * original otherwise. Never null when given a usable source.
     */
    public function urlFor(?string $source): ?string
    {
        if (! $source) {
            return null;
        }

        // A remote cover falls back to the CDN link itself, which is what the
        // page used before any of this existed.
        if (filter_var($source, FILTER_VALIDATE_URL)) {
            return $this->has($source)
                ? asset('storage/'.$this->pathFor($source))
                : $source;
        }

        if ($this->has($source)) {
            return asset('storage/'.$this->pathFor($source));
        }

        $clean = preg_replace('#^storage/#', '', ltrim($source, '/'));

        return asset('storage/'.$clean);
    }

    /**
     * Makes the thumbnail. Returns false when there is nothing to do or the
     * source cannot be read — never throws, because no listing should break
     * over a picture that failed to shrink.
     */
    public function generate(string $source, bool $force = false): bool
    {
        $path = $this->pathFor($source);

        if (! $path || ! $this->available()) {
            return false;
        }

        $disk = Storage::disk('public');

        if (! $force && $disk->exists($path)) {
            return false;
        }

        $temporary = null;

        if (filter_var($source, FILTER_VALIDATE_URL) && ($local = $this->localise($source))) {
            $source = $local;
        }

        if (filter_var($source, FILTER_VALIDATE_URL)) {
            $absolute = $temporary = $this->download($source);

            if (! $absolute) {
                return false;
            }
        } else {
            $clean = preg_replace('#^storage/#', '', ltrim($source, '/'));

            if (! $disk->exists($clean)) {
                return false;
            }

            $absolute = $disk->path($clean);
        }

        try {
            return $this->render($absolute, $path);
        } finally {
            if ($temporary) {
                @unlink($temporary);
            }
        }
    }

    /**
     * Turns a link to our own storage back into the path beneath it.
     *
     * Matches on the `/storage/` segment rather than on the host: the domain a
     * cover was saved under is exactly the thing that cannot be trusted to
     * still be current, whereas the path after it is stable.
     *
     * @return string|null the relative path, or null when the URL is genuinely
     *                     somebody else's
     */
    private function localise(string $url): ?string
    {
        $path = parse_url($url, PHP_URL_PATH) ?: '';
        $at = strpos($path, '/storage/');

        if ($at === false) {
            return null;
        }

        $relative = ltrim(substr($path, $at + strlen('/storage/')), '/');

        return $relative === '' ? null : rawurldecode($relative);
    }

    /**
     * Fetches a remote image to a temporary file.
     *
     * Capped and time-limited: a cover that turns out to be enormous, or a host
     * that stops responding, must not be able to stall a backfill or exhaust
     * memory. Returns null on anything unexpected.
     */
    private function download(string $url): ?string
    {
        try {
            $response = Http::timeout(15)->withOptions(['stream' => false])->get($url);

            if (! $response->successful()) {
                return null;
            }

            $body = $response->body();

            if ($body === '' || strlen($body) > self::MAX_DOWNLOAD_BYTES) {
                return null;
            }

            $temporary = tempnam(sys_get_temp_dir(), 'thumb');
            file_put_contents($temporary, $body);

            return $temporary;
        } catch (\Throwable) {
            return null;
        }
    }

    /** Does the actual shrinking, from any readable file on disk. */
    private function render(string $absolute, string $path): bool
    {
        $disk = Storage::disk('public');
        $size = @getimagesize($absolute);

        if (! $size || $size[0] < 1 || $size[1] < 1) {
            return false;
        }

        if ($size[0] * $size[1] > self::MAX_PIXELS) {
            return false;
        }

        $image = $this->read($absolute, $size['mime'] ?? '');

        if (! $image) {
            return false;
        }

        try {
            // An image already smaller than the target is copied rather than
            // enlarged — upscaling would add bytes to save none.
            $width = min(self::WIDTH, $size[0]);
            $height = max(1, (int) round($size[1] * ($width / $size[0])));

            $canvas = imagecreatetruecolor($width, $height);

            // Transparent sources keep their transparency; WebP carries alpha,
            // so a PNG logo does not gain a black background on the way through.
            imagealphablending($canvas, false);
            imagesavealpha($canvas, true);
            imagefill($canvas, 0, 0, imagecolorallocatealpha($canvas, 0, 0, 0, 127));

            imagecopyresampled($canvas, $image, 0, 0, 0, 0, $width, $height, $size[0], $size[1]);

            $disk->makeDirectory(dirname($path));

            ob_start();
            $ok = imagewebp($canvas, null, self::QUALITY);
            $bytes = ob_get_clean();

            imagedestroy($canvas);

            if (! $ok || $bytes === '' || $bytes === false) {
                return false;
            }

            $disk->put($path, $bytes);
            unset($this->exists[$path]);

            return true;
        } finally {
            imagedestroy($image);
        }
    }

    /** Removes a thumbnail, used when its source is deleted or replaced. */
    public function forget(?string $source): void
    {
        if (! $source || ! ($path = $this->pathFor($source))) {
            return;
        }

        Storage::disk('public')->delete($path);
        unset($this->exists[$path]);
    }

    /** @return \GdImage|false */
    private function read(string $absolute, string $mime)
    {
        return match ($mime) {
            'image/jpeg' => @imagecreatefromjpeg($absolute),
            'image/png' => @imagecreatefrompng($absolute),
            'image/webp' => @imagecreatefromwebp($absolute),
            'image/gif' => @imagecreatefromgif($absolute),
            default => false,
        };
    }
}
