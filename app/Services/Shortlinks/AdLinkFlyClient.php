<?php

namespace App\Services\Shortlinks;

use App\Services\Move2LinkClient;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Shorteners built on the AdLinkFly script share one API:
 *
 *   GET {endpoint}?api=TOKEN&url=DESTINATION[&type=1&format=json]
 *
 * They differ only in where the link sits in the reply, so both known shapes
 * are read: {"shortenedUrl": "..."} and {"result": {"shorten_url": "..."}}.
 * Configured under config/shortlink.php `providers.{name}`.
 */
class AdLinkFlyClient implements ShortlinkProvider
{
    private ?string $lastError = null;

    public function __construct(private string $name, private string $label) {}

    public function name(): string
    {
        return $this->name;
    }

    public function label(): string
    {
        return $this->label;
    }

    private function cfg(string $key, mixed $default = null): mixed
    {
        return config("shortlink.providers.{$this->name}.{$key}", $default);
    }

    public function configured(): bool
    {
        return ! empty($this->cfg('token'));
    }

    public function lastError(): ?string
    {
        return $this->lastError;
    }

    public function createLink(string $url, ?string $title = null): ?string
    {
        $this->lastError = null;
        $env = strtoupper($this->name).'_TOKEN';

        if (! $this->configured()) {
            $this->lastError = "{$env} is not set in .env.";

            return null;
        }

        if (! Move2LinkClient::isPubliclyReachable($url)) {
            $this->lastError = "{$this->label} cannot shorten a local address ({$url}). Set APP_URL to your public domain.";

            return null;
        }

        try {
            $response = Http::acceptJson()
                ->timeout((int) $this->cfg('timeout', 12))
                ->get($this->cfg('endpoint'), array_merge(
                    ['api' => $this->cfg('token'), 'url' => $url, 'format' => 'json'],
                    (array) $this->cfg('query', []),
                ));
        } catch (\Throwable $e) {
            $this->lastError = "Could not reach {$this->label}: ".$e->getMessage();
            Log::warning("{$this->label} request failed: ".$e->getMessage());

            return null;
        }

        $json = $response->json();
        $short = data_get($json, 'shortenedUrl') ?? data_get($json, 'result.shorten_url');

        if (! $response->successful() || data_get($json, 'status') !== 'success' || ! is_string($short) || $short === '') {
            $reason = data_get($json, 'message') ?: (is_string(data_get($json, 'result')) ? data_get($json, 'result') : null);
            $this->lastError = $reason
                ? "{$this->label} rejected the link: {$reason}"
                : "{$this->label} returned HTTP {$response->status()} without a link.";
            // The token travels in the query string; only the body is logged.
            Log::warning("{$this->label} returned {$response->status()}: ".mb_substr($response->body(), 0, 300));

            return null;
        }

        return $short;
    }
}
