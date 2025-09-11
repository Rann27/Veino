<?php

namespace App\Http\Controllers;

use App\Models\Chapter;
use App\Models\Series;
use App\Models\User;
use App\Models\ChapterPurchase;
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
        $hasPurchased = false;
        
        if ($chapter->is_premium) {
            if (!$user) {
                $canAccess = false;
            } else {
                // Check if user has already purchased this chapter
                $hasPurchased = ChapterPurchase::where('user_id', $user->id)
                    ->where('chapter_id', $chapter->id)
                    ->exists();
                
                // User can access if they have purchased the chapter
                $canAccess = $hasPurchased;
            }
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
            'hasPurchased' => $hasPurchased,
            'userCoins' => $user ? $user->coins : 0,
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

        // Check if already purchased
        $hasPurchased = ChapterPurchase::where('user_id', $user->id)
            ->where('chapter_id', $chapter->id)
            ->exists();
            
        if ($hasPurchased) {
            return back()->with('info', 'You have already purchased this chapter.');
        }

        if ($user->coins < $chapter->coin_price) {
            return back()->with('error', 'Insufficient coins. Please purchase more coins.');
        }

        // Start transaction
        \DB::transaction(function () use ($user, $chapter) {
            // Deduct coins
            $user->decrement('coins', $chapter->coin_price);
            
            // Record the purchase
            ChapterPurchase::create([
                'user_id' => $user->id,
                'chapter_id' => $chapter->id,
                'coin_price' => $chapter->coin_price,
            ]);
        });

        return back()->with('success', 'Chapter purchased successfully!');
    }
}
