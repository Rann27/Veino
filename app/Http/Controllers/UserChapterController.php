<?php

namespace App\Http\Controllers;

use App\Models\Chapter;
use App\Models\ChapterPurchase;
use App\Models\Mark;
use App\Models\PaymentSetting;
use App\Models\Series;
use App\Models\Transaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class UserChapterController extends Controller
{
    public function show(Request $request, $seriesSlug, $chapterLink)
    {
        $series = Series::where('slug', $seriesSlug)->firstOrFail();
        
        $chapter = Chapter::where('series_id', $series->id)
            ->where('chapter_link', $chapterLink)
            ->where('is_published', true)
            ->firstOrFail();

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
        
        $unlock = app(\App\Services\ChapterUnlockService::class);
        $temporaryAccess = null;

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

                // Time-limited access earned through the shortlink challenge
                $temporaryAccess = \App\Models\ChapterTemporaryAccess::where('user_id', $user->id)
                    ->where('chapter_id', $chapter->id)
                    ->active()
                    ->first();

                $canAccess = $isPremiumMember || $hasCoinPurchase || $temporaryAccess !== null;
            }
        }

        // Only count a view when the user can actually read the content.
        // withoutTimestamps() prevents touching updated_at, which would
        // incorrectly bubble the series up in the Latest Updates feed.
        if ($canAccess) {
            defer(fn() => Chapter::withoutTimestamps(fn() => $chapter->increment('views')));
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
            'challenge' => [
                'available' => $unlock->availableFor($user, $chapter),
                // Seconds until the free unlock opens; null once it is open.
                'opens_in' => ($opens = $unlock->freeUnlockOpensAt($chapter))
                    ? (int) now()->diffInSeconds($opens)
                    : null,
                'opens_at' => $opens?->toIso8601String(),
                'days' => $unlock->accessDays(),
                'daily_limit' => $unlock->dailyLimit(),
                'used_today' => $user ? $unlock->grantsToday($user) : 0,
                // Surfaced on purpose: if sandbox is ever left on in production
                // the button says so, rather than quietly giving chapters away.
                'sandbox' => $unlock->sandbox(),
            ],
            'temporaryAccessExpiresAt' => $temporaryAccess?->expires_at?->toIso8601String(),
            'justUnlocked' => $request->boolean('unlocked'),
            'prevChapter' => $prevChapter ? [
                'chapter_link' => $prevChapter->chapter_link,
                'title' => $prevChapter->title,
            ] : null,
            'nextChapter' => $nextChapter ? [
                'chapter_link' => $nextChapter->chapter_link,
                'title' => $nextChapter->title,
            ] : null,
            'allChapters' => $allChapters,
            'marks' => $user
                ? Mark::where('user_id', $user->id)
                    ->where('chapter_id', $chapter->id)
                    ->get(['id', 'paragraph_index', 'paragraph_preview'])
                    ->toArray()
                : [],
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
            ->where('is_published', true)
            ->firstOrFail();

        // Must be a premium chapter
        if (!$chapter->is_premium) {
            return back()->with('error', 'This chapter does not require unlocking.');
        }

        // Already accessible via membership
        if ($user->hasActiveMembership()) {
            return back()->with('info', 'You already have access via Premium Membership.');
        }

        $price = PaymentSetting::get('premium_chapter_price', 10);
        if ($price <= 0) {
            return back()->with('error', 'Premium chapter price is not configured.');
        }

        if (!$user->hasEnoughCoins($price)) {
            return back()->with('error', "Not enough coins. You need {$price} coins but have {$user->coins}.");
        }

        // Process purchase atomically — lockForUpdate prevents double-purchase on concurrent requests
        try {
            DB::transaction(function () use ($user, $chapter, $price) {
                $alreadyPurchased = ChapterPurchase::where('user_id', $user->id)
                    ->where('chapter_id', $chapter->id)
                    ->lockForUpdate()
                    ->exists();

                if ($alreadyPurchased) {
                    return; // silently skip inside transaction
                }

                // Guarded: returns false if a concurrent request already spent the
                // balance, rather than letting both purchases through.
                if (! $user->deductCoins($price)) {
                    throw new \RuntimeException('insufficient_coins');
                }

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
        } catch (\RuntimeException $e) {
            if ($e->getMessage() !== 'insufficient_coins') {
                throw $e;
            }

            return back()->with('error', 'Not enough coins — your balance changed while the purchase was going through.');
        }

        return redirect()->route('chapters.show', [$seriesSlug, $chapterLink])
            ->with('success', "Chapter unlocked! {$price} coins spent.");
    }
}
