<?php

namespace App\Http\Controllers;

use App\Models\Series;
use App\Models\Chapter;
use Illuminate\Http\Request;
use Inertia\Inertia;

class UserSeriesController extends Controller
{
    public function show($slug)
    {
        $series = Series::where('slug', $slug)
            ->with(['genres', 'nativeLanguage'])
            ->withCount('chapters')
            ->firstOrFail();

        $chapters = Chapter::where('series_id', $series->id)
            ->orderBy('chapter_number')
            ->get(['id', 'title', 'chapter_number', 'is_premium', 'coin_price', 'created_at']);

        // Get related series (same genres)
        $relatedSeries = Series::whereHas('genres', function ($query) use ($series) {
                $genreIds = $series->genres->pluck('id');
                $query->whereIn('genres.id', $genreIds);
            })
            ->where('id', '!=', $series->id)
            ->withCount('chapters')
            ->limit(6)
            ->get();

        return Inertia::render('Series/Show', [
            'series' => $series,
            'chapters' => $chapters,
            'relatedSeries' => $relatedSeries,
        ]);
    }
}
