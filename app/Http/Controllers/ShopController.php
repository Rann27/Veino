<?php

namespace App\Http\Controllers;

use App\Models\CoinPackage;
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

        return Inertia::render('Shop', [
            'coinPackages' => $coinPackages,
            'membershipPackages' => $membershipPackages,
            'activeTab' => $tab,
        ]);
    }
}
