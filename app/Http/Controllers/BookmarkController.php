<?php

namespace App\Http\Controllers;

use App\Models\Bookmark;
use App\Models\Series;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class BookmarkController extends Controller
{
    public function index()
    {
        $user = Auth::user();
        
        $bookmarks = Bookmark::with(['series' => function($query) {
                $query->select('id', 'title', 'slug', 'cover_url', 'author', 'status', 'rating');
            }])
            ->where('user_id', $user->id)
            ->latest()
            ->get()
            ->map(function ($bookmark) {
                return [
                    'id' => $bookmark->id,
                    'series_title' => $bookmark->series->title,
                    'series_slug' => $bookmark->series->slug,
                    'series_cover' => $bookmark->series->cover_url,
                    'series_author' => $bookmark->series->author,
                    'series_status' => $bookmark->series->status,
                    'series_rating' => $bookmark->series->rating,
                    'bookmarked_at' => $bookmark->created_at->toISOString(),
                    'note' => $bookmark->note,
                ];
            });

        return Inertia::render('Account/Bookmarks', [
            'bookmarks' => $bookmarks,
        ]);
    }

    public function store(Request $request, Series $series)
    {
        $user = Auth::user();

        // Check if already bookmarked
        $existingBookmark = Bookmark::where('user_id', $user->id)
            ->where('series_id', $series->id)
            ->first();

        if ($existingBookmark) {
            return response()->json([
                'message' => 'Series already bookmarked',
                'bookmarked' => true
            ], 200);
        }

        $validated = $request->validate([
            'note' => 'nullable|string|max:500'
        ]);

        Bookmark::create([
            'user_id' => $user->id,
            'series_id' => $series->id,
            'note' => $validated['note'] ?? null,
        ]);

        return response()->json([
            'message' => 'Series bookmarked successfully',
            'bookmarked' => true
        ], 201);
    }

    public function destroy(Series $series)
    {
        $user = Auth::user();

        $bookmark = Bookmark::where('user_id', $user->id)
            ->where('series_id', $series->id)
            ->first();

        if (!$bookmark) {
            return response()->json([
                'message' => 'Bookmark not found',
                'bookmarked' => false
            ], 404);
        }

        $bookmark->delete();

        return response()->json([
            'message' => 'Bookmark removed successfully',
            'bookmarked' => false
        ], 200);
    }

    public function destroyById(Bookmark $bookmark)
    {
        $user = Auth::user();

        if ($bookmark->user_id !== $user->id) {
            return response()->json([
                'message' => 'Unauthorized'
            ], 403);
        }

        $bookmark->delete();

        return response()->json([
            'message' => 'Bookmark removed successfully'
        ], 200);
    }

    public function check(Series $series)
    {
        $user = Auth::user();

        $isBookmarked = Bookmark::where('user_id', $user->id)
            ->where('series_id', $series->id)
            ->exists();

        return response()->json([
            'bookmarked' => $isBookmarked
        ]);
    }
}
