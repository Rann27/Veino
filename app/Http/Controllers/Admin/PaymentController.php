<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\CoinPackage;
use App\Models\PaymentSetting;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PaymentController extends Controller
{
    public function index()
    {
        $coinPackages = CoinPackage::all();
        
        $paymentSettings = [
            'paypal_client_id' => PaymentSetting::get('paypal_client_id'),
            'paypal_secret' => PaymentSetting::get('paypal_secret'),
            'paypal_mode' => PaymentSetting::get('paypal_mode', 'sandbox'),
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

    public function updatePaymentSettings(Request $request)
    {
        $validated = $request->validate([
            'paypal_client_id' => 'nullable|string',
            'paypal_secret' => 'nullable|string',
            'paypal_mode' => 'required|in:sandbox,live',
        ]);

        PaymentSetting::set('paypal_client_id', $validated['paypal_client_id']);
        PaymentSetting::set('paypal_secret', $validated['paypal_secret']);
        PaymentSetting::set('paypal_mode', $validated['paypal_mode']);

        return redirect()->back()->with('success', 'Payment settings updated successfully');
    }
}
