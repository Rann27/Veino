<?php

namespace App\Http\Controllers;

use App\Models\CoinPackage;
use App\Models\PaymentSetting;
use App\Models\User;
use App\Services\PayPalService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class PaymentController extends Controller
{
    /**
     * Initiate PayPal payment for coin package
     */
    public function initiatePayment(Request $request, CoinPackage $coinPackage)
    {
        $request->validate([
            'return_url' => 'required|url',
            'cancel_url' => 'required|url',
        ]);

        try {
            $paypalService = new PayPalService();
            
            if (!$paypalService->isConfigured()) {
                return response()->json([
                    'error' => 'PayPal payment gateway is not configured. Please contact administrator.'
                ], 400);
            }

            $description = $coinPackage->name . ' - ' . number_format($coinPackage->coin_amount) . ' Coins';
            
            $result = $paypalService->createOrder(
                $coinPackage->price_usd,
                'USD',
                $description,
                $request->input('return_url'),
                $request->input('cancel_url')
            );

            if ($result['success']) {
                // Store payment data in session
                session(['pending_payment' => [
                    'order_id' => $result['order_id'],
                    'package_id' => $coinPackage->id,
                    'amount' => $coinPackage->price_usd,
                    'coins' => $coinPackage->coin_amount,
                    'user_id' => Auth::id(),
                    'created_at' => now(),
                ]]);

                return response()->json([
                    'success' => true,
                    'payment_url' => $result['approval_url'],
                    'order_id' => $result['order_id']
                ]);
            } else {
                return response()->json([
                    'error' => $result['error'] ?? 'Failed to create PayPal order'
                ], 500);
            }

        } catch (\Exception $e) {
            Log::error('PayPal payment initiation failed: ' . $e->getMessage());
            
            return response()->json([
                'error' => 'Failed to initiate payment. Please try again later.'
            ], 500);
        }
    }

    /**
     * Handle successful PayPal payment
     */
    public function handleSuccess(Request $request)
    {
        try {
            $token = $request->get('token'); // PayPal order ID
            $payerId = $request->get('PayerID');

            // Get pending payment data
            $pendingPayment = session('pending_payment');
            
            if (!$pendingPayment) {
                return redirect()->route('buy-coins')->with('error', 'Payment session expired. Please try again.');
            }

            // Verify the order ID matches
            if ($pendingPayment['order_id'] !== $token) {
                return redirect()->route('buy-coins')->with('error', 'Invalid payment session.');
            }

            // Capture the PayPal payment
            $paypalService = new PayPalService();
            $captureResult = $paypalService->captureOrder($token);

            if (!$captureResult['success']) {
                Log::error('PayPal capture failed: ' . $captureResult['error']);
                return redirect()->route('buy-coins')->with('error', 'Payment verification failed. Please contact support.');
            }

            // Payment successful, add coins to user account
            $coinPackage = CoinPackage::find($pendingPayment['package_id']);
            if (!$coinPackage) {
                return redirect()->route('buy-coins')->with('error', 'Invalid coin package.');
            }

            $user = Auth::user();
            $user->increment('coins', $coinPackage->coin_amount);

            // Clear pending payment session
            session()->forget('pending_payment');

            // Log successful payment
            Log::info('PayPal payment successful', [
                'user_id' => $user->id,
                'order_id' => $token,
                'capture_id' => $captureResult['capture_id'],
                'package_id' => $coinPackage->id,
                'coins_added' => $coinPackage->coin_amount,
                'amount_paid' => $pendingPayment['amount']
            ]);

            return redirect()->route('buy-coins')->with('success', 
                "Payment successful! {$coinPackage->coin_amount} coins have been added to your account. Your new balance is {$user->fresh()->coins} coins."
            );

        } catch (\Exception $e) {
            Log::error('PayPal payment handling failed: ' . $e->getMessage());
            
            return redirect()->route('buy-coins')->with('error', 
                'Payment processing failed. Please contact support if you were charged.'
            );
        }
    }

    /**
     * Handle cancelled PayPal payment
     */
    public function handleCancel(Request $request)
    {
        // Clear pending payment session
        session()->forget('pending_payment');
        
        return redirect()->route('buy-coins')->with('info', 'Payment was cancelled.');
    }

    /**
     * PayPal IPN (Instant Payment Notification) handler
     */
    public function handleIPN(Request $request)
    {
        // TODO: Implement PayPal IPN verification and processing
        // This would be used for additional security and payment verification
        
        Log::info('PayPal IPN received', $request->all());
        
        return response('OK', 200);
    }

    /**
     * Get PayPal configuration for frontend
     */
    public function getPayPalConfig()
    {
        $paypalClientId = PaymentSetting::get('paypal_client_id');
        $paypalMode = PaymentSetting::get('paypal_mode', 'sandbox');

        return response()->json([
            'client_id' => $paypalClientId,
            'mode' => $paypalMode,
            'configured' => !empty($paypalClientId)
        ]);
    }
}
