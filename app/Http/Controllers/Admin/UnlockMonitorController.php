<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ChapterUnlockAttempt;
use App\Services\ChapterUnlockService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

/**
 * Shows how readers are actually getting through the free-unlock challenge.
 *
 * The number that matters is not how many unlocks happened but how long each
 * one took. The ad gate runs about a minute, so a healthy spread sits across
 * that minute. When runs start piling up just above the threshold instead, a
 * way of skipping the gate is circulating.
 */
class UnlockMonitorController extends Controller
{
    /**
     * Anything at or under this is fast enough to be worth a second look.
     *
     * Sits above the refusal floor, not below it: a run that clears the floor
     * is granted, and the question this figure answers is how many grants came
     * in quicker than any honest reader ever has. The fastest genuine run on
     * record is 126 seconds, so grants under two minutes deserve a look even
     * though nothing about them broke a rule.
     */
    private const SUSPICIOUS_CEILING = 120;

    private const RANGES = [1, 7, 30, 90];

    public function index(Request $request, ChapterUnlockService $unlock)
    {
        $days = (int) $request->query('days', 7);
        $days = in_array($days, self::RANGES, true) ? $days : 7;
        $since = now()->subDays($days);

        $base = ChapterUnlockAttempt::where('created_at', '>=', $since);

        // 'started' is a button press, not a verdict. Counting it alongside the
        // real outcomes would make every attempt look like a refusal, so it is
        // pulled out here and only ever used to measure drop-off.
        $byOutcome = (clone $base)
            ->select('outcome', DB::raw('COUNT(*) as total'))
            ->groupBy('outcome')
            ->pluck('total', 'outcome');

        // Only granted runs carry a meaningful duration — a refusal for
        // "not_started" never had a clock running.
        $timings = (clone $base)
            ->where('outcome', 'granted')
            ->whereNotNull('elapsed_seconds')
            ->orderBy('elapsed_seconds')
            ->pluck('elapsed_seconds');

        $median = $timings->isEmpty() ? null : (int) $timings[intdiv($timings->count(), 2)];

        $started = (int) ($byOutcome[ChapterUnlockAttempt::STARTED] ?? 0);
        $claims = (int) $byOutcome->sum() - $started;
        $granted = (int) ($byOutcome['granted'] ?? 0);

        // Readers who set off and never came back. Clamped at zero because a run
        // can start just before the window opens and be claimed inside it, which
        // would otherwise show up as negative abandonment.
        $abandoned = max(0, $started - $claims);

        return Inertia::render('Admin/UnlockMonitor/Index', [
            'filters' => ['days' => $days, 'ranges' => self::RANGES],
            'threshold' => [
                'minSeconds' => $unlock->minChallengeSeconds(),
                'suspiciousCeiling' => self::SUSPICIOUS_CEILING,
            ],
            'stats' => [
                'started' => $started,
                'attempts' => $claims,
                'abandoned' => $abandoned,
                'granted' => $granted,
                'refused' => $claims - $granted,
                'suspicious' => $timings->filter(fn ($s) => $s <= self::SUSPICIOUS_CEILING)->count(),
                'median' => $median,
                'fastest' => $timings->first(),
                'slowest' => $timings->last(),
                'uniqueUsers' => (int) (clone $base)->distinct()->count('user_id'),
            ],
            'outcomes' => collect(ChapterUnlockAttempt::OUTCOMES)
                ->map(fn ($o) => ['outcome' => $o, 'count' => (int) ($byOutcome[$o] ?? 0)])
                ->values(),
            'buckets' => $this->buckets($timings),
            'topUsers' => $this->topUsers($since),
            'topChapters' => $this->topChapters($since),
            'byProvider' => $this->byProvider($since, $unlock),
            'recent' => $this->recent($since),
        ]);
    }

    /**
     * One row per shortlink network: how far readers get through each gate,
     * and how long an honest run takes there. The fastest granted time is
     * what the network's timing floor (config/shortlink.php) is tuned from.
     *
     * @return array<int, array<string, mixed>>
     */
    private function byProvider(\DateTimeInterface $since, ChapterUnlockService $unlock): array
    {
        $rows = ChapterUnlockAttempt::where('created_at', '>=', $since)
            ->whereNotNull('provider')
            ->select('provider', 'outcome', DB::raw('COUNT(*) as n'))
            ->groupBy('provider', 'outcome')
            ->get()
            ->groupBy('provider');

        $times = ChapterUnlockAttempt::where('created_at', '>=', $since)
            ->whereNotNull('provider')
            ->where('outcome', 'granted')
            ->whereNotNull('elapsed_seconds')
            ->orderBy('elapsed_seconds')
            ->get(['provider', 'elapsed_seconds'])
            ->groupBy('provider');

        $inRotation = collect($unlock->rotation())->map->name()->all();

        return collect($unlock->providers())
            ->map(function ($p) use ($rows, $times, $inRotation, $unlock) {
                $counts = ($rows[$p->name()] ?? collect())->pluck('n', 'outcome');
                $t = ($times[$p->name()] ?? collect())->pluck('elapsed_seconds')->values();
                $started = (int) ($counts[ChapterUnlockAttempt::STARTED] ?? 0);
                $granted = (int) ($counts['granted'] ?? 0);

                return [
                    'name' => $p->name(),
                    'label' => $p->label(),
                    'position' => ($i = array_search($p->name(), $inRotation, true)) === false ? null : $i + 1,
                    'started' => $started,
                    'granted' => $granted,
                    'refused' => (int) $counts->except([ChapterUnlockAttempt::STARTED, 'granted'])->sum(),
                    'fastest' => $t->first(),
                    'median' => $t->isEmpty() ? null : (int) $t[intdiv($t->count(), 2)],
                    'floor' => $unlock->minChallengeSeconds($p),
                ];
            })
            ->sortBy(fn ($r) => $r['position'] ?? 99)
            ->values()
            ->all();
    }

    /**
     * Duration histogram. The shape is the signal, not any single row.
     *
     * @return array<int, array{label: string, count: int}>
     */
    private function buckets(\Illuminate\Support\Collection $timings): array
    {
        // Calibrated to where grants actually land. Observed honest runs span
        // 126–550s, so the old sub-minute bands could only ever read zero once
        // the floor moved to 90.
        $edges = [
            ['≤ 120s', fn ($s) => $s <= 120],
            ['121–150s', fn ($s) => $s > 120 && $s <= 150],
            ['151–200s', fn ($s) => $s > 150 && $s <= 200],
            ['201–300s', fn ($s) => $s > 200 && $s <= 300],
            ['301–450s', fn ($s) => $s > 300 && $s <= 450],
            ['> 450s', fn ($s) => $s > 450],
        ];

        return collect($edges)
            ->map(fn ($e) => ['label' => $e[0], 'count' => $timings->filter($e[1])->count()])
            ->all();
    }

    /**
     * Readers with the most refusals — repeated failures from one account are
     * more telling than a single fast run.
     *
     * @return array<int, array<string, mixed>>
     */
    private function topUsers(\DateTimeInterface $since): array
    {
        return ChapterUnlockAttempt::where('chapter_unlock_attempts.created_at', '>=', $since)
            ->join('users', 'users.id', '=', 'chapter_unlock_attempts.user_id')
            ->select(
                'users.id',
                'users.display_name',
                'users.email',
                DB::raw("SUM(CASE WHEN outcome != 'started' THEN 1 ELSE 0 END) as attempts"),
                DB::raw("SUM(CASE WHEN outcome = 'granted' THEN 1 ELSE 0 END) as granted"),
                DB::raw("SUM(CASE WHEN outcome NOT IN ('granted', 'started') THEN 1 ELSE 0 END) as refused"),
                DB::raw('MIN(elapsed_seconds) as fastest'),
            )
            ->groupBy('users.id', 'users.display_name', 'users.email')
            ->orderByDesc('refused')
            ->orderByDesc('attempts')
            ->limit(10)
            ->get()
            ->map(fn ($r) => [
                'id' => $r->id,
                'display_name' => $r->display_name,
                'email' => $r->email,
                'attempts' => (int) $r->attempts,
                'granted' => (int) $r->granted,
                'refused' => (int) $r->refused,
                'fastest' => $r->fastest !== null ? (int) $r->fastest : null,
            ])
            ->all();
    }

    /**
     * Which chapters are being opened this way, most first.
     *
     * Answers a question the per-attempt log cannot: whether the free route is
     * spread across the catalogue or concentrated on a handful of chapters that
     * would otherwise be selling.
     *
     * @return array<int, array<string, mixed>>
     */
    private function topChapters(\DateTimeInterface $since): array
    {
        return ChapterUnlockAttempt::where('chapter_unlock_attempts.created_at', '>=', $since)
            ->join('chapters', 'chapters.id', '=', 'chapter_unlock_attempts.chapter_id')
            ->leftJoin('series', 'series.id', '=', 'chapters.series_id')
            ->select(
                'chapters.id',
                'chapters.title',
                'chapters.chapter_number',
                'chapters.chapter_link',
                'series.title as series_title',
                'series.slug as series_slug',
                DB::raw("SUM(CASE WHEN outcome = 'granted' THEN 1 ELSE 0 END) as granted"),
                DB::raw("SUM(CASE WHEN outcome != 'started' THEN 1 ELSE 0 END) as attempts"),
                DB::raw("AVG(CASE WHEN outcome = 'granted' THEN elapsed_seconds END) as avg_seconds"),
            )
            ->groupBy('chapters.id', 'chapters.title', 'chapters.chapter_number', 'chapters.chapter_link', 'series.title', 'series.slug')
            ->orderByDesc('granted')
            ->orderByDesc('attempts')
            ->limit(10)
            ->get()
            ->map(fn ($r) => [
                'id' => $r->id,
                'chapter' => trim(($r->series_title ?? '').' — '.($r->title ?: 'Chapter '.$r->chapter_number)),
                'url' => $r->series_slug ? '/series/'.$r->series_slug.'/chapter/'.$r->chapter_link : null,
                'granted' => (int) $r->granted,
                'attempts' => (int) $r->attempts,
                'avg' => $r->avg_seconds !== null ? (int) round($r->avg_seconds) : null,
            ])
            ->all();
    }

    /** @return array<int, array<string, mixed>> */
    private function recent(\DateTimeInterface $since): array
    {
        return ChapterUnlockAttempt::where('created_at', '>=', $since)
            ->with(['user:id,display_name,email', 'chapter:id,series_id,title,chapter_number,chapter_link'])
            ->with('chapter.series:id,title,slug')
            ->latest('created_at')
            ->limit(100)
            ->get()
            ->map(fn ($a) => [
                'id' => $a->id,
                'outcome' => $a->outcome,
                'elapsed' => $a->elapsed_seconds,
                'source' => $a->source,
                'provider' => $a->provider,
                'ip' => $a->ip,
                'at' => $a->created_at?->toIso8601String(),
                'user' => $a->user?->display_name ?? '—',
                'email' => $a->user?->email,
                'chapter' => $a->chapter
                    ? trim(($a->chapter->series->title ?? '').' — '.($a->chapter->title ?: 'Chapter '.$a->chapter->chapter_number))
                    : '—',
                'url' => $a->chapter && $a->chapter->series
                    ? '/series/'.$a->chapter->series->slug.'/chapter/'.$a->chapter->chapter_link
                    : null,
            ])
            ->all();
    }
}
