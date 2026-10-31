<?php

namespace App\Http\Controllers;

use App\Models\Series;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * Readers rate a series 1–5 stars; the series shows the average out of 10.
 *
 * series.rating is a cache of the votes, recomputed after every change rather
 * than adjusted incrementally — a recount is one indexed query and can never
 * drift out of step with the votes the way a running total can.
 */
class SeriesRatingController extends Controller
{
    public function store(Request $request, string $slug)
    {
        $validated = $request->validate([
            'stars' => 'required|integer|min:1|max:5',
        ]);

        $series = Series::where('slug', $slug)->firstOrFail();
        $now = now();

        // Atomic: a first vote inserts, a changed vote updates, and two quick
        // clicks cannot both insert.
        DB::table('series_ratings')->upsert(
            [[
                'user_id' => $request->user()->id,
                'series_id' => $series->id,
                'stars' => $validated['stars'],
                'created_at' => $now,
                'updated_at' => $now,
            ]],
            ['user_id', 'series_id'],
            ['stars', 'updated_at'],
        );

        return back()->with('rating', $this->recount($series->id));
    }

    public function destroy(Request $request, string $slug)
    {
        $series = Series::where('slug', $slug)->firstOrFail();

        DB::table('series_ratings')
            ->where('user_id', $request->user()->id)
            ->where('series_id', $series->id)
            ->delete();

        return back()->with('rating', $this->recount($series->id));
    }

    /**
     * Rewrites the cached score from the votes.
     *
     * Through the query builder, never Eloquent: series.updated_at breaks
     * ties in Latest Updates, and a vote is not an update to the series.
     * AVG over no rows is NULL, so removing the last vote leaves the series
     * unrated rather than at 0.0.
     */
    private function recount(int $seriesId): array
    {
        $stats = DB::table('series_ratings')
            ->where('series_id', $seriesId)
            ->selectRaw('ROUND(AVG(stars) * 2, 1) as rating, COUNT(*) as votes')
            ->first();

        DB::table('series')->where('id', $seriesId)->update([
            'rating' => $stats->rating,
            'rating_count' => (int) $stats->votes,
        ]);

        return ['rating' => $stats->rating !== null ? (float) $stats->rating : null, 'count' => (int) $stats->votes];
    }
}
