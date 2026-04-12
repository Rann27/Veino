<?php

namespace App\Http\Controllers;

use App\Models\Chapter;
use App\Models\ChapterPurchase;
use App\Models\PaymentSetting;
use App\Models\Series;
use App\Models\Transaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class UserChapterController extends Controller
{
    public function show($seriesSlug, $chapterLink)
    {
        $series = Series::where('slug', $seriesSlug)->firstOrFail();
        
        $chapter = Chapter::where('series_id', $series->id)
            ->where('chapter_link', $chapterLink)
            ->firstOrFail();

        // Defer view increment to after response is sent (non-blocking)
        defer(fn() => $chapter->increment('views'));

        // Check if user can access this chapter
        $canAccess = true;
        $user = Auth::user();
        $isPremiumMember = false;
        $hasCoinPurchase = false;
        
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

                // Check if user has previously unlocked this chapter with coins
                $hasCoinPurchase = ChapterPurchase::where('user_id', $user->id)
                    ->where('chapter_id', $chapter->id)
                    ->exists();

                // Access granted if premium member OR has coin purchase
                $canAccess = $isPremiumMember || $hasCoinPurchase;
            }
        }

        // Get navigation chapters (using model methods for proper volume handling)
        $prevChapter = $chapter->getPreviousChapter();
        $nextChapter = $chapter->getNextChapter();

        // Get all chapters for navigation dropdown
        $allChapters = Chapter::where('series_id', $series->id)
            ->orderBy('volume')
            ->orderBy('chapter_number')
            ->get(['chapter_link', 'chapter_number', 'volume', 'title', 'is_premium']);

        return Inertia::render('Chapter/Show', [
            'series' => $series,
            'chapter' => array_merge(
                $chapter->only([
                    'id', 'title', 'chapter_number', 'chapter_link',
                    'is_premium', 'volume',
                ]),
                [
                    'content'    => $canAccess ? $chapter->content : null,
                    'coin_price' => PaymentSetting::get('premium_chapter_price', 10),
                ]
            ),
            'canAccess' => $canAccess,
            'isPremiumMember' => $isPremiumMember,
            'hasCoinPurchase' => $hasCoinPurchase,
            'prevChapter' => $prevChapter ? [
                'chapter_link' => $prevChapter->chapter_link,
                'title' => $prevChapter->title,
            ] : null,
            'nextChapter' => $nextChapter ? [
                'chapter_link' => $nextChapter->chapter_link,
                'title' => $nextChapter->title,
            ] : null,
            'allChapters' => $allChapters,
        ]);
    }

    /**
     * Unlock a premium chapter with coins
     */
    public function purchase(Request $request, $seriesSlug, $chapterLink)
    {
        $user = Auth::user();
        if (!$user) {
            return redirect()->route('login')->with('error', 'Please log in to unlock this chapter.');
        }

        $series = Series::where('slug', $seriesSlug)->firstOrFail();
        $chapter = Chapter::where('series_id', $series->id)
            ->where('chapter_link', $chapterLink)
            ->firstOrFail();

        // Must be a premium chapter
        if (!$chapter->is_premium) {
            return back()->with('error', 'This chapter does not require unlocking.');
        }

        // Already accessible via membership
        if ($user->hasActiveMembership()) {
            return back()->with('info', 'You already have access via Premium Membership.');
        }

        // Already purchased with coins
        $alreadyPurchased = ChapterPurchase::where('user_id', $user->id)
            ->where('chapter_id', $chapter->id)
            ->exists();

        if ($alreadyPurchased) {
            return back()->with('info', 'You have already unlocked this chapter.');
        }

        // Check sufficient coins
        $price = PaymentSetting::get('premium_chapter_price', 10);
        if ($price <= 0) {
            return back()->with('error', 'Premium chapter price is not configured.');
        }

        if (!$user->hasEnoughCoins($price)) {
            return back()->with('error', "Not enough coins. You need {$price} coins but have {$user->coins}.");
        }

        // Process purchase atomically
        DB::transaction(function () use ($user, $chapter, $price) {
            // Deduct coins
            $user->deductCoins($price);
            $user->save();

            // Record chapter purchase
            ChapterPurchase::create([
                'user_id'    => $user->id,
                'chapter_id' => $chapter->id,
                'coin_price' => $price,
            ]);

            // Record transaction
            Transaction::create([
                'user_id'        => $user->id,
                'type'           => 'chapter_purchase',
                'amount'         => 0,
                'coins_spent'    => $price,
                'payment_method' => 'coins',
                'status'         => 'completed',
                'chapter_id'     => $chapter->id,
                'description'    => "Unlocked chapter: {$chapter->title}",
            ]);
        });

        return redirect()->route('chapters.show', [$seriesSlug, $chapterLink])
            ->with('success', "Chapter unlocked! {$price} coins spent.");
    }
}
