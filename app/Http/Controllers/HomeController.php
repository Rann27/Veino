<?php

namespace App\Http\Controllers;

use App\Models\Series;
use App\Models\Chapter;
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
        $popularSeries = Series::with(['nativeLanguage', 'genres'])
            ->withCount('chapters')
            ->orderBy('chapters_count', 'desc')
            ->orderBy('updated_at', 'desc')
            ->take(6)
            ->get();

        // Latest updates - series with recent chapters
        $latestUpdates = Series::with(['nativeLanguage', 'genres', 'chapters' => function ($query) {
                $query->latest()->first();
            }])
            ->withCount('chapters')
            ->whereHas('chapters', function ($query) {
                $query->where('created_at', '>=', now()->subDays(30));
            })
            ->orderBy('updated_at', 'desc')
            ->take(24)
            ->get();

        // New series - recently published series
        $newSeries = Series::with(['nativeLanguage', 'genres'])
            ->withCount('chapters')
            ->orderBy('created_at', 'desc')
            ->take(12)
            ->get();

        return Inertia::render('Home', [
            'heroSeries' => $heroSeries,
            'popularSeries' => $popularSeries,
            'latestUpdates' => $latestUpdates,
            'newSeries' => $newSeries,
        ]);
    }
}
