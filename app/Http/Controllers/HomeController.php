<?php

namespace App\Http\Controllers;

use App\Models\Series;
use App\Models\Chapter;
use App\Models\Blog;
use App\Models\EbookSeries;
use App\Models\ReadingHistory;
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

    public function index(\App\Services\HomeRanking $ranking)
    {
        $config = $this->getConfig();

        // Hero and featured are ranked by reader traffic now, not by the manual
        // picks in Misc. That configuration is left in place but no longer read —
        // see HomeRanking for the windows and why only light novels compete.
        $heroIds = $ranking->heroSeriesIds(5);

        $heroSeries = Series::with(['nativeLanguage', 'genres'])
            ->withCount('chapters')
            ->whereIn('id', $heroIds)
            ->get()
            // whereIn returns rows in whatever order the database likes, so the
            // ranking has to be reapplied here or the ordering is lost.
            ->sortBy(fn ($series) => array_search($series->id, $heroIds))
            ->values();

        // Featured series - 10 for fullwidth layout
        // No genres eager-load here: only the hero renders genre chips and a
        // synopsis. The cards below show cover, title, rating and chapter count,
        // so shipping both fields cost ~16 KB for nothing.
        $featuredIds = $ranking->featuredSeriesIds(10);

        $featuredSeries = Series::with(['nativeLanguage'])
            ->withCount('chapters')
            ->whereIn('id', $featuredIds)
            ->get()
            ->sortBy(fn ($series) => array_search($series->id, $featuredIds))
            ->values();

        // Latest updates - merged Light Novel + Web Novel with premium/free chapter mix
        $latestUpdates = $this->getLatestUpdates('all', 12);

        // Epub novels - latest ebook series for homepage preview
        // items are loaded only to compute price_range, then dropped: each volume
        // carries a preview_content blob of ~19 KB, and shipping them made this
        // one prop 144 KB — a third of the homepage document — for data the page
        // never renders. Only price_coins is needed to work out the range.
        $epubSeries = EbookSeries::with(['items:id,ebook_series_id,price_coins'])
            ->orderBy('created_at', 'desc')
            ->take(12)
            ->get()
            // Projected to a plain array rather than handed over as a model.
            // price_range sits in $appends and its accessor reads $this->items,
            // so serialising the model lazy-loads the volumes straight back in —
            // unsetRelation() cannot win against that. Listing the fields the
            // grid actually renders is both smaller and immune to it.
            ->map(fn ($series) => [
                'id' => $series->id,
                'slug' => $series->slug,
                'series_slug' => $series->series_slug,
                'title' => $series->title,
                'cover_url' => $series->cover_url,
                'price_range' => $series->price_range,
                'free_for_premium_members' => (bool) $series->free_for_premium_members,
                'is_mature' => (bool) $series->is_mature,
            ]);

        // New series - recently published (16 cards for fullwidth grid)
        $newSeries = Series::with(['nativeLanguage'])
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

        // Continue Reading — last 20 distinct series the user has read
        $continueReading = [];
        if (auth()->check()) {
            $continueReading = ReadingHistory::where('user_id', auth()->id())
                ->with(['series', 'chapter'])
                ->orderByDesc('last_read_at')
                ->get()
                ->unique('series_id')
                ->take(20)
                ->map(function ($history) {
                    if (!$history->series || !$history->chapter) return null;
                    return [
                        'series_id'      => $history->series->id,
                        'series_title'   => $history->series->title,
                        'series_slug'    => $history->series->slug,
                        'cover_url'      => $history->series->cover_url ?? null,
                        'chapter_link'   => $history->chapter->chapter_link,
                        'chapter_number' => $history->chapter->chapter_number,
                        'chapter_title'  => $history->chapter->title,
                        'last_read_at'   => $history->last_read_at->toISOString(),
                    ];
                })
                ->filter()
                ->values()
                ->toArray();
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
            // synopsis is a long text column the card grids never print; only the
            // hero shows it. Hiding it on the other three collections removes
            // roughly 35 KB from every homepage document.
            'featuredSeries' => $featuredSeries->makeHidden(['synopsis']),
            'latestUpdates' => $latestUpdates->makeHidden(['synopsis']),
            'epubSeries' => $epubSeries,
            'newSeries' => $newSeries->makeHidden(['synopsis']),
            'showPremiumCongrats' => $showPremiumCongrats,
            'blogs' => $blogs,
            'banners' => $banners,
            'continueReading' => $continueReading,
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
        $query = Series::with(['nativeLanguage'])
            ->withCount('chapters')
            ->whereHas('chapters')
            ->select('series.*', \DB::raw('(SELECT MAX(updated_at) FROM chapters WHERE chapters.series_id = series.id) as latest_chapter_date'))
            ->orderByDesc('latest_chapter_date');

        if ($type === 'light-novel') {
            $query->where('type', 'light-novel');
        } elseif ($type === 'web-novel') {
            $query->where('type', 'web-novel');
        }

        $series = $query
            ->orderByDesc('series.updated_at')
            ->orderByDesc('series.id')
            ->take($limit * 3)
            ->get()
            ->unique('id')
            ->take($limit)
            ->values();

        // Load top 2 premium + top 2 free chapters per series in 2 batch queries (avoids N+1)
        $seriesIds = $series->pluck('id');
        $chapterSelect = ['id', 'series_id', 'title', 'chapter_number', 'chapter_link', 'volume', 'is_premium', 'created_at'];

        $premiumChapters = Chapter::whereIn('series_id', $seriesIds)
            ->where('is_premium', true)
            ->select($chapterSelect)
            ->orderByDesc('volume')
            ->orderByDesc('chapter_number')
            ->get()
            ->groupBy('series_id')
            ->map(fn($g) => $g->take(2));

        $freeChapters = Chapter::whereIn('series_id', $seriesIds)
            ->where('is_premium', false)
            ->select($chapterSelect)
            ->orderByDesc('volume')
            ->orderByDesc('chapter_number')
            ->get()
            ->groupBy('series_id')
            ->map(fn($g) => $g->take(4)); // up to 4 free when no premium chapters exist

        $series->each(function ($s) use ($premiumChapters, $freeChapters) {
            $premium = $premiumChapters->get($s->id, collect());
            $free    = $freeChapters->get($s->id, collect());
            // Premium first, then free — frontend splits by is_premium flag
            $s->setRelation('chapters', $premium->concat($free)->unique('id')->values());
        });

        return $series;
    }
}
