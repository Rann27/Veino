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

        // Increment views
        $chapter->increment('views');

        // Check if user can access this chapter
        $canAccess = true;
        $user = Auth::user();
        $isPremiumMember = false;
        
        // Log reading history for authenticated users
        if ($user) {
            \App\Models\ReadingHistory::updateOrCreateHistory(
                $user->id,
                $series->id,
                $chapter->id
            );
        }
        
        if ($chapter->is_premium) {
            if (!$user) {
                $canAccess = false;
            } else {
                // Check if user has active premium membership
                $isPremiumMember = $user->hasActiveMembership();
                
                // User can access if they have premium membership
                $canAccess = $isPremiumMember;
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
            'isPremiumMember' => $isPremiumMember,
            'prevChapter' => $prevChapter,
            'nextChapter' => $nextChapter,
            'allChapters' => $allChapters,
        ]);
    }

    /**
     * Deprecated: Chapter purchases now handled through premium membership
     * Redirects users to membership page
     */
    public function purchase(Request $request, $seriesSlug, $chapterNumber)
    {
        $user = Auth::user();
        if (!$user) {
            return redirect()->route('login')->with('error', 'Please log in to access premium chapters.');
        }

        // Redirect to membership page
        return redirect()->route('membership.index')
            ->with('info', 'Premium chapters are now unlocked with Premium Membership. Get unlimited access to all premium content!');
    }
}
