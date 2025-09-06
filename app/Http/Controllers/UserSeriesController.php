<?php

namespace App\Http\Controllers;

use App\Models\Series;
use App\Models\Chapter;
use App\Models\ChapterPurchase;
use App\Models\Bookmark;
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

        $chapters = Chapter::where('series_id', $series->id)
            ->orderBy('chapter_number')
            ->get(['id', 'title', 'chapter_number', 'is_premium', 'coin_price', 'created_at']);

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
            'isBookmarked' => $isBookmarked,
        ]);
    }
}
