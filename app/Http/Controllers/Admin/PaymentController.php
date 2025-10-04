<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\CoinPackage;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PaymentController extends Controller
{
    public function index()
    {
        $coinPackages = CoinPackage::all();
        
        // Get PayPal settings from .env (more secure)
        $paymentSettings = [
            'paypal_client_id' => config('services.paypal.client_id'),
            'paypal_secret' => config('services.paypal.client_secret'),
            'paypal_mode' => config('services.paypal.mode', 'sandbox'),
        ];

        return Inertia::render('Admin/Payment/Index', [
            'coinPackages' => $coinPackages,
            'paymentSettings' => $paymentSettings,
        ]);
    }

    public function updateCoinPackage(Request $request, CoinPackage $coinPackage)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'coin_amount' => 'required|integer|min:1',
            'price_usd' => 'required|numeric|min:0.01',
            'is_active' => 'boolean',
        ]);

        $coinPackage->update($validated);

        return redirect()->back()->with('success', 'Coin package updated successfully');
    }

    // PayPal settings are now configured via .env for security
    // No longer need updatePaymentSettings method
}
