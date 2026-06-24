<?php

namespace App\Http\Controllers;

use App\Models\CoinPackage;
use App\Models\CoinPurchase;
use App\Models\MembershipHistory;
use App\Models\MembershipPackage;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ShopController extends Controller
{
    /**
     * Display the unified Shop page with coin packages and membership packages.
     */
    public function index(Request $request)
    {
        $coinPackages = CoinPackage::where('is_active', true)
            ->orderBy('coin_amount')
            ->get();

        $membershipPackages = MembershipPackage::active()->get();

        // Determine which tab to show (default: coins)
        $tab = $request->query('tab', 'coins');

        // Check for a non-expired pending coin purchase
        $pendingPurchase = null;
        if (auth()->check()) {
            $pending = CoinPurchase::where('user_id', auth()->id())
                ->where('status', 'pending')
                ->where('expires_at', '>', now())
                ->latest()
                ->first();

            if ($pending) {
                $pendingPurchase = [
                    'id'             => $pending->id,
                    'coins_amount'   => $pending->coins_amount,
                    'price_usd'      => $pending->price_usd,
                    'payment_method' => $pending->payment_method,
                    'expires_at'     => $pending->expires_at->toISOString(),
                    'status_url'     => route('payment.status', $pending->id),
                ];
            }
        }

        // Check for a non-expired pending membership (real-currency only)
        $pendingMembershipPurchase = null;
        if (auth()->check()) {
            $pendingMem = MembershipHistory::where('user_id', auth()->id())
                ->whereIn('payment_method', ['paypal', 'oxapay'])
                ->where('status', 'pending')
                ->where('payment_expires_at', '>', now())
                ->latest()
                ->first();

            if ($pendingMem) {
                $pendingMembershipPurchase = [
                    'id'              => $pendingMem->id,
                    'tier'            => $pendingMem->tier,
                    'duration_days'   => $pendingMem->duration_days,
                    'amount_usd'      => $pendingMem->amount_usd,
                    'payment_method'  => $pendingMem->payment_method,
                    'payment_expires_at' => $pendingMem->payment_expires_at->toISOString(),
                    'status_url'      => route('membership.status', $pendingMem->id),
                ];
            }
        }

        return Inertia::render('Shop', [
            'coinPackages'              => $coinPackages,
            'membershipPackages'        => $membershipPackages,
            'activeTab'                 => $tab,
            'pendingPurchase'           => $pendingPurchase,
            'pendingMembershipPurchase' => $pendingMembershipPurchase,
        ]);
    }
}
