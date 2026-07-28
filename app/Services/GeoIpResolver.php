<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Resolves an IP address to an ISO-3166 alpha-2 country code.
 *
 * A CDN header always wins — it costs nothing. Otherwise an external lookup
 * runs, but the result is cached per IP so a busy site makes at most one call
 * per address per month, never one per pageview.
 */
class GeoIpResolver
{
    /** Cached when a lookup fails, so a dead provider isn't retried on every hit. */
    private const MISS = '??';

    public function fromHeaders(\Illuminate\Http\Request $request): ?string
    {
        foreach (['CF-IPCountry', 'X-Vercel-IP-Country', 'X-Country-Code', 'X-Geo-Country'] as $header) {
            $code = $request->header($header);

            if ($this->valid($code)) {
                return strtoupper($code);
            }
        }

        $server = $request->server('GEOIP_COUNTRY_CODE');

        return $this->valid($server) ? strtoupper($server) : null;
    }

    public function resolve(?string $ip): ?string
    {
        if (! config('analytics.geo.enabled', true) || ! $ip || ! $this->isPublic($ip)) {
            return null;
        }

        $driver = config('analytics.geo.driver', 'ip-api');

        if ($driver === 'none') {
            return null;
        }

        $key = 'analytics:geo:'.md5($ip);
        $cached = Cache::get($key);

        if ($cached !== null) {
            return $cached === self::MISS ? null : $cached;
        }

        $code = $this->lookup($driver, $ip);

        Cache::put(
            $key,
            $code ?? self::MISS,
            // Remember hits for a month; retry misses in an hour.
            $code ? now()->addDays((int) config('analytics.geo.cache_days', 30)) : now()->addHour()
        );

        return $code;
    }

    private function lookup(string $driver, string $ip): ?string
    {
        $timeout = (int) config('analytics.geo.timeout', 2);

        try {
            $response = match ($driver) {
                'ipapi' => Http::timeout($timeout)->get("https://ipapi.co/{$ip}/country/"),
                default => Http::timeout($timeout)->get("http://ip-api.com/json/{$ip}", [
                    'fields' => 'status,countryCode',
                ]),
            };

            if (! $response->successful()) {
                return null;
            }

            if ($driver === 'ipapi') {
                $code = trim($response->body());

                return $this->valid($code) ? strtoupper($code) : null;
            }

            $json = $response->json();

            if (($json['status'] ?? null) !== 'success') {
                return null;
            }

            $code = $json['countryCode'] ?? null;

            return $this->valid($code) ? strtoupper($code) : null;
        } catch (\Throwable $e) {
            Log::debug('GeoIP lookup failed: '.$e->getMessage());

            return null;
        }
    }

    private function valid(?string $code): bool
    {
        return is_string($code)
            && strlen($code) === 2
            && ctype_alpha($code)
            && strtoupper($code) !== 'XX';
    }

    /** Loopback, private and reserved ranges have no country. */
    private function isPublic(string $ip): bool
    {
        return (bool) filter_var(
            $ip,
            FILTER_VALIDATE_IP,
            FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE
        );
    }
}
