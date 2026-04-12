<?php

namespace App\Services;

use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Http;

class OxapayService
{
    private string $merchantKey;
    private string $baseUrl = 'https://api.oxapay.com';

    public function __construct()
    {
        $this->merchantKey = config('services.oxapay.merchant_key', '');
    }

    public function isConfigured(): bool
    {
        return !empty($this->merchantKey);
    }

    /**
     * Create a payment invoice
     *
     * @param  float       $amount      Amount in USD
     * @param  string|int  $orderId     Your internal order ID
     * @param  string      $returnUrl   Redirect URL after payment
     * @param  string|null $callbackUrl Webhook URL for status updates
     * @param  string|null $description Optional description
     * @return array{success: bool, payment_url?: string, order_id?: string, track_id?: string, error?: string}
     */
    public function createInvoice(
        float $amount,
        string|int $orderId,
        string $returnUrl,
        ?string $callbackUrl = null,
        ?string $description = null
    ): array {
        try {
            $payload = [
                'merchant'    => $this->merchantKey,
                'amount'      => number_format($amount, 2, '.', ''),
                'currency'    => 'USD',
                'orderId'     => (string) $orderId,
                'returnUrl'   => $returnUrl,
                'lifetime'    => 30, // minutes
            ];

            if ($callbackUrl) {
                $payload['callbackUrl'] = $callbackUrl;
            }

            if ($description) {
                $payload['description'] = $description;
            }

            $response = Http::timeout(30)
                ->post($this->baseUrl . '/merchants/request', $payload);

            if ($response->successful()) {
                $result = $response->json();

                // OxaPay returns result=100 for success
                if (isset($result['result']) && $result['result'] === 100) {
                    return [
                        'success'     => true,
                        'payment_url' => $result['payLink'] ?? null,
                        'order_id'    => $result['trackId'] ?? null,
                        'track_id'    => $result['trackId'] ?? null,
                    ];
                }

                Log::error('OxaPay create invoice failed', ['response' => $result]);

                return [
                    'success' => false,
                    'error'   => $result['message'] ?? 'Unknown error from OxaPay',
                ];
            }

            Log::error('OxaPay HTTP error', [
                'status' => $response->status(),
                'body'   => $response->body(),
            ]);

            return [
                'success' => false,
                'error'   => 'OxaPay HTTP ' . $response->status(),
            ];

        } catch (\Exception $e) {
            Log::error('OxaPay exception: ' . $e->getMessage());
            return [
                'success' => false,
                'error'   => $e->getMessage(),
            ];
        }
    }

    /**
     * Verify incoming webhook signature (HMAC-SHA512)
     *
     * OxaPay sends an 'hmac' field inside the POST body.
     * To verify: compute HMAC-SHA512 of the JSON-encoded payload
     * (excluding the 'hmac' key) with the merchant key, then compare.
     */
    public function verifyWebhook(array $data, string $receivedHmac): bool
    {
        unset($data['hmac']);
        ksort($data);
        $calculated = hash_hmac('sha512', json_encode($data), $this->merchantKey);
        return hash_equals($calculated, $receivedHmac);
    }

    /**
     * Query payment status by trackId
     *
     * @return array{success: bool, status?: string, data?: array, error?: string}
     */
    public function getPaymentStatus(string $trackId): array
    {
        try {
            $response = Http::timeout(30)
                ->post($this->baseUrl . '/merchants/inquiry', [
                    'merchant' => $this->merchantKey,
                    'trackId'  => $trackId,
                ]);

            if ($response->successful()) {
                $result = $response->json();

                if (isset($result['result']) && $result['result'] === 100) {
                    return [
                        'success' => true,
                        // Possible statuses: Waiting, Confirming, Paid, Expired, Error
                        'status'  => $result['status'] ?? 'unknown',
                        'data'    => $result,
                    ];
                }
            }

            return [
                'success' => false,
                'error'   => 'Failed to retrieve OxaPay payment status',
            ];

        } catch (\Exception $e) {
            Log::error('OxaPay getPaymentStatus exception: ' . $e->getMessage());
            return [
                'success' => false,
                'error'   => $e->getMessage(),
            ];
        }
    }
}
