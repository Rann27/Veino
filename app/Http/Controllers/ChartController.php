<?php

namespace App\Http\Controllers;

use App\Models\ChartItem;
use App\Models\EbookItem;
use App\Models\PurchasedItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Inertia;

class ChartController extends Controller
{
    /**
     * Display user's chart
     */
    public function index()
    {
        $chartItems = ChartItem::where('user_id', auth()->id())
            ->with(['ebookItem.ebookSeries'])
            ->get();

        $items = $chartItems->map(function ($chartItem) {
            $item = $chartItem->ebookItem;
            return [
                'chart_item_id' => $chartItem->id,
                'id' => $item->id,
                'title' => $item->title,
                'cover_url' => $item->cover_url,
                'price_coins' => $item->price_coins,
                'series_title' => $item->ebookSeries->title,
                'series_slug' => $item->ebookSeries->slug,
            ];
        });

        $totalPrice = $items->sum('price_coins');

        return Inertia::render('MyChart', [
            'chartItems' => $items,
            'totalPrice' => $totalPrice,
        ]);
    }

    /**
     * Add item to chart
     */
    public function add(Request $request)
    {
        $request->validate([
            'ebook_item_id' => 'required|exists:ebook_items,id',
        ]);

        $userId = auth()->id();
        $itemId = $request->ebook_item_id;

        // Check if already purchased
        $alreadyPurchased = PurchasedItem::where('user_id', $userId)
            ->where('ebook_item_id', $itemId)
            ->exists();

        if ($alreadyPurchased) {
            return back()->with('error', 'You already own this item!');
        }

        // Check if already in cart
        $alreadyInCart = ChartItem::where('user_id', $userId)
            ->where('ebook_item_id', $itemId)
            ->exists();

        if ($alreadyInCart) {
            return back()->with('error', 'Item already in your chart!');
        }

        ChartItem::create([
            'user_id' => $userId,
            'ebook_item_id' => $itemId,
        ]);

        return back()->with('success', 'Item added to chart!');
    }

    /**
     * Add all items from series to chart
     */
    public function addAll(Request $request)
    {
        $request->validate([
            'ebook_series_id' => 'required|exists:ebook_series,id',
        ]);

        $userId = auth()->id();
        $items = EbookItem::where('ebook_series_id', $request->ebook_series_id)->get();

        $addedCount = 0;

        foreach ($items as $item) {
            // Skip if already purchased
            if ($item->isPurchasedBy($userId)) {
                continue;
            }

            // Skip if already in cart
            if ($item->isInCartOf($userId)) {
                continue;
            }

            ChartItem::create([
                'user_id' => $userId,
                'ebook_item_id' => $item->id,
            ]);

            $addedCount++;
        }

        if ($addedCount === 0) {
            return back()->with('error', 'No new items to add to chart!');
        }

        return back()->with('success', "{$addedCount} item(s) added to chart!");
    }

    /**
     * Remove item from chart
     */
    public function remove(Request $request)
    {
        $request->validate([
            'chart_item_id' => 'required|exists:chart_items,id',
        ]);

        ChartItem::where('id', $request->chart_item_id)
            ->where('user_id', auth()->id())
            ->delete();

        return back()->with('success', 'Item removed from chart!');
    }

    /**
     * Checkout - purchase all items in chart
     */
    public function checkout(Request $request)
    {
        $request->validate([
            'voucher_code' => 'nullable|string',
        ]);

        $userId = auth()->id();
        $user = auth()->user();

        $chartItems = ChartItem::where('user_id', $userId)
            ->with('ebookItem')
            ->get();

        if ($chartItems->isEmpty()) {
            return back()->with('error', 'Your chart is empty!');
        }

        // Calculate total price
        $totalPrice = $chartItems->sum(function ($chartItem) {
            return $chartItem->ebookItem->price_coins;
        });

        // Handle voucher discount
        $finalPrice = $totalPrice;
        $voucher = null;
        $discountAmount = 0;

        if ($request->filled('voucher_code')) {
            $voucher = \App\Models\Voucher::where('code', strtoupper($request->voucher_code))->first();
            
            if (!$voucher || !$voucher->isValidFor($userId, 'ebook')) {
                return back()->with('error', 'Invalid or expired voucher code!');
            }

            $discountAmount = $voucher->calculateDiscount($totalPrice);
            $finalPrice = max(0, $totalPrice - $discountAmount);
        }

        // Check if user has enough coins
        if ($user->coins < $finalPrice) {
            return back()->with('error', 'Insufficient coins! You need ¢' . $finalPrice . ' but only have ¢' . $user->coins);
        }

        DB::beginTransaction();

        try {
            $transactionId = 'EBOOK-' . strtoupper(Str::random(10));

            // Create purchased items
            foreach ($chartItems as $chartItem) {
                // Skip if already purchased (safety check)
                if ($chartItem->ebookItem->isPurchasedBy($userId)) {
                    continue;
                }

                PurchasedItem::create([
                    'user_id' => $userId,
                    'ebook_item_id' => $chartItem->ebookItem->id,
                    'transaction_id' => $transactionId,
                    'price_paid' => $chartItem->ebookItem->price_coins,
                    'purchased_at' => now(),
                ]);
            }

            // Deduct coins (with discount applied)
            $user->decrement('coins', $finalPrice);

            // Record voucher usage
            if ($voucher) {
                $voucher->recordUsage($userId, 'ebook', $discountAmount);
            }

            // Clear cart
            ChartItem::where('user_id', $userId)->delete();

            DB::commit();

            return redirect()->route('bookshelf')->with('success', 'Purchase successful! Items added to your bookshelf.');

        } catch (\Exception $e) {
            DB::rollback();
            return back()->with('error', 'Purchase failed. Please try again.');
        }
    }
}
