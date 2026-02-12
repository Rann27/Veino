<?php

namespace App\Http\Controllers;

use App\Models\Series;
use App\Models\Chapter;
use App\Models\Blog;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class HomeController extends Controller
{
    /**
     * Get homepage configuration
     */
    private function getConfig(): array
    {
        if (Storage::exists('homepage-config.json')) {
            $config = json_decode(Storage::get('homepage-config.json'), true);
            return $config ?? ['hero_series' => [], 'featured_series' => []];
        }
        
        return ['hero_series' => [], 'featured_series' => []];
    }

    public function index()
    {
        $config = $this->getConfig();

        // Hero slider - from configuration or fallback to latest ongoing
        if (!empty($config['hero_series'])) {
            $heroSeries = Series::with(['nativeLanguage', 'genres'])
                ->withCount('chapters')
                ->whereIn('id', $config['hero_series'])
                ->get()
                ->sortBy(function($series) use ($config) {
                    return array_search($series->id, $config['hero_series']);
                })
                ->values();
        } else {
            $heroSeries = Series::with(['nativeLanguage', 'genres'])
                ->withCount('chapters')
                ->where('status', 'ongoing')
                ->orderBy('created_at', 'desc')
                ->take(5)
                ->get();
        }

        // Featured series - from configuration or fallback to popular
        if (!empty($config['featured_series'])) {
            $featuredSeries = Series::with(['nativeLanguage', 'genres', 'chapters' => function ($query) {
                $query->reorder()->orderByDesc('volume')->orderByDesc('chapter_number')
                    ->take(2)
                    ->select(['id', 'series_id', 'title', 'chapter_number', 'chapter_link', 'volume', 'is_premium']);
                }])
                ->withCount('chapters')
                ->whereIn('id', $config['featured_series'])
                ->get()
                ->sortBy(function($series) use ($config) {
                    return array_search($series->id, $config['featured_series']);
                })
                ->values();
        } else {
            $featuredSeries = Series::with(['nativeLanguage', 'genres', 'chapters' => function ($query) {
                $query->reorder()->orderByDesc('volume')->orderByDesc('chapter_number')
                    ->take(2)
                    ->select(['id', 'series_id', 'title', 'chapter_number', 'chapter_link', 'volume', 'is_premium']);
                }])
                ->withCount('chapters')
                ->orderBy('chapters_count', 'desc')
                ->orderBy('updated_at', 'desc')
                ->take(6)
                ->get();
        }

        // Light Novel updates - series with type='light-novel' and recent chapters
        $lightNovelUpdates = Series::with(['nativeLanguage', 'genres', 'chapters' => function ($query) {
                $query->reorder()->orderByDesc('volume')->orderByDesc('chapter_number')
                    ->take(2)
                    ->select(['id', 'series_id', 'title', 'chapter_number', 'chapter_link', 'volume', 'is_premium']);
            }])
            ->withCount('chapters')
            ->where('type', 'light-novel')
            ->whereHas('chapters')
            ->select('series.*', \DB::raw('(SELECT MAX(created_at) FROM chapters WHERE chapters.series_id = series.id) as latest_chapter_date'))
            ->orderByDesc('latest_chapter_date')
            ->take(6)
            ->get();

        // Web Novel updates - series with type='web-novel' and recent chapters  
        $webNovelUpdates = Series::with(['nativeLanguage', 'genres', 'chapters' => function ($query) {
                $query->reorder()->orderByDesc('volume')->orderByDesc('chapter_number')
                    ->take(2)
                    ->select(['id', 'series_id', 'title', 'chapter_number', 'chapter_link', 'volume', 'is_premium']);
            }])
            ->withCount('chapters')
            ->where('type', 'web-novel')
            ->whereHas('chapters')
            ->select('series.*', \DB::raw('(SELECT MAX(created_at) FROM chapters WHERE chapters.series_id = series.id) as latest_chapter_date'))
            ->orderByDesc('latest_chapter_date')
            ->take(6)
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
            'featuredSeries' => $featuredSeries,
            'lightNovelUpdates' => $lightNovelUpdates,
            'webNovelUpdates' => $webNovelUpdates,
            'newSeries' => $newSeries,
            'showPremiumCongrats' => $showPremiumCongrats,
            'blogs' => $blogs,
        ]);
    }
}
