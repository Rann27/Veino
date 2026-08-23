<?php

namespace App\Http\Middleware;

use App\Models\AnalyticsVisitor;
use App\Models\PageView;
use App\Services\GeoIpResolver;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;

/**
 * Records one row in `page_views` per real page navigation.
 *
 * The work happens in terminate(), after the response has been handed to the
 * client, so neither the insert nor a country lookup adds to page load time.
 *
 * Inertia XHR navigations count (they are how the SPA moves between pages),
 * but partial reloads do not — those refetch data for a page already counted.
 */
class TrackPageView
{
    /** File types that are never a page view. */
    private const ASSET_PATTERN = '/\.(css|js|mjs|map|png|jpe?g|gif|webp|avif|svg|ico|bmp|woff2?|ttf|otf|eot|mp4|webm|ogg|mp3|wav|pdf|epub|zip|rar|7z|gz|txt|xml|json|csv|wasm)$/i';

    /** Substrings that identify non-human traffic. */
    private const BOT_PATTERN = '/bot|crawl|spider|slurp|curl|wget|python-requests|httpclient|headless|lighthouse|pingdom|uptime|monitor|scrapy|facebookexternalhit|preview|fetcher|archive\.org|semrush|ahrefs|mj12|dotbot|petalbot|bytespider|gptbot|claudebot|ccbot|perplexity/i';

    public function __construct(private GeoIpResolver $geo) {}

    public function handle(Request $request, Closure $next): Response
    {
        return $next($request);
    }

    public function terminate(Request $request, Response $response): void
    {
        try {
            if ($this->shouldTrack($request, $response)) {
                $this->record($request);
            }
        } catch (\Throwable $e) {
            Log::warning('Analytics tracking failed: '.$e->getMessage());
        }
    }

    private function shouldTrack(Request $request, Response $response): bool
    {
        if (! config('analytics.enabled', true)) {
            return false;
        }

        if (! $request->isMethod('GET')) {
            return false;
        }

        // Only successful HTML/Inertia responses.
        if ($response->getStatusCode() !== 200) {
            return false;
        }

        // Inertia partial reload = data refetch for an already-counted page.
        if ($request->header('X-Inertia-Partial-Data')) {
            return false;
        }

        // Plain XHR that isn't an Inertia navigation (autocomplete, polling, …).
        if ($request->ajax() && ! $request->header('X-Inertia')) {
            return false;
        }

        if ($this->isExcludedPath($request) || $this->isExcludedRoute($request)) {
            return false;
        }

        // Asset requests that slipped through. Matched against a known list
        // rather than "has a dot", because chapter URLs legitimately end in
        // things like `v1c12.5` — treating ".5" as a file extension silently
        // excluded every decimal chapter from analytics.
        if (preg_match(self::ASSET_PATTERN, $request->path())) {
            return false;
        }

        if (preg_match(self::BOT_PATTERN, (string) $request->userAgent())) {
            return false;
        }

        if (config('analytics.exclude_admins', true)
            && Auth::check()
            && Auth::user()->role === 'admin') {
            return false;
        }

        return true;
    }

    /** Anything under /admin (and the other excluded prefixes) is never counted. */
    private function isExcludedPath(Request $request): bool
    {
        $path = trim($request->path(), '/');

        foreach (config('analytics.exclude_paths', []) as $prefix) {
            if ($path === $prefix || Str::startsWith($path, $prefix.'/')) {
                return true;
            }
        }

        return false;
    }

    /** Catches admin screens that don't live under the /admin path. */
    private function isExcludedRoute(Request $request): bool
    {
        $name = $request->route()?->getName();

        if (! $name) {
            return false;
        }

        foreach (config('analytics.exclude_route_prefixes', []) as $prefix) {
            if (Str::startsWith($name, $prefix)) {
                return true;
            }
        }

        return false;
    }

    private function record(Request $request): void
    {
        $now = now();
        $visitorId = $this->visitorId($request);
        $ua = (string) $request->userAgent();
        $device = $this->device($ua);

        $existing = DB::table('analytics_visitors')
            ->where('visitor_id', $visitorId)
            ->first(['country']);

        // Header first (free), then whatever we already knew about this visitor,
        // and only as a last resort an actual lookup — which is cached per IP.
        $country = $this->geo->fromHeaders($request)
            ?? $existing?->country
            ?? $this->geo->resolve($request->ip());

        $isNew = $this->touchVisitor($visitorId, $existing !== null, $now, $country, $device);

        $user = Auth::user();
        [$pageType, $seriesId] = $this->classify($request);

        PageView::insert([
            'visitor_id' => $visitorId,
            'session_id' => substr(hash('xxh128', $request->session()->getId()), 0, 32),
            'user_id' => $user?->id,
            'path' => Str::limit('/'.trim($request->path(), '/'), 500, ''),
            'page_type' => $pageType,
            'series_id' => $seriesId,
            'title' => null,
            'referrer_host' => $this->referrerHost($request),
            'device' => $device,
            'browser' => $this->browser($ua),
            'os' => $this->os($ua),
            'country' => $country,
            'is_new_visitor' => $isNew,
            'is_member' => (bool) ($user && method_exists($user, 'hasActiveMembership') && $user->hasActiveMembership()),
            'created_at' => $now,
        ]);
    }

    /**
     * Stable pseudonymous id: IP + user agent + app key, hashed. The raw IP is
     * never stored, but the hash is stable across days so returning visitors
     * can be distinguished from new ones.
     */
    private function visitorId(Request $request): string
    {
        return hash('xxh128', implode('|', [
            $request->ip(),
            $request->userAgent(),
            config('app.key'),
        ]));
    }

    /** @return bool true when this visitor had never been seen before */
    private function touchVisitor(string $visitorId, bool $known, $now, ?string $country, string $device): bool
    {
        if ($known) {
            DB::table('analytics_visitors')
                ->where('visitor_id', $visitorId)
                ->update(array_filter([
                    'last_seen_at' => $now,
                    'pageviews' => DB::raw('pageviews + 1'),
                    // Backfill the country if we only just learned it.
                    'country' => $country,
                ], fn ($v) => $v !== null));

            return false;
        }

        try {
            AnalyticsVisitor::create([
                'visitor_id' => $visitorId,
                'first_seen_at' => $now,
                'last_seen_at' => $now,
                'pageviews' => 1,
                'country' => $country,
                'device' => $device,
            ]);

            return true;
        } catch (\Illuminate\Database\QueryException $e) {
            // Lost a race against a concurrent request for the same visitor.
            DB::table('analytics_visitors')
                ->where('visitor_id', $visitorId)
                ->update(['last_seen_at' => $now, 'pageviews' => DB::raw('pageviews + 1')]);

            return false;
        }
    }

    /**
     * Map the current route to a coarse page type, plus the series id when the
     * page belongs to one.
     *
     * @return array{0: string, 1: int|null}
     */
    private function classify(Request $request): array
    {
        $name = $request->route()?->getName() ?? '';
        $seriesId = null;

        $type = match (true) {
            $name === 'home' => 'home',
            $name === 'explore' => 'explore',
            $name === 'search' => 'search',
            $name === 'series.show' => 'series',
            $name === 'chapters.show' => 'chapter',
            str_starts_with($name, 'epub-novels.') => 'ebook',
            str_starts_with($name, 'blog.') => 'blog',
            str_starts_with($name, 'account.') => 'account',
            str_starts_with($name, 'membership.') => 'membership',
            in_array($name, ['shop', 'buy-coins', 'my-chart', 'bookshelf'], true) => 'shop',
            in_array($name, ['login', 'register'], true) => 'auth',
            default => 'other',
        };

        if (in_array($type, ['series', 'chapter'], true)) {
            $slug = $request->route('slug');

            if (is_object($slug) && isset($slug->id)) {
                $seriesId = $slug->id;
            } elseif (is_string($slug) && $slug !== '') {
                // Cached so the reader doesn't pay for a lookup on every chapter.
                $seriesId = Cache::remember(
                    'analytics:series-id:'.$slug,
                    now()->addHours(6),
                    fn () => DB::table('series')->where('slug', $slug)->value('id')
                );
            }
        }

        return [$type, $seriesId];
    }

    private function referrerHost(Request $request): ?string
    {
        $referrer = $request->headers->get('referer');

        if (! $referrer) {
            return null;
        }

        $host = parse_url($referrer, PHP_URL_HOST);

        if (! $host) {
            return null;
        }

        $host = preg_replace('/^www\./i', '', strtolower($host));

        // Internal navigation isn't a referral.
        $self = preg_replace('/^www\./i', '', strtolower((string) parse_url(config('app.url'), PHP_URL_HOST)));

        if ($host === $self || $host === $request->getHost()) {
            return null;
        }

        return Str::limit($host, 250, '');
    }

    private function device(string $ua): string
    {
        if (preg_match('/iPad|Tablet|PlayBook|Silk|(Android(?!.*Mobile))/i', $ua)) {
            return 'tablet';
        }

        if (preg_match('/Mobile|iPhone|iPod|Android|BlackBerry|IEMobile|Opera Mini/i', $ua)) {
            return 'mobile';
        }

        return 'desktop';
    }

    private function browser(string $ua): string
    {
        return match (true) {
            (bool) preg_match('/Edg\//i', $ua) => 'Edge',
            (bool) preg_match('/OPR\/|Opera/i', $ua) => 'Opera',
            (bool) preg_match('/SamsungBrowser/i', $ua) => 'Samsung',
            (bool) preg_match('/Firefox/i', $ua) => 'Firefox',
            (bool) preg_match('/Chrome|CriOS/i', $ua) => 'Chrome',
            (bool) preg_match('/Safari/i', $ua) => 'Safari',
            default => 'Other',
        };
    }

    private function os(string $ua): string
    {
        return match (true) {
            (bool) preg_match('/Windows/i', $ua) => 'Windows',
            (bool) preg_match('/iPhone|iPad|iPod|iOS/i', $ua) => 'iOS',
            (bool) preg_match('/Mac OS X|Macintosh/i', $ua) => 'macOS',
            (bool) preg_match('/Android/i', $ua) => 'Android',
            (bool) preg_match('/Linux/i', $ua) => 'Linux',
            default => 'Other',
        };
    }
}
