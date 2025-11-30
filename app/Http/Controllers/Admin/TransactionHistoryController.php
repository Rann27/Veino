<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\CoinPurchase;
use App\Models\MembershipHistory;
use App\Models\PurchasedItem;
use Inertia\Inertia;

class TransactionHistoryController extends Controller
{
    public function index()
    {
        // Get coin purchase history (top-up via PayPal/Cryptomus)
        $coinPurchases = CoinPurchase::with(['user', 'coinPackage'])
            ->orderBy('created_at', 'desc')
            ->paginate(20, ['*'], 'coin_page');

        // Get membership purchase history (bought with coins)
        $membershipPurchases = MembershipHistory::with(['user', 'membershipPackage'])
            ->orderBy('created_at', 'desc')
            ->paginate(20, ['*'], 'membership_page');

        // Get ebook purchase history (bought with coins)
        $ebookPurchases = PurchasedItem::with(['user', 'ebookItem.ebookSeries'])
            ->orderBy('created_at', 'desc')
            ->paginate(20, ['*'], 'ebook_page');

        return Inertia::render('Admin/TransactionHistory', [
            'coinPurchases' => $coinPurchases,
            'membershipPurchases' => $membershipPurchases,
            'ebookPurchases' => $ebookPurchases,
        ]);
    }
}
