<?php

namespace App\Http\Controllers;

use App\Models\CoinPackage;
use App\Models\CoinPurchase;
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
                // Create pending coin purchase record
                $coinPurchase = CoinPurchase::create([
                    'user_id' => Auth::id(),
                    'coin_package_id' => $coinPackage->id,
                    'coins_amount' => $coinPackage->coin_amount,
                    'price_usd' => $coinPackage->price_usd,
                    'payment_method' => 'paypal',
                    'transaction_id' => $result['order_id'],
                    'status' => 'pending'
                ]);

                // Store payment data in session
                session(['pending_payment' => [
                    'order_id' => $result['order_id'],
                    'package_id' => $coinPackage->id,
                    'purchase_id' => $coinPurchase->id, // Add purchase ID for tracking
                    'amount' => $coinPackage->price_usd,
                    'coins' => $coinPackage->coin_amount,
                    'user_id' => Auth::id(),
                    'created_at' => now(),
                ]]);

                Log::info('PayPal payment initiated with purchase record', [
                    'order_id' => $result['order_id'],
                    'purchase_id' => $coinPurchase->id,
                    'user_id' => Auth::id(),
                    'package_id' => $coinPackage->id
                ]);

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
        Log::info('PayPal handleSuccess called', [
            'request_params' => $request->all(),
            'session_data' => session('pending_payment')
        ]);
        
        try {
            $token = $request->get('token'); // PayPal order ID
            $payerId = $request->get('PayerID');

            Log::info('PayPal success parameters', ['token' => $token, 'payer_id' => $payerId]);

            // Get pending payment data
            $pendingPayment = session('pending_payment');
            
            if (!$pendingPayment) {
                Log::error('PayPal success: No pending payment session found');
                return redirect()->route('buy-coins')->with('error', 'Payment session expired. Please try again.');
            }

            // Verify the order ID matches
            if ($pendingPayment['order_id'] !== $token) {
                Log::error('PayPal success: Order ID mismatch', [
                    'expected' => $pendingPayment['order_id'],
                    'received' => $token
                ]);
                return redirect()->route('buy-coins')->with('error', 'Invalid payment session.');
            }

            $paypalService = new PayPalService();
            
            // First, verify order status
            Log::info('PayPal success: Checking order status before capture', ['order_id' => $token]);
            $orderStatus = $paypalService->getOrder($token);
            
            if (!$orderStatus['success']) {
                Log::error('PayPal: Failed to get order status', ['error' => $orderStatus['error']]);
                return redirect()->route('buy-coins')->with('error', 'Failed to verify order status.');
            }
            
            Log::info('PayPal order status', ['status' => $orderStatus['data']['status'] ?? 'unknown']);
            
            // Check if order is already captured
            if (isset($orderStatus['data']['status']) && $orderStatus['data']['status'] === 'COMPLETED') {
                Log::info('PayPal order already completed - adding coins directly');
                
                // Order already captured, just add coins
                $coinPackage = CoinPackage::find($pendingPayment['package_id']);
                if (!$coinPackage) {
                    Log::error('PayPal success: Coin package not found', ['package_id' => $pendingPayment['package_id']]);
                    return redirect()->route('buy-coins')->with('error', 'Invalid coin package.');
                }

                $user = Auth::user();
                $oldBalance = $user->coins;
                $user->increment('coins', $coinPackage->coin_amount);
                $newBalance = $user->fresh()->coins;

                // Update CoinPurchase status to completed
                if (isset($pendingPayment['purchase_id'])) {
                    CoinPurchase::where('id', $pendingPayment['purchase_id'])
                        ->update([
                            'status' => 'completed',
                            'transaction_id' => $token // Update with PayPal order ID
                        ]);
                    
                    Log::info('CoinPurchase updated to completed', ['purchase_id' => $pendingPayment['purchase_id']]);
                }

                // Clear pending payment session
                session()->forget('pending_payment');

                Log::info('PayPal payment successful (already completed)', [
                    'user_id' => $user->id,
                    'order_id' => $token,
                    'package_id' => $coinPackage->id,
                    'coins_added' => $coinPackage->coin_amount,
                    'old_balance' => $oldBalance,
                    'new_balance' => $newBalance,
                    'amount_paid' => $pendingPayment['amount']
                ]);

                return redirect()->route('buy-coins', [
                    'payment' => 'success',
                    'coins' => $coinPackage->coin_amount,
                    'balance' => $newBalance
                ])->with('success', 
                    "Payment successful! {$coinPackage->coin_amount} coins have been added to your account. Your new balance is {$newBalance} coins."
                )->with('payment_data', [
                    'coins_added' => $coinPackage->coin_amount,
                    'new_balance' => $newBalance,
                    'transaction_completed' => true
                ]);
            }

            Log::info('PayPal success: Starting capture process', ['order_id' => $token]);

            // Capture the PayPal payment
            $captureResult = $paypalService->captureOrder($token);

            if (!$captureResult['success']) {
                Log::error('PayPal capture failed: ' . $captureResult['error']);
                return redirect()->route('buy-coins')->with('error', 'Payment verification failed. Please contact support.');
            }

            Log::info('PayPal capture successful, adding coins to user');

            // Payment successful, add coins to user account
            $coinPackage = CoinPackage::find($pendingPayment['package_id']);
            if (!$coinPackage) {
                Log::error('PayPal success: Coin package not found', ['package_id' => $pendingPayment['package_id']]);
                return redirect()->route('buy-coins')->with('error', 'Invalid coin package.');
            }

            $user = Auth::user();
            $oldBalance = $user->coins;
            $user->increment('coins', $coinPackage->coin_amount);
            $newBalance = $user->fresh()->coins;

            // Update CoinPurchase status to completed
            if (isset($pendingPayment['purchase_id'])) {
                CoinPurchase::where('id', $pendingPayment['purchase_id'])
                    ->update([
                        'status' => 'completed',
                        'transaction_id' => $captureResult['capture_id'] ?? $token // Use capture ID if available
                    ]);
                
                Log::info('CoinPurchase updated to completed', [
                    'purchase_id' => $pendingPayment['purchase_id'],
                    'capture_id' => $captureResult['capture_id'] ?? $token
                ]);
            }

            // Clear pending payment session
            session()->forget('pending_payment');

            // Log successful payment
            Log::info('PayPal payment successful', [
                'user_id' => $user->id,
                'order_id' => $token,
                'capture_id' => $captureResult['capture_id'],
                'package_id' => $coinPackage->id,
                'coins_added' => $coinPackage->coin_amount,
                'old_balance' => $oldBalance,
                'new_balance' => $newBalance,
                'amount_paid' => $pendingPayment['amount']
            ]);

            return redirect()->route('buy-coins', [
                'payment' => 'success',
                'coins' => $coinPackage->coin_amount,
                'balance' => $newBalance
            ])->with('success', 
                "Payment successful! {$coinPackage->coin_amount} coins have been added to your account. Your new balance is {$newBalance} coins."
            )->with('payment_data', [
                'coins_added' => $coinPackage->coin_amount,
                'new_balance' => $newBalance,
                'transaction_completed' => true
            ]);

        } catch (\Exception $e) {
            Log::error('PayPal payment handling failed: ' . $e->getMessage());
            
            // Update CoinPurchase status to failed if we have purchase ID
            $pendingPayment = session('pending_payment');
            if ($pendingPayment && isset($pendingPayment['purchase_id'])) {
                CoinPurchase::where('id', $pendingPayment['purchase_id'])
                    ->update(['status' => 'failed']);
                
                Log::info('CoinPurchase updated to failed due to exception', [
                    'purchase_id' => $pendingPayment['purchase_id'],
                    'error' => $e->getMessage()
                ]);
            }
            
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
        Log::info('PayPal payment cancelled', [
            'request_params' => $request->all(),
            'session_data' => session('pending_payment')
        ]);

        // Get pending payment data to update purchase record
        $pendingPayment = session('pending_payment');
        
        if ($pendingPayment && isset($pendingPayment['purchase_id'])) {
            // Update CoinPurchase status to failed
            CoinPurchase::where('id', $pendingPayment['purchase_id'])
                ->update(['status' => 'failed']);
            
            Log::info('CoinPurchase updated to failed due to cancellation', [
                'purchase_id' => $pendingPayment['purchase_id']
            ]);
        }

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
        $paypalClientId = config('services.paypal.client_id');
        $paypalMode = config('services.paypal.mode', 'sandbox');

        return response()->json([
            'client_id' => $paypalClientId,
            'mode' => $paypalMode,
            'configured' => !empty($paypalClientId)
        ]);
    }
}
