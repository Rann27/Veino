<?php

namespace App\Http\Controllers;

use App\Models\Series;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SearchController extends Controller
{
    public function search(Request $request)
    {
        $query = $request->get('q', '');
        
        if (empty($query)) {
            return redirect()->route('explore');
        }

        $series = Series::where(function($q) use ($query) {
                $q->where('title', 'LIKE', "%{$query}%")
                  ->orWhere('alternative_title', 'LIKE', "%{$query}%");
            })
            ->with(['genres', 'nativeLanguage'])
            ->withCount('chapters')
            ->paginate(20);

        return Inertia::render('Search/Results', [
            'series' => $series,
            'query' => $query,
        ]);
    }

    public function suggestions(Request $request)
    {
        $query = $request->get('q', '');
        
        if (strlen($query) < 2) {
            return response()->json([]);
        }

        $suggestions = Series::where(function($q) use ($query) {
                $q->where('title', 'LIKE', "%{$query}%")
                  ->orWhere('alternative_title', 'LIKE', "%{$query}%");
            })
            ->with(['genres', 'nativeLanguage'])
            ->withCount('chapters')
            ->limit(5)
            ->get()
            ->map(function ($series) {
                return [
                    'id' => $series->id,
                    'title' => $series->title,
                    'slug' => $series->slug,
                    'cover_url' => $series->cover_url,
                    'author' => $series->author,
                    'rating' => $series->rating,
                    'status' => $series->status,
                    'chapters_count' => $series->chapters_count,
                    'genres' => $series->genres,
                    'native_language' => $series->nativeLanguage,
                ];
            });

        return response()->json($suggestions);
    }
}
