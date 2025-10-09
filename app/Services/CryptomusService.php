<?php

namespace App\Services;

use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Http;

class CryptomusService
{
    private $merchantId;
    private $apiKey;
    private $baseUrl;

    public function __construct()
    {
        $this->merchantId = config('services.cryptomus.merchant_id');
        $this->apiKey = config('services.cryptomus.api_key');
        $this->baseUrl = 'https://api.cryptomus.com/v1';
    }

    public function isConfigured(): bool
    {
        return !empty($this->merchantId) && !empty($this->apiKey);
    }

    /**
     * Generate signature for Cryptomus API
     */
    private function generateSignature($data): string
    {
        $json = json_encode($data);
        return md5(base64_encode($json) . $this->apiKey);
    }

    /**
     * Create payment invoice
     */
    public function createInvoice($amount, $orderId, $currency = 'USDT', $callbackUrl = null)
    {
        try {
            $data = [
                'amount' => number_format($amount, 2, '.', ''),
                'currency' => $currency,
                'order_id' => $orderId,
                'url_return' => $callbackUrl ?? route('membership.index'),
                'url_callback' => route('membership.webhook', ['provider' => 'cryptomus']),
                'is_payment_multiple' => false,
                'lifetime' => 3600, // 1 hour
            ];

            $signature = $this->generateSignature($data);

            $response = Http::timeout(30)
                ->withHeaders([
                    'merchant' => $this->merchantId,
                    'sign' => $signature,
                    'Content-Type' => 'application/json',
                ])
                ->post($this->baseUrl . '/payment', $data);

            if ($response->successful()) {
                $result = $response->json();
                
                if (isset($result['state']) && $result['state'] === 0) {
                    return [
                        'success' => true,
                        'payment_url' => $result['result']['url'] ?? null,
                        'order_id' => $result['result']['uuid'] ?? null,
                        'data' => $result['result']
                    ];
                }

                Log::error('Cryptomus create invoice failed', [
                    'response' => $result
                ]);

                return [
                    'success' => false,
                    'error' => $result['message'] ?? 'Unknown error'
                ];
            }

            Log::error('Cryptomus HTTP error', [
                'status' => $response->status(),
                'body' => $response->body()
            ]);

            return [
                'success' => false,
                'error' => 'HTTP ' . $response->status()
            ];

        } catch (\Exception $e) {
            Log::error('Cryptomus exception: ' . $e->getMessage());
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }

    /**
     * Verify webhook signature
     */
    public function verifyWebhook($data, $signature): bool
    {
        unset($data['sign']);
        $calculatedSignature = $this->generateSignature($data);
        return hash_equals($calculatedSignature, $signature);
    }

    /**
     * Get payment status
     */
    public function getPaymentStatus($orderId)
    {
        try {
            $data = ['uuid' => $orderId];
            $signature = $this->generateSignature($data);

            $response = Http::timeout(30)
                ->withHeaders([
                    'merchant' => $this->merchantId,
                    'sign' => $signature,
                    'Content-Type' => 'application/json',
                ])
                ->post($this->baseUrl . '/payment/info', $data);

            if ($response->successful()) {
                $result = $response->json();
                
                if (isset($result['state']) && $result['state'] === 0) {
                    return [
                        'success' => true,
                        'status' => $result['result']['payment_status'] ?? 'unknown',
                        'data' => $result['result']
                    ];
                }
            }

            return [
                'success' => false,
                'error' => 'Failed to get payment status'
            ];

        } catch (\Exception $e) {
            Log::error('Cryptomus get status exception: ' . $e->getMessage());
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }
}
