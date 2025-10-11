<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\MembershipHistory;
use Inertia\Inertia;

class TransactionHistoryController extends Controller
{
    public function index()
    {
        // Get membership purchase history with user and package info
        $membershipPurchases = MembershipHistory::with(['user', 'membershipPackage'])
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        return Inertia::render('Admin/TransactionHistory', [
            'membershipPurchases' => $membershipPurchases,
        ]);
    }
}
