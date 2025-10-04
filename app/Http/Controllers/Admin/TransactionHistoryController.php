<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\CoinPurchase;
use App\Models\ChapterPurchase;
use Inertia\Inertia;

class TransactionHistoryController extends Controller
{
    public function index()
    {
        // Get coin purchase history with user and coin package info
        $coinPurchases = CoinPurchase::with(['user', 'coinPackage'])
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        // Get chapter purchase history with user, chapter, and series info
        $chapterPurchases = ChapterPurchase::with(['user', 'chapter.series'])
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        return Inertia::render('Admin/TransactionHistory', [
            'coinPurchases' => $coinPurchases,
            'chapterPurchases' => $chapterPurchases,
        ]);
    }
}
