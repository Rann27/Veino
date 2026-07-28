<?php

namespace App\Console\Commands;

use App\Models\AnalyticsDaily;
use App\Models\AnalyticsMonthly;
use Carbon\CarbonImmutable;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

/**
 * Condenses raw page_views into permanent daily and monthly rows, so history
 * survives pruning of the raw table.
 *
 * Unique visitor counts cannot be summed from the daily table (the same person
 * visiting on two days is one monthly visitor), so months are counted directly
 * from raw rows while they are still inside the retention window.
 */
class AnalyticsRollup extends Command
{
    protected $signature = 'analytics:rollup
                            {--days=3 : How many recent days to (re)build}
                            {--all : Rebuild every day and month that has raw data}';

    protected $description = 'Aggregate raw page views into the daily and monthly tables';

    public function handle(): int
    {
        $dates = $this->option('all')
            ? $this->allRawDates()
            : $this->recentDates((int) $this->option('days'));

        if ($dates->isEmpty()) {
            $this->info('No page view data to roll up.');

            return self::SUCCESS;
        }

        foreach ($dates as $date) {
            $this->rollupDay(CarbonImmutable::parse($date));
        }

        $this->info("Rolled up {$dates->count()} day(s).");

        // Any month touched by those days needs recomputing. In --all mode also
        // sweep months that exist only in the daily table — their raw rows have
        // been pruned, so they would otherwise never be revisited.
        $months = $dates->map(fn ($d) => substr((string) $d, 0, 7));

        if ($this->option('all')) {
            $months = $months->merge($this->allDailyMonths());
        }

        $months = $months->unique()->sort()->values();

        foreach ($months as $month) {
            $this->rollupMonth($month);
        }

        $this->info("Rolled up {$months->count()} month(s): ".$months->implode(', '));

        return self::SUCCESS;
    }

    private function allRawDates()
    {
        return DB::table('page_views')
            ->selectRaw('DATE(created_at) as d')
            ->distinct()
            ->orderBy('d')
            ->pluck('d');
    }

    /** Months present in the permanent daily table, raw rows or not. */
    private function allDailyMonths()
    {
        return DB::table('analytics_daily')
            ->selectRaw("DATE_FORMAT(date, '%Y-%m') as m")
            ->distinct()
            ->pluck('m');
    }

    private function recentDates(int $days)
    {
        return collect(range($days - 1, 0))
            ->map(fn ($i) => CarbonImmutable::now()->subDays($i)->toDateString());
    }

    // ─── Daily ───────────────────────────────────────────────────────────────

    private function rollupDay(CarbonImmutable $date): void
    {
        $start = $date->startOfDay();
        $end = $date->endOfDay();

        $totals = $this->totals($start, $end);

        if (! $totals || (int) $totals->pageviews === 0) {
            return;
        }

        AnalyticsDaily::updateOrCreate(
            ['date' => $date->toDateString()],
            [
                'pageviews' => (int) $totals->pageviews,
                'visitors' => (int) $totals->visitors,
                'sessions' => (int) $totals->sessions,
                'new_visitors' => (int) $totals->new_visitors,
                'member_views' => (int) $totals->member_views,
                'guest_views' => (int) $totals->guest_views,
                'devices' => $this->group('device', $start, $end),
                'browsers' => $this->group('browser', $start, $end),
                'os' => $this->group('os', $start, $end),
                'page_types' => $this->group('page_type', $start, $end, 20),
                'top_pages' => $this->group('path', $start, $end, 20),
                'top_referrers' => $this->group('referrer_host', $start, $end, 20),
                'countries' => $this->group('country', $start, $end, 30),
            ]
        );
    }

    // ─── Monthly ─────────────────────────────────────────────────────────────

    private function rollupMonth(string $month): void
    {
        $start = CarbonImmutable::parse($month.'-01')->startOfMonth();
        $end = $start->endOfMonth();

        $activeDays = (int) DB::table('page_views')
            ->whereBetween('created_at', [$start, $end])
            ->selectRaw('COUNT(DISTINCT DATE(created_at)) as c')
            ->value('c');

        $archivedDays = AnalyticsDaily::whereBetween('date', [$start->toDateString(), $end->toDateString()])->count();

        // Raw rows are authoritative only while they still cover the whole
        // month. Once pruning has eaten into it, recomputing from raw would
        // silently replace a complete archive with a partial count — so fall
        // back to the daily table, which is permanent.
        if ($activeDays === 0 || $activeDays < $archivedDays) {
            $this->rebuildMonthFromDaily($month, $start, $end);

            return;
        }

        $totals = $this->totals($start, $end);

        if (! $totals || (int) $totals->pageviews === 0) {
            return;
        }

        AnalyticsMonthly::updateOrCreate(
            ['month' => $month],
            [
                'pageviews' => (int) $totals->pageviews,
                'visitors' => (int) $totals->visitors,
                'sessions' => (int) $totals->sessions,
                'new_visitors' => (int) $totals->new_visitors,
                'member_views' => (int) $totals->member_views,
                'guest_views' => (int) $totals->guest_views,
                'active_days' => (int) $activeDays,
                'devices' => $this->group('device', $start, $end),
                'browsers' => $this->group('browser', $start, $end),
                'os' => $this->group('os', $start, $end),
                'page_types' => $this->group('page_type', $start, $end, 20),
                'top_pages' => $this->group('path', $start, $end, 30),
                'top_referrers' => $this->group('referrer_host', $start, $end, 30),
                'countries' => $this->group('country', $start, $end, 50),
            ]
        );
    }

    /**
     * Rebuilds a month from the permanent daily table, for months whose raw
     * rows are gone or only partially retained.
     *
     * Counts that are sums survive this exactly. Unique visitors cannot be
     * recovered by summing (one person visiting on two days is one visitor),
     * so a previously archived figure — computed while raw data was complete —
     * always wins over the daily maximum, which is only a lower bound.
     */
    private function rebuildMonthFromDaily(string $month, CarbonImmutable $start, CarbonImmutable $end): void
    {
        $days = AnalyticsDaily::whereBetween('date', [$start->toDateString(), $end->toDateString()])->get();

        if ($days->isEmpty()) {
            return;
        }

        $archived = AnalyticsMonthly::where('month', $month)->first();

        AnalyticsMonthly::updateOrCreate(
            ['month' => $month],
            [
                'pageviews' => (int) $days->sum('pageviews'),
                'visitors' => max((int) $days->max('visitors'), (int) ($archived->visitors ?? 0)),
                'sessions' => (int) $days->sum('sessions'),
                'new_visitors' => (int) $days->sum('new_visitors'),
                'member_views' => (int) $days->sum('member_views'),
                'guest_views' => (int) $days->sum('guest_views'),
                'active_days' => $days->count(),
                'devices' => $this->mergeJson($days, 'devices'),
                'browsers' => $this->mergeJson($days, 'browsers'),
                'os' => $this->mergeJson($days, 'os'),
                'page_types' => $this->mergeJson($days, 'page_types'),
                'top_pages' => $this->mergeJson($days, 'top_pages', 30),
                'top_referrers' => $this->mergeJson($days, 'top_referrers', 30),
                'countries' => $this->mergeJson($days, 'countries', 50),
            ]
        );
    }

    private function mergeJson($days, string $key, int $limit = 20): array
    {
        $merged = [];

        foreach ($days as $day) {
            foreach ((array) ($day->{$key} ?? []) as $label => $count) {
                $merged[$label] = ($merged[$label] ?? 0) + (int) $count;
            }
        }

        arsort($merged);

        return array_slice($merged, 0, $limit, true);
    }

    // ─── Shared ──────────────────────────────────────────────────────────────

    private function totals(CarbonImmutable $start, CarbonImmutable $end)
    {
        return DB::table('page_views')
            ->whereBetween('created_at', [$start, $end])
            ->selectRaw('COUNT(*) as pageviews')
            ->selectRaw('COUNT(DISTINCT visitor_id) as visitors')
            ->selectRaw('COUNT(DISTINCT session_id) as sessions')
            ->selectRaw('SUM(is_new_visitor) as new_visitors')
            ->selectRaw('SUM(is_member) as member_views')
            ->selectRaw('SUM(CASE WHEN user_id IS NULL THEN 1 ELSE 0 END) as guest_views')
            ->first();
    }

    private function group(string $column, CarbonImmutable $start, CarbonImmutable $end, int $limit = 10): array
    {
        return DB::table('page_views')
            ->select($column)
            ->selectRaw('COUNT(*) as c')
            ->whereBetween('created_at', [$start, $end])
            ->whereNotNull($column)
            ->groupBy($column)
            ->orderByDesc('c')
            ->limit($limit)
            ->pluck('c', $column)
            ->all();
    }
}
