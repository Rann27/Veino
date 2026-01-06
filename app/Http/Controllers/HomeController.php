<?php

namespace App\Http\Controllers;

use App\Models\Series;
use App\Models\Chapter;
use App\Models\Blog;
use Inertia\Inertia;

class HomeController extends Controller
{
    public function index()
    {
        // Hero slider - featured series
        $heroSeries = Series::with(['nativeLanguage', 'genres'])
            ->withCount('chapters')
            ->where('status', 'ongoing')
            ->orderBy('created_at', 'desc')
            ->take(5)
            ->get();

        // Popular series based on chapters count and recent activity
    $popularSeries = Series::with(['nativeLanguage', 'genres', 'chapters' => function ($query) {
        // Override default orderBy from relation and take 2 newest by volume then chapter_number
        $query->reorder()->orderByDesc('volume')->orderByDesc('chapter_number')
            ->take(2)
            ->select(['id', 'series_id', 'title', 'chapter_number', 'chapter_link', 'volume', 'is_premium']);
        }])
            ->withCount('chapters')
            ->orderBy('chapters_count', 'desc')
            ->orderBy('updated_at', 'desc')
            ->take(6)
            ->get();

        // Latest updates - series with recent chapters, ordered by latest chapter creation
        $latestUpdates = Series::with(['nativeLanguage', 'genres', 'chapters' => function ($query) {
                $query->reorder()->orderByDesc('volume')->orderByDesc('chapter_number')
                    ->take(2)
                    ->select(['id', 'series_id', 'title', 'chapter_number', 'chapter_link', 'volume', 'is_premium']);
            }])
            ->withCount('chapters')
            ->whereHas('chapters') // Only series that have at least one chapter
            ->select('series.*', \DB::raw('(SELECT MAX(created_at) FROM chapters WHERE chapters.series_id = series.id) as latest_chapter_date'))
            ->orderByDesc('latest_chapter_date')
            ->take(24)
            ->get();

        // New series - recently published series
    $newSeries = Series::with(['nativeLanguage', 'genres', 'chapters' => function ($query) {
        $query->reorder()->orderByDesc('volume')->orderByDesc('chapter_number')
            ->take(2)
            ->select(['id', 'series_id', 'title', 'chapter_number', 'chapter_link', 'volume', 'is_premium']);
        }])
            ->withCount('chapters')
            ->orderBy('created_at', 'desc')
            ->take(12)
            ->get();

        // Check if user should see premium congratulations modal
        $showPremiumCongrats = false;
        if (auth()->check()) {
            $userId = auth()->id();
            if (cache()->has("show_premium_congratulations_{$userId}")) {
                $showPremiumCongrats = true;
                // Remove the cache flag after showing once
                cache()->forget("show_premium_congratulations_{$userId}");
            }
        }

        // Get latest blogs for announcements (limit 3)
        $blogs = Blog::where('show_in_homepage', true)->latest()->take(3)->get();

        return Inertia::render('Home', [
            'heroSeries' => $heroSeries,
            'popularSeries' => $popularSeries,
            'latestUpdates' => $latestUpdates,
            'newSeries' => $newSeries,
            'showPremiumCongrats' => $showPremiumCongrats,
            'blogs' => $blogs,
        ]);
    }
}
