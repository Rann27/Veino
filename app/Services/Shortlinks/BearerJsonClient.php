<?php

namespace App\Services\Shortlinks;

use App\Services\Move2LinkClient;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Shorteners with a JSON REST endpoint and a bearer token:
 *
 *   POST {endpoint}   Authorization: Bearer TOKEN   {"url": "...", ...}
 *
 * SafelinkU answers {"url": "https://sfl.gl/xxxx"}; Nexolink answers
 * {"ok": true, "data": {"short_url": "https://nxlnk.cc/xxxx"}}. Where the link
 * sits, and any extra body fields, come from config/shortlink.php
 * `providers.{name}` (`link_path`, `body`).
 */
class BearerJsonClient implements ShortlinkProvider
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

        $body = array_merge(['url' => $url], (array) $this->cfg('body', []));
        if ($title && $this->cfg('send_title', false)) {
            $body['title'] = mb_substr($title, 0, 200);
        }

        try {
            $response = Http::withToken((string) $this->cfg('token'))
                ->acceptJson()
                ->asJson()
                ->timeout((int) $this->cfg('timeout', 12))
                ->post($this->cfg('endpoint'), $body);
        } catch (\Throwable $e) {
            $this->lastError = "Could not reach {$this->label}: ".$e->getMessage();
            Log::warning("{$this->label} request failed: ".$e->getMessage());

            return null;
        }

        if ($response->status() === 429) {
            $this->lastError = "{$this->label} rate limit reached. Try again shortly.";

            return null;
        }

        $short = data_get($response->json(), (string) $this->cfg('link_path', 'url'));

        if (! $response->successful() || ! is_string($short) || ! str_starts_with($short, 'http')) {
            $reason = data_get($response->json(), 'message') ?? data_get($response->json(), 'error.message') ?? data_get($response->json(), 'error');
            $this->lastError = is_string($reason) && $reason !== ''
                ? "{$this->label} rejected the link: {$reason}"
                : "{$this->label} returned HTTP {$response->status()} without a link.";
            Log::warning("{$this->label} returned {$response->status()}: ".mb_substr($response->body(), 0, 300));

            return null;
        }

        return $short;
    }
}
