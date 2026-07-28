<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AnalyticsDaily;
use App\Models\AnalyticsMonthly;
use App\Models\AnalyticsVisitor;
use App\Support\XlsxWriter;
use Carbon\CarbonImmutable;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\Response as SymfonyResponse;

class AnalyticsController extends Controller
{
    /** Supported range keys mapped to their length in days. */
    private const RANGES = [
        'today' => 1,
        '7d' => 7,
        '30d' => 30,
        '90d' => 90,
    ];

    public function index(Request $request): Response
    {
        $range = $this->resolveRange($request->query('range', '30d'));

        return Inertia::render('Admin/Analytics/Index', [
            'range' => $range,
            'stats' => $this->buildStats($range),
            'lifetime' => $this->lifetime(),
            'monthly' => $this->monthly(),
            'gaMeasurementId' => config('analytics.ga_measurement_id'),
            'retentionDays' => config('analytics.retention_days'),
        ]);
    }

    /** JSON feed used when the admin switches date range without a full reload. */
    public function data(Request $request): JsonResponse
    {
        $range = $this->resolveRange($request->query('range', '30d'));

        return response()->json([
            'range' => $range,
            'stats' => $this->buildStats($range),
            'lifetime' => $this->lifetime(),
            'monthly' => $this->monthly(),
        ]);
    }

    /**
     * Permanent month-by-month archive. Unlike the rolling ranges this is not
     * limited by the raw retention window — rows here are written once and kept.
     */
    private function monthly(): array
    {
        return AnalyticsMonthly::orderByDesc('month')
            ->limit(36)
            ->get()
            ->map(fn (AnalyticsMonthly $m) => [
                'month' => $m->month,
                'label' => CarbonImmutable::parse($m->month.'-01')->format('M Y'),
                'pageviews' => $m->pageviews,
                'visitors' => $m->visitors,
                'sessions' => $m->sessions,
                'new_visitors' => $m->new_visitors,
                'returning_visitors' => max(0, $m->visitors - $m->new_visitors),
                'member_views' => $m->member_views,
                'guest_views' => $m->guest_views,
                'active_days' => $m->active_days,
                'pages_per_session' => $m->sessions > 0 ? round($m->pageviews / $m->sessions, 2) : 0,
                'top_country' => $this->firstKey($m->countries),
                'top_referrer' => $this->firstKey($m->top_referrers),
                'top_device' => $this->firstKey($m->devices),
            ])
            ->values()
            ->all();
    }

    private function firstKey(?array $map): ?string
    {
        if (! $map) {
            return null;
        }

        return (string) array_key_first($map);
    }

    /** Visitors active in the last 5 minutes, plus what they are reading. */
    public function realtime(): JsonResponse
    {
        $since = now()->subMinutes(5);

        $active = DB::table('page_views')
            ->where('created_at', '>=', $since)
            ->distinct()
            ->count('visitor_id');

        $pages = DB::table('page_views')
            ->select('path', DB::raw('COUNT(*) as views'))
            ->where('created_at', '>=', $since)
            ->groupBy('path')
            ->orderByDesc('views')
            ->limit(8)
            ->get();

        // Per-minute pulse for the last 30 minutes.
        $pulse = DB::table('page_views')
            ->select(DB::raw("DATE_FORMAT(created_at, '%H:%i') as minute"), DB::raw('COUNT(*) as views'))
            ->where('created_at', '>=', now()->subMinutes(30))
            ->groupBy('minute')
            ->orderBy('minute')
            ->pluck('views', 'minute');

        $series = [];
        for ($i = 29; $i >= 0; $i--) {
            $key = now()->subMinutes($i)->format('H:i');
            $series[] = ['minute' => $key, 'views' => (int) ($pulse[$key] ?? 0)];
        }

        return response()->json([
            'active' => $active,
            'pages' => $pages,
            'pulse' => $series,
        ]);
    }

    /**
     * Downloads the current view as a multi-sheet workbook.
     *
     * `scope=monthly` exports the permanent archive only; anything else exports
     * the selected range plus the archive alongside it.
     */
    public function export(Request $request): Response|SymfonyResponse
    {
        $scope = $request->query('scope') === 'monthly' ? 'monthly' : 'range';
        $range = $this->resolveRange($request->query('range', '30d'));

        $xlsx = new XlsxWriter();
        $monthly = $this->monthly();

        if ($scope === 'monthly') {
            $this->addMonthlySheets($xlsx, $monthly);
            $filename = 'veinovel-analytics-monthly-'.now()->format('Y-m-d').'.xlsx';
        } else {
            $stats = $this->buildStats($range);
            $this->addRangeSheets($xlsx, $range, $stats);
            $this->addMonthlySheets($xlsx, $monthly);
            $filename = 'veinovel-analytics-'.$range.'-'.now()->format('Y-m-d').'.xlsx';
        }

        return response($xlsx->build(), 200, $xlsx->headers($filename));
    }

    private function addRangeSheets(XlsxWriter $xlsx, string $range, array $stats): void
    {
        $s = $stats['summary'];
        $lifetime = $this->lifetime();

        $xlsx->addSheet('Summary', ['Metric', 'Value'], [
            ['Report generated', now()->format('Y-m-d H:i')],
            ['Range', $range],
            ['Period start', $stats['start']],
            ['Period end', $stats['end']],
            ['', ''],
            ['Pageviews', $s['pageviews']],
            ['Unique visitors', $s['visitors']],
            ['Visits (non-unique)', $s['sessions']],
            ['New visitors', $s['new_visitors']],
            ['Returning visitors', $s['returning_visitors']],
            ['Pages per visit', $s['pages_per_session']],
            ['Bounce rate (%)', $s['bounce_rate']],
            ['', ''],
            ['All-time pageviews', $lifetime['pageviews']],
            ['All-time unique visitors', $lifetime['visitors']],
            ['Tracking since', (string) ($lifetime['since'] ?? '—')],
        ], [30, 24]);

        $xlsx->addSheet(
            $range === 'today' ? 'By hour' : 'Daily',
            ['Date', 'Label', 'Pageviews', 'Unique visitors', 'Visits', 'New visitors'],
            array_map(fn ($p) => [
                $p['date'], $p['label'], $p['pageviews'], $p['visitors'], $p['sessions'], $p['new_visitors'],
            ], $stats['trend']),
            [14, 12, 13, 16, 12, 14]
        );

        $xlsx->addSheet(
            'Top pages',
            ['Path', 'Category', 'Pageviews', 'Unique visitors'],
            array_map(fn ($p) => [$p['path'], $p['page_type'], $p['pageviews'], $p['visitors']], $stats['topPages']),
            [56, 16, 13, 16]
        );

        $xlsx->addSheet(
            'Top series',
            ['Title', 'Slug', 'Pageviews', 'Unique visitors', 'Chapter views'],
            array_map(fn ($p) => [
                $p['title'], $p['slug'], $p['pageviews'], $p['visitors'], $p['chapter_views'],
            ], $stats['topSeries']),
            [46, 40, 13, 16, 15]
        );

        $referrers = array_map(
            fn ($r) => [$r['host'], $r['pageviews'], $r['visitors']],
            $stats['referrers']['sources']
        );
        array_unshift($referrers, ['(direct / bookmarked)', $stats['referrers']['direct'], null]);

        $xlsx->addSheet('Traffic sources', ['Source', 'Pageviews', 'Unique visitors'], $referrers, [34, 13, 16]);

        $xlsx->addSheet(
            'Countries',
            ['Country code', 'Pageviews', 'Unique visitors'],
            array_map(fn ($c) => [$c['label'], $c['value'], $c['visitors']], $stats['countries']),
            [16, 13, 16]
        );

        // One sheet for the technical splits — each labelled by dimension.
        $tech = [];
        foreach ([
            'Device' => $stats['devices'],
            'Browser' => $stats['browsers'],
            'Operating system' => $stats['os'],
            'Page category' => $stats['pageTypes'],
            'Audience' => $stats['audience'],
        ] as $dimension => $rows) {
            foreach ($rows as $row) {
                $tech[] = [$dimension, $row['label'], $row['value'], $row['visitors'] ?? null];
            }
        }

        $xlsx->addSheet('Breakdowns', ['Dimension', 'Value', 'Pageviews', 'Unique visitors'], $tech, [20, 24, 13, 16]);
    }

    private function addMonthlySheets(XlsxWriter $xlsx, array $monthly): void
    {
        $xlsx->addSheet(
            'Monthly archive',
            [
                'Month', 'Pageviews', 'Unique visitors', 'Visits', 'New visitors', 'Returning visitors',
                'Member views', 'Guest views', 'Active days', 'Pages per visit',
                'Top country', 'Top referrer', 'Top device',
            ],
            array_map(fn ($m) => [
                $m['month'], $m['pageviews'], $m['visitors'], $m['sessions'], $m['new_visitors'],
                $m['returning_visitors'], $m['member_views'], $m['guest_views'], $m['active_days'],
                $m['pages_per_session'], $m['top_country'], $m['top_referrer'], $m['top_device'],
            ], $monthly),
            [10, 13, 16, 10, 14, 18, 14, 13, 12, 15, 13, 22, 12]
        );
    }

    // ─── Range handling ──────────────────────────────────────────────────────

    private function resolveRange(?string $key): string
    {
        return array_key_exists($key, self::RANGES) ? $key : '30d';
    }

    /** @return array{0: CarbonImmutable, 1: CarbonImmutable} */
    private function bounds(string $range): array
    {
        $end = CarbonImmutable::now()->endOfDay();
        $start = $range === 'today'
            ? CarbonImmutable::now()->startOfDay()
            : CarbonImmutable::now()->subDays(self::RANGES[$range] - 1)->startOfDay();

        return [$start, $end];
    }

    // ─── Aggregation ─────────────────────────────────────────────────────────

    private function buildStats(string $range): array
    {
        [$start, $end] = $this->bounds($range);

        $length = self::RANGES[$range];
        $prevEnd = $start->subSecond();
        $prevStart = $start->subDays($length);

        $current = $this->summary($start, $end);
        $previous = $this->summary($prevStart, $prevEnd);

        return [
            'start' => $start->toDateString(),
            'end' => $end->toDateString(),
            'summary' => $current,
            'delta' => [
                'pageviews' => $this->percentChange($previous['pageviews'], $current['pageviews']),
                'visitors' => $this->percentChange($previous['visitors'], $current['visitors']),
                'sessions' => $this->percentChange($previous['sessions'], $current['sessions']),
                'new_visitors' => $this->percentChange($previous['new_visitors'], $current['new_visitors']),
            ],
            'trend' => $range === 'today'
                ? $this->hourlyTrend($start, $end)
                : $this->dailyTrend($start, $end),
            'topPages' => $this->topPages($start, $end),
            'topSeries' => $this->topSeries($start, $end),
            'referrers' => $this->referrers($start, $end),
            'devices' => $this->breakdown('device', $start, $end),
            'browsers' => $this->breakdown('browser', $start, $end),
            'os' => $this->breakdown('os', $start, $end),
            'countries' => $this->breakdown('country', $start, $end, 30),
            'pageTypes' => $this->breakdown('page_type', $start, $end),
            'audience' => $this->audience($start, $end),
        ];
    }

    private function summary(CarbonImmutable $start, CarbonImmutable $end): array
    {
        $row = DB::table('page_views')
            ->whereBetween('created_at', [$start, $end])
            ->selectRaw('COUNT(*) as pageviews')
            ->selectRaw('COUNT(DISTINCT visitor_id) as visitors')
            ->selectRaw('COUNT(DISTINCT session_id) as sessions')
            ->selectRaw('SUM(is_new_visitor) as new_visitors')
            ->first();

        $pageviews = (int) ($row->pageviews ?? 0);
        $visitors = (int) ($row->visitors ?? 0);
        $sessions = (int) ($row->sessions ?? 0);
        $new = (int) ($row->new_visitors ?? 0);

        // A bounce here means a session that never went past its first page.
        $perSession = DB::table('page_views')
            ->select('session_id', DB::raw('COUNT(*) as c'))
            ->whereBetween('created_at', [$start, $end])
            ->groupBy('session_id');

        $bounced = DB::query()->fromSub($perSession, 's')->where('c', 1)->count();

        return [
            'pageviews' => $pageviews,
            'visitors' => $visitors,
            'sessions' => $sessions,
            'new_visitors' => $new,
            'returning_visitors' => max(0, $visitors - $new),
            'pages_per_session' => $sessions > 0 ? round($pageviews / $sessions, 2) : 0,
            'bounce_rate' => $sessions > 0 ? round($bounced / $sessions * 100, 1) : 0,
        ];
    }

    private function dailyTrend(CarbonImmutable $start, CarbonImmutable $end): array
    {
        $rows = DB::table('page_views')
            ->selectRaw('DATE(created_at) as day')
            ->selectRaw('COUNT(*) as pageviews')
            ->selectRaw('COUNT(DISTINCT visitor_id) as visitors')
            ->selectRaw('COUNT(DISTINCT session_id) as sessions')
            ->selectRaw('SUM(is_new_visitor) as new_visitors')
            ->whereBetween('created_at', [$start, $end])
            ->groupBy('day')
            ->orderBy('day')
            ->get()
            ->keyBy(fn ($r) => (string) $r->day);

        $out = [];
        for ($d = $start; $d->lte($end); $d = $d->addDay()) {
            $key = $d->toDateString();
            $row = $rows[$key] ?? null;

            $out[] = [
                'label' => $d->format('M j'),
                'date' => $key,
                'pageviews' => (int) ($row->pageviews ?? 0),
                'visitors' => (int) ($row->visitors ?? 0),
                'sessions' => (int) ($row->sessions ?? 0),
                'new_visitors' => (int) ($row->new_visitors ?? 0),
            ];
        }

        return $out;
    }

    private function hourlyTrend(CarbonImmutable $start, CarbonImmutable $end): array
    {
        $rows = DB::table('page_views')
            ->selectRaw('HOUR(created_at) as h')
            ->selectRaw('COUNT(*) as pageviews')
            ->selectRaw('COUNT(DISTINCT visitor_id) as visitors')
            ->selectRaw('COUNT(DISTINCT session_id) as sessions')
            ->selectRaw('SUM(is_new_visitor) as new_visitors')
            ->whereBetween('created_at', [$start, $end])
            ->groupBy('h')
            ->get()
            ->keyBy(fn ($r) => (int) $r->h);

        $out = [];
        for ($h = 0; $h < 24; $h++) {
            $row = $rows[$h] ?? null;

            $out[] = [
                'label' => sprintf('%02d:00', $h),
                'date' => $start->toDateString(),
                'pageviews' => (int) ($row->pageviews ?? 0),
                'visitors' => (int) ($row->visitors ?? 0),
                'sessions' => (int) ($row->sessions ?? 0),
                'new_visitors' => (int) ($row->new_visitors ?? 0),
            ];
        }

        return $out;
    }

    private function topPages(CarbonImmutable $start, CarbonImmutable $end): array
    {
        return DB::table('page_views')
            ->select('path', 'page_type')
            ->selectRaw('COUNT(*) as pageviews')
            ->selectRaw('COUNT(DISTINCT visitor_id) as visitors')
            ->whereBetween('created_at', [$start, $end])
            ->groupBy('path', 'page_type')
            ->orderByDesc('pageviews')
            ->limit(15)
            ->get()
            ->map(fn ($r) => [
                'path' => $r->path,
                'page_type' => $r->page_type,
                'pageviews' => (int) $r->pageviews,
                'visitors' => (int) $r->visitors,
            ])
            ->all();
    }

    private function topSeries(CarbonImmutable $start, CarbonImmutable $end): array
    {
        return DB::table('page_views as pv')
            ->join('series as s', 's.id', '=', 'pv.series_id')
            ->select('s.id', 's.title', 's.slug', 's.cover_url')
            ->selectRaw('COUNT(*) as pageviews')
            ->selectRaw('COUNT(DISTINCT pv.visitor_id) as visitors')
            ->selectRaw("SUM(CASE WHEN pv.page_type = 'chapter' THEN 1 ELSE 0 END) as chapter_views")
            ->whereBetween('pv.created_at', [$start, $end])
            ->whereNotNull('pv.series_id')
            ->groupBy('s.id', 's.title', 's.slug', 's.cover_url')
            ->orderByDesc('pageviews')
            ->limit(10)
            ->get()
            ->map(fn ($r) => [
                'id' => (int) $r->id,
                'title' => $r->title,
                'slug' => $r->slug,
                'cover' => $r->cover_url,
                'pageviews' => (int) $r->pageviews,
                'visitors' => (int) $r->visitors,
                'chapter_views' => (int) $r->chapter_views,
            ])
            ->all();
    }

    private function referrers(CarbonImmutable $start, CarbonImmutable $end): array
    {
        $direct = DB::table('page_views')
            ->whereBetween('created_at', [$start, $end])
            ->whereNull('referrer_host')
            ->count();

        $rows = DB::table('page_views')
            ->select('referrer_host')
            ->selectRaw('COUNT(*) as pageviews')
            ->selectRaw('COUNT(DISTINCT visitor_id) as visitors')
            ->whereBetween('created_at', [$start, $end])
            ->whereNotNull('referrer_host')
            ->groupBy('referrer_host')
            ->orderByDesc('pageviews')
            ->limit(12)
            ->get()
            ->map(fn ($r) => [
                'host' => $r->referrer_host,
                'pageviews' => (int) $r->pageviews,
                'visitors' => (int) $r->visitors,
            ])
            ->all();

        return ['direct' => $direct, 'sources' => $rows];
    }

    /**
     * Every breakdown carries both counts: `value` is pageviews (non-unique —
     * the same person counted on every hit) and `visitors` is deduplicated.
     */
    private function breakdown(string $column, CarbonImmutable $start, CarbonImmutable $end, int $limit = 12): array
    {
        return DB::table('page_views')
            ->select($column.' as label')
            ->selectRaw('COUNT(*) as value')
            ->selectRaw('COUNT(DISTINCT visitor_id) as visitors')
            ->whereBetween('created_at', [$start, $end])
            ->whereNotNull($column)
            ->groupBy($column)
            ->orderByDesc('value')
            ->limit($limit)
            ->get()
            ->map(fn ($r) => [
                'label' => (string) $r->label,
                'value' => (int) $r->value,
                'visitors' => (int) $r->visitors,
            ])
            ->all();
    }

    private function audience(CarbonImmutable $start, CarbonImmutable $end): array
    {
        $row = DB::table('page_views')
            ->whereBetween('created_at', [$start, $end])
            ->selectRaw('SUM(CASE WHEN user_id IS NULL THEN 1 ELSE 0 END) as guests')
            ->selectRaw('SUM(CASE WHEN user_id IS NOT NULL AND is_member = 0 THEN 1 ELSE 0 END) as registered')
            ->selectRaw('SUM(is_member) as members')
            ->first();

        $unique = DB::table('page_views')
            ->whereBetween('created_at', [$start, $end])
            ->selectRaw('COUNT(DISTINCT CASE WHEN user_id IS NULL THEN visitor_id END) as guests')
            ->selectRaw('COUNT(DISTINCT CASE WHEN user_id IS NOT NULL AND is_member = 0 THEN visitor_id END) as registered')
            ->selectRaw('COUNT(DISTINCT CASE WHEN is_member = 1 THEN visitor_id END) as members')
            ->first();

        return [
            ['label' => 'Guest', 'value' => (int) ($row->guests ?? 0), 'visitors' => (int) ($unique->guests ?? 0)],
            ['label' => 'Registered', 'value' => (int) ($row->registered ?? 0), 'visitors' => (int) ($unique->registered ?? 0)],
            ['label' => 'Member', 'value' => (int) ($row->members ?? 0), 'visitors' => (int) ($unique->members ?? 0)],
        ];
    }

    private function lifetime(): array
    {
        $rollup = AnalyticsDaily::selectRaw('SUM(pageviews) as pageviews, MIN(date) as since')->first();

        // Days already pruned live only in the rollup; recent days live only in
        // page_views. Sum the rollup and add anything newer than its last date.
        $lastRolled = AnalyticsDaily::max('date');

        $rawPageviews = DB::table('page_views')
            ->when($lastRolled, fn ($q) => $q->whereDate('created_at', '>', $lastRolled))
            ->count();

        return [
            'pageviews' => (int) ($rollup->pageviews ?? 0) + $rawPageviews,
            'visitors' => AnalyticsVisitor::count(),
            'since' => $rollup->since ?? DB::table('page_views')->min('created_at'),
        ];
    }

    private function percentChange(int|float $from, int|float $to): ?float
    {
        if ($from == 0) {
            return $to > 0 ? null : 0.0;
        }

        return round(($to - $from) / $from * 100, 1);
    }
}
