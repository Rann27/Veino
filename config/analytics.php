<?php

return [
    /*
    | Master switch for the self-hosted pageview tracking.
    */
    'enabled' => env('ANALYTICS_ENABLED', true),

    /*
    | How many days of raw page_views rows to keep. Older rows are removed by
    | `analytics:prune` once they have been rolled up into analytics_daily.
    */
    'retention_days' => (int) env('ANALYTICS_RETENTION_DAYS', 120),

    /*
    | Don't count admins browsing their own site.
    */
    'exclude_admins' => (bool) env('ANALYTICS_EXCLUDE_ADMINS', true),

    /*
    | Path prefixes that are never tracked.
    */
    'exclude_paths' => [
        'admin',
        'api',
        'storage',
        'build',
        'up',
        'livewire',
        'sanctum',
        '_debugbar',
    ],

    /*
    | Route name prefixes that are never tracked. Belt-and-braces alongside
    | exclude_paths, so an admin screen mounted outside /admin still escapes.
    */
    'exclude_route_prefixes' => [
        'admin.',
    ],

    /*
    | Country lookup. A CDN-provided header (Cloudflare's CF-IPCountry) always
    | wins. Failing that, `lookup` resolves the country from the IP once per
    | unique visitor and caches the result — never once per pageview.
    |
    | driver: 'none'   — header only
    |         'ip-api' — free, keyless, ~45 lookups/min (http only on free tier)
    |         'ipapi'  — ipapi.co, free tier ~1k/day, https
    */
    'geo' => [
        'enabled' => (bool) env('ANALYTICS_GEO_ENABLED', true),
        'driver' => env('ANALYTICS_GEO_DRIVER', 'ip-api'),
        'timeout' => 2,
        'cache_days' => 30,
    ],

    /*
    | Google Analytics 4 measurement ID (e.g. G-XXXXXXXXXX). When set, the
    | gtag.js snippet is injected on the public site.
    */
    'ga_measurement_id' => env('GA_MEASUREMENT_ID'),
];
