<?php

namespace App\Http\Controllers;

use App\Models\Chapter;
use App\Models\Series;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class UserChapterController extends Controller
{
    public function show($seriesSlug, $chapterNumber)
    {
        $series = Series::where('slug', $seriesSlug)->firstOrFail();
        
        $chapter = Chapter::where('series_id', $series->id)
            ->where('chapter_number', $chapterNumber)
            ->firstOrFail();

        // Check if user can access this chapter
        $canAccess = true;
        $user = Auth::user();
        
        if ($chapter->is_premium && $user) {
            // Check if user has enough coins or has already purchased
            $canAccess = $user->coin_balance >= $chapter->coin_cost;
            // TODO: Add logic to check if user has already purchased this chapter
        } elseif ($chapter->is_premium && !$user) {
            $canAccess = false;
        }

        // Get navigation chapters
        $prevChapter = Chapter::where('series_id', $series->id)
            ->where('chapter_number', '<', $chapterNumber)
            ->orderBy('chapter_number', 'desc')
            ->first(['chapter_number', 'title']);

        $nextChapter = Chapter::where('series_id', $series->id)
            ->where('chapter_number', '>', $chapterNumber)
            ->orderBy('chapter_number')
            ->first(['chapter_number', 'title']);

        // Get all chapters for navigation dropdown
        $allChapters = Chapter::where('series_id', $series->id)
            ->orderBy('chapter_number')
            ->get(['chapter_number', 'title', 'is_premium']);

        return Inertia::render('Chapter/Show', [
            'series' => $series,
            'chapter' => $chapter,
            'canAccess' => $canAccess,
            'prevChapter' => $prevChapter,
            'nextChapter' => $nextChapter,
            'allChapters' => $allChapters,
        ]);
    }

    public function purchase(Request $request, $seriesSlug, $chapterNumber)
    {
        $user = Auth::user();
        if (!$user) {
            return back()->with('error', 'Please log in to purchase chapters.');
        }

        $series = Series::where('slug', $seriesSlug)->firstOrFail();
        $chapter = Chapter::where('series_id', $series->id)
            ->where('chapter_number', $chapterNumber)
            ->firstOrFail();

        if (!$chapter->is_premium) {
            return back()->with('error', 'This chapter is free to read.');
        }

        if ($user->coin_balance < $chapter->coin_cost) {
            return back()->with('error', 'Insufficient coins. Please purchase more coins.');
        }

        // Deduct coins
        $user->decrement('coin_balance', $chapter->coin_cost);

        // TODO: Record the purchase in a user_chapter_purchases table

        return back()->with('success', 'Chapter purchased successfully!');
    }
}
