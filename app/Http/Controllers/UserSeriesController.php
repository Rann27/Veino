<?php

namespace App\Http\Controllers;

use App\Models\Series;
use App\Models\Chapter;
use App\Models\ChapterPurchase;
use App\Models\Bookmark;
use App\Models\EbookSeries;
use App\Models\Mark;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class UserSeriesController extends Controller
{
    public function show($slug)
    {
        $series = Series::where('slug', $slug)
            ->with(['genres', 'nativeLanguage'])
            ->withCount('chapters')
            ->firstOrFail();

        // Defer view increment to after response is sent (non-blocking).
        //
        // withoutTimestamps for the same reason the chapter counter uses it:
        // a plain increment() drags updated_at along, and reading a page is
        // not an edit. Only a tiebreaker on the homepage depends on this
        // column today, but a counter that quietly rewrites "last modified"
        // is a trap for whatever reads it next.
        //
        // Partial reloads are skipped: those are the page refreshing its own
        // props (after a rating vote, say), not someone opening it again.
        if (! request()->header('X-Inertia-Partial-Data')) {
            defer(fn () => Series::withoutTimestamps(fn () => $series->increment('views')));
        }

        $chapters = Chapter::where('series_id', $series->id)
            ->orderBy('volume')
            ->orderBy('chapter_number')
            ->select(['id', 'title', 'chapter_number', 'chapter_link', 'volume', 'is_premium', 'coin_price', 'created_at', 'views'])
            // Flags chapters carrying illustrations. Evaluated in SQL so the
            // chapter bodies never have to travel to PHP just to be inspected.
            ->selectRaw("(content LIKE '%<img%') as has_images")
            ->get();

        // A plain foreach, deliberately. `each()` with an arrow function breaks
        // here: the arrow body is an assignment, whose value is returned
        // implicitly, and Collection::each() treats a returned `false` as
        // "stop". The first chapter without images ended the loop and left
        // every later one holding the raw `0`/`1` from SQL.
        foreach ($chapters as $chapter) {
            $chapter->has_images = (bool) $chapter->has_images;
        }

        $series->epub_free_for_premium_members = false;
        if ($series->show_epub_button && $series->epub_series_slug) {
            $series->epub_free_for_premium_members = EbookSeries::where('slug', $series->epub_series_slug)
                ->where('free_for_premium_members', true)
                ->exists();
        }

        // Add ownership information if user is authenticated
        $isBookmarked = false;
        if (Auth::check()) {
            $userId = Auth::id();
            $purchasedChapterIds = ChapterPurchase::where('user_id', $userId)
                ->whereIn('chapter_id', $chapters->pluck('id'))
                ->pluck('chapter_id')
                ->toArray();

            // Check if series is bookmarked
            $isBookmarked = Bookmark::where('user_id', $userId)
                ->where('series_id', $series->id)
                ->exists();

            $chapters = $chapters->map(function ($chapter) use ($purchasedChapterIds) {
                $chapter->is_owned = in_array($chapter->id, $purchasedChapterIds);
                return $chapter;
            });
        } else {
            // For guest users, mark all chapters as not owned
            $chapters = $chapters->map(function ($chapter) {
                $chapter->is_owned = false;
                return $chapter;
            });
        }

        $relatedSeries = $this->recommendations($series);

        // The first chapter's real link. The button used to hardcode "1", which
        // 404s on any volume-based series, where links look like `v1c1`.
        $firstChapter = $chapters->first();

        [$readChapterIds, $lastRead] = $this->readingProgress($series, $chapters);

        // Expiry of any challenge-earned access, so premium rows can show how
        // long the reader still has. One query for the whole list.
        $temporaryAccess = app(\App\Services\ChapterUnlockService::class)
            ->activeAccessMap(Auth::user(), $chapters->pluck('id')->all());

        // Premium chapters still members-only, with seconds until the free
        // unlock opens, for the "Early Access" badge on each row.
        $earlyAccess = app(\App\Services\ChapterUnlockService::class)->earlyAccessMap($chapters);

        // Fetch marks for this series (grouped by chapter)
        $seriesMarks = [];
        if (Auth::check()) {
            $seriesMarks = Mark::where('user_id', Auth::id())
                ->where('series_id', $series->id)
                ->with('chapter:id,title,chapter_number,chapter_link,volume')
                ->orderBy('chapter_id')
                ->orderBy('paragraph_index')
                ->get()
                ->map(fn($m) => [
                    'id'                => $m->id,
                    'chapter_id'        => $m->chapter_id,
                    'chapter_title'     => $m->chapter->title,
                    'chapter_number'    => $m->chapter->chapter_number,
                    'chapter_link'      => $m->chapter->chapter_link,
                    'chapter_volume'    => $m->chapter->volume,
                    'paragraph_index'   => $m->paragraph_index,
                    'paragraph_preview' => $m->paragraph_preview,
                    'created_at'        => $m->created_at->toISOString(),
                ])
                ->toArray();
        }

        return Inertia::render('Series/Show', [
            'series'        => $series,
            'chapters'    => $chapters,
            'relatedSeries' => $relatedSeries,
            'isBookmarked'  => $isBookmarked,
            'seriesMarks'   => $seriesMarks,
            'firstChapter'  => $firstChapter?->chapter_link,
            'readChapterIds' => $readChapterIds,
            'lastRead'      => $lastRead,
            'temporaryAccess' => $temporaryAccess,
            'earlyAccess'   => $earlyAccess,
            // This reader's own vote, 1–5, or null. The aggregate itself rides
            // on the series (rating, rating_count).
            'userRating'    => Auth::check()
                ? \Illuminate\Support\Facades\DB::table('series_ratings')
                    ->where('user_id', Auth::id())
                    ->where('series_id', $series->id)
                    ->value('stars')
                : null,
        ]);
    }

    /**
     * What this reader has already been through in this series.
     *
     * Returns the chapter ids they've opened — used to grey out visited rows —
     * and the most recent one, which turns the primary button into "Continue
     * Reading". Guests get nothing here; the page falls back to localStorage so
     * the visited styling still works for them, just per-device.
     *
     * @return array{0: array<int>, 1: array|null}
     */
    private function readingProgress(Series $series, $chapters): array
    {
        if (! Auth::check()) {
            return [[], null];
        }

        $history = \App\Models\ReadingHistory::where('user_id', Auth::id())
            ->where('series_id', $series->id)
            ->orderByDesc('last_read_at')
            ->get(['chapter_id', 'last_read_at']);

        if ($history->isEmpty()) {
            return [[], null];
        }

        // Walk back through the history rather than trusting the newest entry:
        // if that chapter has since been deleted, a reader 50 chapters deep
        // would otherwise be shown "Read First Chapter".
        $latest = null;

        foreach ($history as $entry) {
            $latest = $chapters->firstWhere('id', $entry->chapter_id);

            if ($latest) {
                break;
            }
        }

        return [
            $history->pluck('chapter_id')->all(),
            $latest ? [
                'chapter_link' => $latest->chapter_link,
                'chapter_number' => $latest->chapter_number,
                'volume' => $latest->volume,
                'title' => $latest->title,
            ] : null,
        ];
    }

    /**
     * "You Might Also Like": same format, overlapping genre, ranked by how much
     * traffic the whole series drew over the last seven days.
     *
     * The weekly figure counts every page view recorded against the series —
     * its landing page and all of its chapters — since TrackPageView stamps
     * `series_id` on both. Analytics only started collecting recently, so ties
     * (and the all-zero case on a quiet week) fall back to all-time views,
     * which keeps the panel sensible instead of empty.
     */
    private function recommendations(Series $series)
    {
        $genreIds = $series->genres->pluck('id');

        if ($genreIds->isEmpty()) {
            return collect();
        }

        return \Illuminate\Support\Facades\Cache::remember(
            "related_series_weekly_{$series->id}",
            1800,
            function () use ($series, $genreIds) {
                $weekly = \Illuminate\Support\Facades\DB::table('page_views')
                    ->select('series_id', \Illuminate\Support\Facades\DB::raw('COUNT(*) as weekly_views'))
                    ->whereNotNull('series_id')
                    ->where('created_at', '>=', now()->subDays(7))
                    ->groupBy('series_id');

                return Series::query()
                    ->where('series.id', '!=', $series->id)
                    ->where('series.type', $series->type)
                    ->whereHas('genres', fn ($q) => $q->whereIn('genres.id', $genreIds))
                    ->leftJoinSub($weekly, 'pv', 'pv.series_id', '=', 'series.id')
                    ->select('series.*')
                    ->selectRaw('COALESCE(pv.weekly_views, 0) as weekly_views')
                    ->withCount('chapters')
                    ->orderByDesc('weekly_views')
                    ->orderByDesc('series.views')
                    ->limit(6)
                    ->get();
            }
        );
    }
}
