<?php

namespace App\Http\Controllers;

use App\Models\MembershipPackage;
use App\Models\MembershipPurchase;
use App\Models\MembershipHistory;
use App\Services\MembershipService;
use App\Services\PayPalService;
use App\Services\CryptomusService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

class MembershipController extends Controller
{
    protected $membershipService;
    protected $paypalService;
    protected $cryptomusService;

    public function __construct(
        MembershipService $membershipService,
        PayPalService $paypalService,
        CryptomusService $cryptomusService
    ) {
        $this->membershipService = $membershipService;
        $this->paypalService = $paypalService;
        $this->cryptomusService = $cryptomusService;
    }

    /**
     * Display membership packages page
     */
    public function index()
    {
        $packages = MembershipPackage::active()->get();

        return Inertia::render('Membership', [
            'packages' => $packages
        ]);
    }

    /**
     * Handle membership purchase
     */
    public function purchase(Request $request)
    {
        $request->validate([
            'package_id' => 'required|exists:membership_packages,id',
            'payment_method' => 'required|in:paypal,cryptomus',
            'email' => 'required|email',
        ]);

    $user = Auth::user();
    $package = MembershipPackage::findOrFail($request->package_id);
    $isInertiaRequest = $request->headers->has('X-Inertia');

        // Validate if user can purchase
        $canPurchase = $this->membershipService->canPurchasePackage($user, $package);
        if (!$canPurchase['can_purchase']) {
            $errorReason = $canPurchase['reason'] ?? 'Unable to process membership purchase right now.';

            if ($isInertiaRequest) {
                return back()
                    ->withInput()
                    ->withErrors(['membership' => $errorReason])
                    ->with('error', $errorReason);
            }

            if ($request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'error' => $errorReason,
                    'message' => $errorReason,
                ], 422);
            }

            return back()->withInput()->with('error', $errorReason);
        }

        DB::beginTransaction();
        try {
            // Generate invoice number
            $invoiceNumber = MembershipHistory::generateInvoiceNumber();

            // Create history record
            $history = MembershipHistory::create([
                'user_id' => $user->id,
                'membership_package_id' => $package->id,
                'invoice_number' => $invoiceNumber,
                'tier' => $package->tier,
                'duration_days' => $package->duration_days,
                'amount_usd' => $package->price_usd,
                'payment_method' => $request->payment_method,
                'status' => 'pending',
            ]);

            // Create payment gateway order
            Log::info('Creating payment order', [
                'history_id' => $history->id,
                'method' => $request->payment_method
            ]);

            $paymentResult = $this->createPaymentOrder($history, $package, $request->payment_method);

            Log::info('Payment order result', [
                'success' => $paymentResult['success'],
                'has_payment_url' => isset($paymentResult['payment_url']),
                'payment_url' => $paymentResult['payment_url'] ?? null,
            ]);

            if (!$paymentResult['success']) {
                DB::rollBack();
                $errorMsg = $paymentResult['error'] ?? 'Payment gateway error';

                if ($isInertiaRequest) {
                    return back()
                        ->withInput()
                        ->withErrors(['membership' => $errorMsg])
                        ->with('error', $errorMsg);
                }

                return response()->json([
                    'success' => false,
                    'error' => $errorMsg,
                    'message' => $errorMsg
                ], 400);
            }

            // Update history with gateway info
            if ($request->payment_method === 'paypal') {
                $history->update([
                    'paypal_order_id' => $paymentResult['order_id'],
                    'gateway_response' => $paymentResult['data'] ?? null,
                ]);
            } else if ($request->payment_method === 'cryptomus') {
                $history->update([
                    'cryptomus_order_id' => $paymentResult['order_id'],
                    'gateway_response' => $paymentResult['data'] ?? null,
                ]);
            }

            DB::commit();

            $statusUrl = route('membership.status', ['history' => $history->id]);
            $paymentUrl = $paymentResult['payment_url'] ?? $statusUrl;

            Log::info('Returning response', [
                'status_url' => $statusUrl,
                'payment_url' => $paymentUrl,
                'is_external_gateway' => $paymentUrl !== $statusUrl,
            ]);

            if ($isInertiaRequest) {
                if ($paymentUrl && $paymentUrl !== $statusUrl) {
                    return Inertia::location($paymentUrl);
                }

                return redirect()->to($statusUrl);
            }

            // Return payment URL to frontend for redirect
            return response()->json([
                'success' => true,
                'history_id' => $history->id,
                'payment_url' => $paymentUrl,
                'status_url' => $statusUrl,
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            
            $errorMessage = $e->getMessage();
            if (empty($errorMessage)) {
                $errorMessage = 'An unexpected error occurred during purchase';
            }
            
            Log::error('Membership purchase failed', [
                'user_id' => $user->id,
                'package_id' => $package->id,
                'error' => $errorMessage,
                'trace' => $e->getTraceAsString()
            ]);

            if ($isInertiaRequest) {
                return back()
                    ->withInput()
                    ->withErrors(['membership' => $errorMessage])
                    ->with('error', $errorMessage);
            }

            return response()->json([
                'success' => false,
                'error' => $errorMessage,
                'message' => $errorMessage
            ], 500);
        }
    }

    /**
     * Create payment order with gateway
     */
    private function createPaymentOrder($history, $package, $method)
    {
        try {
            $returnUrl = route('membership.status', ['history' => $history->id]);
            $cancelUrl = route('membership.index');

            Log::info('Creating payment order', [
                'method' => $method,
                'package' => $package->name,
                'amount' => $package->price_usd
            ]);

            if ($method === 'paypal') {
                // Check if PayPal is configured
                $isConfigured = $this->paypalService->isConfigured();
                Log::info('PayPal configuration check', ['is_configured' => $isConfigured]);
                
                if (!$isConfigured) {
                    Log::warning('PayPal not configured, using dummy mode');
                    return [
                        'success' => true,
                        'order_id' => 'DUMMY_PAYPAL_' . uniqid(),
                        'payment_url' => $returnUrl, // Redirect to status page directly
                    ];
                }

                $result = $this->paypalService->createOrder(
                    $package->price_usd,
                    'USD',
                    "Premium Membership - {$package->name}",
                    $returnUrl,
                    $cancelUrl
                );

                Log::info('PayPal createOrder result', [
                    'success' => $result['success'] ?? false,
                    'has_approval_url' => isset($result['approval_url'])
                ]);

                // Map approval_url to payment_url for consistency
                if ($result['success'] && isset($result['approval_url'])) {
                    $result['payment_url'] = $result['approval_url'];
                }

                return $result;
            } else if ($method === 'cryptomus') {
                // Check if Cryptomus is configured
                $isConfigured = $this->cryptomusService->isConfigured();
                Log::info('Cryptomus configuration check', ['is_configured' => $isConfigured]);
                
                if (!$isConfigured) {
                    Log::warning('Cryptomus not configured, using dummy mode');
                    return [
                        'success' => true,
                        'order_id' => 'DUMMY_CRYPTO_' . uniqid(),
                        'payment_url' => $returnUrl, // Redirect to status page directly
                    ];
                }

                return $this->cryptomusService->createInvoice(
                    $package->price_usd,
                    $history->invoice_number,
                    'USDT',
                    $returnUrl
                );
            }

            return ['success' => false, 'error' => 'Invalid payment method'];
            
        } catch (\Exception $e) {
            Log::error('createPaymentOrder exception', [
                'method' => $method,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return [
                'success' => false,
                'error' => 'Payment gateway error: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Show purchase status page
     */
    public function status($historyId)
    {
        $history = MembershipHistory::where('user_id', Auth::id())
            ->with('package')
            ->findOrFail($historyId);

        // Check payment status if still pending
        if ($history->status === 'pending') {
            // Auto-complete for dummy orders in local environment
            if (app()->environment('local')) {
                if (
                    ($history->paypal_order_id && str_starts_with($history->paypal_order_id, 'DUMMY_PAYPAL_')) ||
                    ($history->cryptomus_order_id && str_starts_with($history->cryptomus_order_id, 'DUMMY_CRYPTO_'))
                ) {
                    Log::info('Auto-completing dummy payment in local environment', [
                        'history_id' => $history->id,
                        'order_id' => $history->paypal_order_id ?? $history->cryptomus_order_id
                    ]);
                    $this->completePayment($history, 'DUMMY_' . time());
                    $history->refresh();
                }
            }
            
            // Check real payment status
            $this->checkPaymentStatus($history);
            $history->refresh();
        }

        // Refresh user data to get updated membership info
        $user = Auth::user();
        $user->fresh(); // Ensure we have the latest user data

        return Inertia::render('MembershipStatus', [
            'history' => $history,
            'auth' => [
                'user' => $user
            ]
        ]);
    }

    /**
     * Check payment status from gateway
     */
    private function checkPaymentStatus($history)
    {
        try {
            if ($history->payment_method === 'paypal' && $history->paypal_order_id) {
                $result = $this->paypalService->captureOrder($history->paypal_order_id);
                if ($result['success'] && isset($result['status']) && $result['status'] === 'COMPLETED') {
                    $this->completePayment($history, $result['data']['id'] ?? null);
                }
            } else if ($history->payment_method === 'cryptomus' && $history->cryptomus_order_id) {
                $result = $this->cryptomusService->getPaymentStatus($history->cryptomus_order_id);
                if ($result['success'] && isset($result['status']) && in_array($result['status'], ['paid', 'paid_over'])) {
                    $this->completePayment($history, $result['data']['txid'] ?? null);
                }
            }
        } catch (\Exception $e) {
            Log::error('Failed to check payment status', [
                'history_id' => $history->id,
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * Complete payment and activate membership
     */
    private function completePayment($history, $transactionId = null)
    {
        DB::beginTransaction();
        try {
            $user = $history->user;
            $package = $history->package;

            // Calculate membership period
            $startsAt = $user->membership_expires_at && $user->membership_expires_at->isFuture()
                ? $user->membership_expires_at
                : now();
            $expiresAt = $startsAt->copy()->addDays($package->duration_days);

            // Update history
            $history->update([
                'status' => 'completed',
                'transaction_id' => $transactionId,
                'starts_at' => $startsAt,
                'expires_at' => $expiresAt,
                'completed_at' => now(),
            ]);

            // Grant membership to user
            $user->update([
                'membership_tier' => 'premium',
                'membership_expires_at' => $expiresAt,
            ]);

            DB::commit();

            Log::info('Membership activated', [
                'user_id' => $user->id,
                'history_id' => $history->id,
                'expires_at' => $expiresAt
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to complete payment', [
                'history_id' => $history->id,
                'error' => $e->getMessage()
            ]);
            throw $e;
        }
    }

    /**
     * Payment webhook handler
     */
    public function webhook(Request $request, $provider)
    {
        Log::info("Webhook received from {$provider}", $request->all());

        try {
            if ($provider === 'paypal') {
                return $this->handlePayPalWebhook($request);
            } else if ($provider === 'cryptomus') {
                return $this->handleCryptomusWebhook($request);
            }

            return response()->json(['error' => 'Invalid provider'], 400);

        } catch (\Exception $e) {
            Log::error('Webhook processing failed', [
                'provider' => $provider,
                'error' => $e->getMessage()
            ]);
            return response()->json(['error' => 'Processing failed'], 500);
        }
    }

    /**
     * Handle PayPal webhook
     */
    private function handlePayPalWebhook($request)
    {
        // TODO: Verify PayPal webhook signature
        $eventType = $request->input('event_type');
        
        if ($eventType === 'CHECKOUT.ORDER.APPROVED' || $eventType === 'PAYMENT.CAPTURE.COMPLETED') {
            $orderId = $request->input('resource.id');
            $history = MembershipHistory::where('paypal_order_id', $orderId)->first();
            
            if ($history && $history->status === 'pending') {
                $this->completePayment($history, $orderId);
            }
        }

        return response()->json(['success' => true]);
    }

    /**
     * Handle Cryptomus webhook
     */
    private function handleCryptomusWebhook($request)
    {
        $signature = $request->header('sign');
        $data = $request->all();

        // Verify signature
        if (!$this->cryptomusService->verifyWebhook($data, $signature)) {
            Log::warning('Invalid Cryptomus webhook signature');
            return response()->json(['error' => 'Invalid signature'], 403);
        }

        $status = $data['status'] ?? '';
        $orderId = $data['uuid'] ?? '';

        if (in_array($status, ['paid', 'paid_over'])) {
            $history = MembershipHistory::where('cryptomus_order_id', $orderId)->first();
            
            if ($history && $history->status === 'pending') {
                $this->completePayment($history, $data['txid'] ?? null);
            }
        }

        return response()->json(['success' => true]);
    }

    /**
     * Simulate payment completion (for testing)
     */
    public function simulateSuccess($historyId)
    {
        if (!app()->environment('local')) {
            abort(404);
        }

        $history = MembershipHistory::findOrFail($historyId);
        
        if ($history->status === 'pending') {
            $this->completePayment($history, 'TEST_' . uniqid());
        }

        return redirect()->route('membership.status', ['history' => $history->id]);
    }
}
