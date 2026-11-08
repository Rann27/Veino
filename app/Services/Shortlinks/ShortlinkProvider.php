<?php

namespace App\Services\Shortlinks;

/**
 * An ad-gate shortener the free unlock can send readers through.
 *
 * The unlock flow only ever needs one thing from a provider: a shortlink that
 * puts the reader through the provider's gate and lands them on our claim URL.
 * Everything that differs between providers and matters to the security
 * checks (how long an honest run takes, which hosts the reader comes back
 * from) lives in config/shortlink.php, keyed by name().
 */
interface ShortlinkProvider
{
    /** Key in config/shortlink.php and in the admin's provider setting. */
    public function name(): string;

    /** Shown in the admin. */
    public function label(): string;

    /** Whether the credentials it needs are present. */
    public function configured(): bool;

    /**
     * A shortlink to $url, or null when one could not be made. Never throws:
     * a shortener being down must not take a chapter page with it.
     */
    public function createLink(string $url, ?string $title = null): ?string;

    /** Why the last createLink() failed, in words an admin can act on. */
    public function lastError(): ?string;
}
