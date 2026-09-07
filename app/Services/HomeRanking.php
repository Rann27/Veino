<?php

namespace App\Services;

use App\Models\Series;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

/**
 * Picks the homepage hero and featured rows from actual reader traffic.
 *
 * Both used to be hand-curated in the Misc admin page. That list went stale the
 * moment attention moved on, so the site kept promoting whatever was interesting
 * a month ago. These two rankings follow readers instead.
 *
 * Only light novels are ranked. Web novels are legacy and no longer worked on,
 * so letting them compete would surface titles that will never be updated again.
 */
class HomeRanking
{
    /** The hero is decided once a day and held, so the top of the page is stable. */
    private const HERO_CACHE_KEY = 'home:hero-series';

    private const HERO_WINDOW_HOURS = 24;

    /**
     * Featured refreshes often enough to feel live without recounting traffic on
     * every visit — it stands in for a trending row.
     */
    private const FEATURED_CACHE_KEY = 'home:featured-series';

    private const FEATURED_WINDOW_DAYS = 3;

    private const FEATURED_CACHE_MINUTES = 15;

    /**
     * Series ids for the hero slider, most-read first.
     *
     * Computed from the previous 24 hours and then frozen for 24 hours: a hero
     * that reshuffles on every page load is disorienting, and the point of the
     * slot is prominence rather than immediacy.
     *
     * @return array<int, int>
     */
    public function heroSeriesIds(int $limit = 5): array
    {
        return Cache::remember(
            self::HERO_CACHE_KEY.":{$limit}",
            now()->addHours(self::HERO_WINDOW_HOURS),
            fn () => $this->rankByViews(now()->subHours(self::HERO_WINDOW_HOURS), $limit)
        );
    }

    /**
     * Series ids for the featured row, most-read first.
     *
     * @return array<int, int>
     */
    public function featuredSeriesIds(int $limit = 10): array
    {
        return Cache::remember(
            self::FEATURED_CACHE_KEY.":{$limit}",
            now()->addMinutes(self::FEATURED_CACHE_MINUTES),
            fn () => $this->rankByViews(now()->subDays(self::FEATURED_WINDOW_DAYS), $limit)
        );
    }

    /** Drops both caches — used after the ranking rules or windows change. */
    public function forget(): void
    {
        foreach ([1, 5, 8, 10, 12, 16] as $limit) {
            Cache::forget(self::HERO_CACHE_KEY.":{$limit}");
            Cache::forget(self::FEATURED_CACHE_KEY.":{$limit}");
        }
    }

    /**
     * Light novels ordered by page views since $since, most read first.
     *
     * A series page view and a chapter page view both count, and count equally:
     * a reader who opens five chapters is more engaged than one who glances at
     * the cover, and the ranking should say so.
     *
     * Falls back to the newest ongoing light novels when the window is empty —
     * a quiet night, or a site that has just launched, must not leave the
     * homepage blank.
     *
     * @return array<int, int>
     */
    private function rankByViews(\DateTimeInterface $since, int $limit): array
    {
        $ranked = DB::table('page_views')
            ->join('series', 'series.id', '=', 'page_views.series_id')
            ->where('series.type', 'light-novel')
            ->whereIn('page_views.page_type', ['series', 'chapter'])
            ->where('page_views.created_at', '>=', $since)
            ->groupBy('page_views.series_id')
            ->orderByDesc(DB::raw('COUNT(*)'))
            ->limit($limit)
            ->pluck('page_views.series_id')
            ->map(fn ($id) => (int) $id)
            ->all();

        if (count($ranked) >= $limit) {
            return $ranked;
        }

        // Top up rather than replace, so a partial result keeps the titles that
        // did earn their place at the front.
        $filler = Series::where('type', 'light-novel')
            ->when($ranked, fn ($q) => $q->whereNotIn('id', $ranked))
            ->where('status', 'ongoing')
            ->orderByDesc('created_at')
            ->limit($limit - count($ranked))
            ->pluck('id')
            ->map(fn ($id) => (int) $id)
            ->all();

        return array_merge($ranked, $filler);
    }
}
