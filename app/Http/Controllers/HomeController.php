<?php

namespace App\Http\Controllers;

use App\Models\Series;
use App\Models\Chapter;
use App\Models\Blog;
use Illuminate\Http\Request;
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
            return $config ?? ['hero_series' => [], 'featured_series' => [], 'banners' => []];
        }

        return ['hero_series' => [], 'featured_series' => [], 'banners' => []];
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
                ->sortBy(function ($series) use ($config) {
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

        // Featured series - 10 for fullwidth layout
        if (!empty($config['featured_series'])) {
            $featuredSeries = Series::with(['nativeLanguage', 'genres'])
                ->withCount('chapters')
                ->whereIn('id', $config['featured_series'])
                ->get()
                ->sortBy(function ($series) use ($config) {
                    return array_search($series->id, $config['featured_series']);
                })
                ->values();
        } else {
            $featuredSeries = Series::with(['nativeLanguage', 'genres'])
                ->withCount('chapters')
                ->orderBy('chapters_count', 'desc')
                ->orderBy('updated_at', 'desc')
                ->take(10)
                ->get();
        }

        // Latest updates - merged Light Novel + Web Novel with premium/free chapter mix
        $latestUpdates = $this->getLatestUpdates('all', 12);

        // New series - recently published (16 cards for fullwidth grid)
        $newSeries = Series::with(['nativeLanguage', 'genres'])
            ->withCount('chapters')
            ->orderBy('created_at', 'desc')
            ->take(16)
            ->get();

        // Check if user should see premium congratulations modal
        $showPremiumCongrats = false;
        if (auth()->check()) {
            $userId = auth()->id();
            if (cache()->has("show_premium_congratulations_{$userId}")) {
                $showPremiumCongrats = true;
                cache()->forget("show_premium_congratulations_{$userId}");
            }
        }

        // Get latest blogs for announcements
        $blogs = Blog::where('show_in_homepage', true)->latest()->take(3)->get();

        // Promotional banners from config — convert paths to URLs
        $banners = collect($config['banners'] ?? [])->map(function ($banner) {
            if (!empty($banner['image_path'])) {
                $banner['image_url'] = Storage::disk('public')->url($banner['image_path']);
            }
            return $banner;
        })->filter(fn($b) => !empty($b['image_url']))->values()->toArray();

        return Inertia::render('Home', [
            'heroSeries' => $heroSeries,
            'featuredSeries' => $featuredSeries,
            'latestUpdates' => $latestUpdates,
            'newSeries' => $newSeries,
            'showPremiumCongrats' => $showPremiumCongrats,
            'blogs' => $blogs,
            'banners' => $banners,
        ]);
    }

    /**
     * AJAX endpoint for Latest Updates tab switching
     */
    public function latestUpdates(Request $request)
    {
        $type = $request->get('type', 'all');
        $series = $this->getLatestUpdates($type, 12);
        return response()->json($series);
    }

    /**
     * Get latest updated series with mixed premium/free chapters
     */
    private function getLatestUpdates(string $type, int $limit)
    {
        $query = Series::with(['nativeLanguage', 'genres'])
            ->with(['chapters' => function ($query) {
                $query->reorder()
                    ->orderByDesc('volume')
                    ->orderByDesc('chapter_number')
                    ->take(8) // Load extra so frontend can pick 2 premium + 2 free
                    ->select(['id', 'series_id', 'title', 'chapter_number', 'chapter_link', 'volume', 'is_premium']);
            }])
            ->withCount('chapters')
            ->whereHas('chapters')
            ->select('series.*', \DB::raw('(SELECT MAX(created_at) FROM chapters WHERE chapters.series_id = series.id) as latest_chapter_date'))
            ->orderByDesc('latest_chapter_date');

        if ($type === 'light-novel') {
            $query->where('type', 'light-novel');
        } elseif ($type === 'web-novel') {
            $query->where('type', 'web-novel');
        }

        return $query->take($limit)->get();
    }
}
