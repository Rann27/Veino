<?php

namespace App\Services\Shortlinks;

use App\Services\Move2LinkClient;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * ShrinkEarn (global, pays in USD). Its API is a single GET:
 *
 *   https://shrinkearn.com/api?api=TOKEN&url=DESTINATION
 *   → {"status":"success","shortenedUrl":"https://srnky.com/xxxx"}
 *   → {"status":"error","message":"..."}
 *
 * Links come back on srnky.com; the gate itself is a 15-second countdown
 * plus a Turnstile captcha (see config/shortlink.php for what that means for
 * the timing check).
 */
class ShrinkEarnClient implements ShortlinkProvider
{
    private ?string $lastError = null;

    public function name(): string
    {
        return 'shrinkearn';
    }

    public function label(): string
    {
        return 'ShrinkEarn';
    }

    public function configured(): bool
    {
        return ! empty(config('shrinkearn.token'));
    }

    public function lastError(): ?string
    {
        return $this->lastError;
    }

    public function createLink(string $url, ?string $title = null): ?string
    {
        $this->lastError = null;

        if (! $this->configured()) {
            $this->lastError = 'SHRINKEARN_TOKEN is not set in .env.';
            Log::warning('ShrinkEarn token is not configured.');

            return null;
        }

        if (! Move2LinkClient::isPubliclyReachable($url)) {
            $this->lastError = "ShrinkEarn cannot shorten a local address ({$url}). "
                .'Set APP_URL to your public domain — this only works on the live site.';

            return null;
        }

        try {
            $response = Http::acceptJson()
                ->timeout((int) config('shrinkearn.timeout', 12))
                ->get(config('shrinkearn.endpoint'), [
                    'api' => config('shrinkearn.token'),
                    'url' => $url,
                ]);
        } catch (\Throwable $e) {
            $this->lastError = 'Could not reach ShrinkEarn: '.$e->getMessage();
            Log::warning('ShrinkEarn request failed: '.$e->getMessage());

            return null;
        }

        $status = data_get($response->json(), 'status');
        $short = data_get($response->json(), 'shortenedUrl');

        if (! $response->successful() || $status !== 'success' || ! is_string($short) || $short === '') {
            $reason = data_get($response->json(), 'message');
            $this->lastError = $reason
                ? "ShrinkEarn rejected the link: {$reason}"
                : 'ShrinkEarn returned HTTP '.$response->status().' without a link.';

            // The token travels in the query string; keep it out of the log.
            Log::warning('ShrinkEarn returned '.$response->status().': '.mb_substr($response->body(), 0, 300));

            return null;
        }

        return $short;
    }
}
