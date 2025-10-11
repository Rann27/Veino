<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\MembershipPackage;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PaymentController extends Controller
{
    public function index()
    {
        $membershipPackages = MembershipPackage::orderBy('sort_order')->get();
        
        // Get PayPal and Cryptomus settings from .env (more secure)
        $paymentSettings = [
            'paypal_client_id' => config('services.paypal.client_id'),
            'paypal_secret' => config('services.paypal.client_secret'),
            'paypal_mode' => config('services.paypal.mode', 'sandbox'),
            'cryptomus_api_key' => config('services.cryptomus.api_key'),
            'cryptomus_merchant_id' => config('services.cryptomus.merchant_id'),
        ];

        return Inertia::render('Admin/Payment/Index', [
            'membershipPackages' => $membershipPackages,
            'paymentSettings' => $paymentSettings,
        ]);
    }

    public function updateMembershipPackage(Request $request, MembershipPackage $membershipPackage)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'gimmick_price' => 'nullable|numeric|min:0',
            'price_usd' => 'required|numeric|min:0.01',
            'is_active' => 'boolean',
        ]);

        // Auto-calculate discount percentage if gimmick_price is provided
        if (!empty($validated['gimmick_price']) && $validated['gimmick_price'] > $validated['price_usd']) {
            $validated['discount_percentage'] = round((($validated['gimmick_price'] - $validated['price_usd']) / $validated['gimmick_price']) * 100);
        } else {
            $validated['discount_percentage'] = 0;
        }

        $membershipPackage->update($validated);

        return redirect()->back()->with('success', 'Membership package updated successfully');
    }

    // PayPal and Cryptomus settings are now configured via .env for security
    // No longer need updatePaymentSettings method
}
