<?php

namespace App\Services;

use App\Services\Shortlinks\ShortlinkProvider;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Thin wrapper over the Move2Link REST API.
 *
 * Only one operation is needed: turn one of our unlock URLs into a shortlink
 * that puts the reader through the ad gate. Links are created once per chapter
 * and cached in the database, because Move2Link rate limits per IP — and that
 * IP is our server, shared by every reader.
 */
class Move2LinkClient implements ShortlinkProvider
{
    public function name(): string
    {
        return 'move2link';
    }

    public function label(): string
    {
        return 'Move2Link';
    }

    /**
     * Why the last call failed, in words an admin can act on.
     *
     * The API's own reason used to end up in the log only, so the admin saw a
     * generic "check your token" while the real problem was something else
     * entirely — a localhost URL, for instance.
     */
    private ?string $lastError = null;

    public function lastError(): ?string
    {
        return $this->lastError;
    }

    public function configured(): bool
    {
        return ! empty(config('move2link.token'));
    }

    /**
     * Shorteners can only point at addresses the public internet can reach.
     * Catching this before the call turns a confusing 400 into a clear answer.
     */
    private function publiclyReachable(string $url): bool
    {
        return self::isPubliclyReachable($url);
    }

    /** Shared with the other providers: none of them can reach a local address. */
    public static function isPubliclyReachable(string $url): bool
    {
        $host = strtolower((string) parse_url($url, PHP_URL_HOST));

        if ($host === '' || $host === 'localhost' || str_ends_with($host, '.localhost')) {
            return false;
        }

        if (in_array($host, ['127.0.0.1', '::1'], true)) {
            return false;
        }

        // Common local-development suffixes.
        foreach (['.test', '.local', '.localhost', '.invalid', '.example'] as $suffix) {
            if (str_ends_with($host, $suffix)) {
                return false;
            }
        }

        // A bare private IP is equally unreachable from their side.
        if (filter_var($host, FILTER_VALIDATE_IP) && ! filter_var($host, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE)) {
            return false;
        }

        return true;
    }

    /**
     * Creates a shortlink, or returns null when it could not be created.
     *
     * Never throws: a shortener being down must not take a chapter page with
     * it. Callers treat null as "challenge unavailable right now".
     */
    public function createLink(string $url, ?string $title = null): ?string
    {
        $this->lastError = null;

        if (! $this->configured()) {
            $this->lastError = 'MOVE2LINK_TOKEN is not set in .env.';
            Log::warning('Move2Link token is not configured.');

            return null;
        }

        if (! $this->publiclyReachable($url)) {
            $this->lastError = "Move2Link cannot shorten a local address ({$url}). "
                .'Set APP_URL to your public domain — this only works on the live site.';
            Log::warning('Move2Link skipped: URL is not publicly reachable — '.$url);

            return null;
        }

        try {
            $response = Http::withToken(config('move2link.token'))
                ->acceptJson()
                ->timeout((int) config('move2link.timeout', 12))
                ->post(config('move2link.endpoint'), array_filter([
                    'url' => $url,
                    'title' => $title ? mb_substr($title, 0, 255) : null,
                    // Explicit 0 = plain link, no paywall. Omitting it would
                    // fall back to the account's Default Paywall Price.
                    'price' => config('move2link.price', 0),
                ], fn ($value) => $value !== null));
        } catch (\Throwable $e) {
            $this->lastError = 'Could not reach Move2Link: '.$e->getMessage();
            Log::warning('Move2Link request failed: '.$e->getMessage());

            return null;
        }

        if ($response->status() === 429) {
            $retry = $response->header('Retry-After');
            $this->lastError = 'Move2Link rate limit reached.'.($retry ? " Try again in {$retry}s." : ' Try again shortly.');
            Log::warning('Move2Link rate limit hit. Retry-After: '.$retry);

            return null;
        }

        if (! $response->successful()) {
            // Their payload carries the real reason under status.error — far
            // more useful to an admin than the bare status code.
            $reason = data_get($response->json(), 'status.error')
                ?: data_get($response->json(), 'status.message');

            $this->lastError = $reason
                ? "Move2Link rejected the link: {$reason}"
                : 'Move2Link returned HTTP '.$response->status().'.';

            Log::warning('Move2Link returned '.$response->status().': '.mb_substr($response->body(), 0, 300));

            return null;
        }

        $shortLink = data_get($response->json(), 'data.short_link');

        if (! is_string($shortLink) || $shortLink === '') {
            $this->lastError = 'Move2Link replied without a short link.';
            Log::warning('Move2Link response had no short_link: '.mb_substr($response->body(), 0, 300));

            return null;
        }

        return $shortLink;
    }
}
