<?php

namespace App\Http\Controllers;

use App\Models\EbookSeries;
use App\Models\Genre;
use Illuminate\Http\Request;
use Inertia\Inertia;

class EbookSeriesController extends Controller
{
    /**
     * Display list of ebook series (shop homepage)
     */
    public function index(Request $request)
    {
        $query = EbookSeries::with(['genres', 'items']);

        // Search
        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('alternative_title', 'like', "%{$search}%")
                  ->orWhere('author', 'like', "%{$search}%");
            });
        }

        // Filter by multiple genres
        if ($request->has('genres') && is_array($request->genres) && count($request->genres) > 0) {
            $query->whereHas('genres', function ($q) use ($request) {
                $q->whereIn('genres.id', $request->genres);
            });
        }

        // Filter by type (premium / exclusive)
        $type = $request->get('type', 'all');
        if ($type === 'premium') {
            $query->where('free_for_premium_members', true);
        } elseif ($type === 'exclusive') {
            $query->where('free_for_premium_members', false);
        }

        // Sorting
        $sort = $request->get('sort', 'latest');
        switch ($sort) {
            case 'title_asc':
                $query->orderBy('title', 'asc');
                break;
            case 'title_desc':
                $query->orderBy('title', 'desc');
                break;
            case 'popular':
                $query->withCount('items')
                      ->orderBy('items_count', 'desc');
                break;
            case 'latest':
            default:
                $query->orderBy('created_at', 'desc');
                break;
        }

        $series = $query->paginate(12);

        // Add price_range attribute to each series
        $series->getCollection()->transform(function ($s) {
            $s->price_range = $s->price_range;
            $s->cover_url = $s->cover_url;
            $s->free_for_premium_members = (bool) $s->free_for_premium_members;
            $s->is_mature = (bool) $s->is_mature;
            return $s;
        });

        // Get chart items for current user
        $userId = auth()->id();
        $chartItems = [];
        $totalPrice = 0;
        
        if ($userId) {
            $user = auth()->user();
            $chartItems = \App\Models\ChartItem::where('user_id', $userId)
                ->with(['ebookItem.ebookSeries'])
                ->get()
                ->reject(function ($chartItem) use ($user) {
                    return $chartItem->ebookItem->isFreeForPremiumMember($user);
                })
                ->map(function ($chartItem) {
                    return [
                        'chart_item_id' => $chartItem->id,
                        'id' => $chartItem->ebookItem->id,
                        'title' => $chartItem->ebookItem->title,
                        'price_coins' => $chartItem->ebookItem->price_coins,
                        'series_title' => $chartItem->ebookItem->ebookSeries->title,
                    ];
                })
                ->toArray();
            
            $totalPrice = array_sum(array_column($chartItems, 'price_coins'));
        }

        return Inertia::render('EpubNovels/Index', [
            'series' => $series,
            'genres' => Genre::all(),
            'filters' => [
                'search' => $request->search,
                'genres' => $request->genres,
                'sort' => $sort,
                'type' => $type,
            ],
            'chartItems' => $chartItems,
            'totalPrice' => $totalPrice,
        ]);
    }

    /**
     * Display single ebook series with items
     */
    public function show($slug)
    {
        $series = EbookSeries::where('slug', $slug)
            ->with(['genres', 'items' => function ($query) {
                $query->orderBy('order', 'asc');
            }])
            ->firstOrFail();

        $userId = auth()->id();

        // Add status for each item (in cart, purchased, etc)
        $user = auth()->user();
        $hasPremiumSeriesAccess = $user && $series->free_for_premium_members && $user->isPremiumMember();

        $items = $series->items->map(function ($item) use ($userId, $hasPremiumSeriesAccess) {
            $isPurchased = $userId ? $item->isPurchasedBy($userId) : false;

            return [
                'id' => $item->id,
                'title' => $item->title,
                'cover' => $item->cover,
                'cover_url' => $item->cover_url,
                'summary' => $item->summary,
                'price_coins' => $item->price_coins,
                'order' => $item->order,
                'has_pdf_file' => !empty($item->pdf_file_path),
                'has_preview' => !empty($item->preview_content),
                'is_in_cart' => $userId && !$hasPremiumSeriesAccess ? $item->isInCartOf($userId) : false,
                'is_purchased' => $isPurchased || $hasPremiumSeriesAccess,
                'is_owned' => $isPurchased,
                'is_premium_access' => $hasPremiumSeriesAccess && !$isPurchased,
            ];
        });

        // Get chart items for current user
        $chartItems = [];
        $totalPrice = 0;
        
        if ($userId) {
            $chartItems = \App\Models\ChartItem::where('user_id', $userId)
                ->with(['ebookItem.ebookSeries'])
                ->get()
                ->reject(function ($chartItem) use ($user) {
                    return $chartItem->ebookItem->isFreeForPremiumMember($user);
                })
                ->map(function ($chartItem) {
                    return [
                        'chart_item_id' => $chartItem->id,
                        'id' => $chartItem->ebookItem->id,
                        'title' => $chartItem->ebookItem->title,
                        'price_coins' => $chartItem->ebookItem->price_coins,
                        'series_title' => $chartItem->ebookItem->ebookSeries->title,
                    ];
                })
                ->toArray();
            
            $totalPrice = array_sum(array_column($chartItems, 'price_coins'));
        }

        return Inertia::render('EpubNovels/Show', [
            'series' => [
                'id' => $series->id,
                'title' => $series->title,
                'alternative_title' => $series->alternative_title,
                'slug' => $series->slug,
                'cover' => $series->cover,
                'cover_url' => $series->cover_url,
                'synopsis' => $series->synopsis,
                'author' => $series->author,
                'artist' => $series->artist,
                'genres' => $series->genres,
                'show_trial_button' => $series->show_trial_button,
                'series_slug' => $series->series_slug,
                'free_for_premium_members' => (bool) $series->free_for_premium_members,
                'has_premium_access' => (bool) $hasPremiumSeriesAccess,
                'is_mature' => (bool) $series->is_mature,
            ],
            'items' => $items,
            'chartItems' => $chartItems,
            'totalPrice' => $totalPrice,
        ]);
    }

    /**
     * Display ebook item preview (reader-style)
     */
    public function showPreview($slug, $itemId)
    {
        $series = EbookSeries::where('slug', $slug)->firstOrFail();

        $item = \App\Models\EbookItem::where('ebook_series_id', $series->id)
            ->whereNotNull('preview_content')
            ->findOrFail($itemId);

        return Inertia::render('EpubNovels/Preview', [
            'series' => [
                'id'    => $series->id,
                'title' => $series->title,
                'slug'  => $series->slug,
            ],
            'item' => [
                'id'              => $item->id,
                'title'           => $item->title,
                'order'           => $item->order,
                'preview_content' => $item->preview_content,
            ],
        ]);
    }
}
