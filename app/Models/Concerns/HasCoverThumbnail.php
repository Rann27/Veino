<?php

namespace App\Models\Concerns;

use App\Services\ThumbnailService;

/**
 * Gives a model a `thumb_url` for use in listings.
 *
 * The contract is that this is always safe to use in place of `cover_url`: when
 * no thumbnail has been generated — an old upload, a CDN link, a server without
 * GD — it returns exactly what `cover_url` would have. Callers never have to
 * check, and a missing thumbnail can only ever cost bandwidth, never a picture.
 */
trait HasCoverThumbnail
{
    public function getThumbUrlAttribute(): ?string
    {
        $source = $this->thumbnailSource();

        if (! $source) {
            return $this->cover_url;
        }

        return app(ThumbnailService::class)->urlFor($source) ?? $this->cover_url;
    }

    /**
     * The stored path a thumbnail would be derived from — the raw column, not
     * the accessor, since the accessor has already turned it into a URL.
     */
    abstract protected function thumbnailSource(): ?string;
}
