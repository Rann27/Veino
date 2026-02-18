<?php

namespace App\Http\Controllers;

use App\Models\Series;
use App\Models\Genre;
use App\Models\NativeLanguage;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ExploreController extends Controller
{
    public function index(Request $request)
    {
        $query = Series::with(['genres', 'nativeLanguage'])
            ->withCount('chapters')
            ->orderByDesc('created_at');

        // Search by title or author
        if ($request->filled('search')) {
            $searchTerm = $request->search;
            $query->where(function ($q) use ($searchTerm) {
                $q->where('title', 'like', "%{$searchTerm}%")
                  ->orWhere('author', 'like', "%{$searchTerm}%");
            });
        }

        // Filter by genres
        if ($request->filled('genres')) {
            $genreIds = is_array($request->genres) ? $request->genres : [$request->genres];
            $query->whereHas('genres', function ($q) use ($genreIds) {
                $q->whereIn('genres.id', $genreIds);
            });
        }

        // Filter by native language
        if ($request->filled('language')) {
            $query->where('native_language_id', $request->language);
        }

        // Filter by status
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        // Filter by type
        if ($request->filled('type')) {
            $query->where('type', $request->type);
        }

        // Sort options
        if ($request->filled('sort')) {
            switch ($request->sort) {
                case 'title':
                    $query->orderBy('title');
                    break;
                case 'latest':
                    $query->orderByDesc('created_at');
                    break;
                case 'popular':
                    $query->orderByDesc('chapters_count');
                    break;
                case 'rating':
                    $query->orderByDesc('rating');
                    break;
                default:
                    $query->orderByDesc('created_at');
            }
        }

        $series = $query->paginate(18)->withQueryString();

        // Get filter options
        $genres = Genre::orderBy('name')->get();
        $languages = NativeLanguage::orderBy('name')->get();

        return Inertia::render('Explore', [
            'series' => $series,
            'genres' => $genres,
            'languages' => $languages,
            'filters' => [
                'search' => $request->search,
                'genres' => $request->genres,
                'language' => $request->language,
                'status' => $request->status,
                'type' => $request->type,
                'sort' => $request->sort ?? 'latest',
            ],
        ]);
    }
}
