<?php

namespace App\Services;

use App\Models\PaymentSetting;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Http;

class PayPalService
{
    private $clientId;
    private $clientSecret;
    private $mode;
    private $baseUrl;

    public function __construct()
    {
        $this->clientId = PaymentSetting::get('paypal_client_id');
        $this->clientSecret = PaymentSetting::get('paypal_secret');
        $this->mode = PaymentSetting::get('paypal_mode', 'sandbox');
        
        $this->baseUrl = $this->mode === 'live' 
            ? 'https://api.paypal.com'
            : 'https://api.sandbox.paypal.com';
    }

    private function getAccessToken()
    {
        try {
            $response = Http::withBasicAuth($this->clientId, $this->clientSecret)
                ->asForm()
                ->post($this->baseUrl . '/v1/oauth2/token', [
                    'grant_type' => 'client_credentials'
                ]);

            if ($response->successful()) {
                return $response->json()['access_token'];
            }

            Log::error('PayPal access token failed: ' . $response->body());
            return null;
        } catch (\Exception $e) {
            Log::error('PayPal access token exception: ' . $e->getMessage());
            return null;
        }
    }

    public function createOrder($amount, $currency = 'USD', $description = 'VeiNovel Coin Purchase', $returnUrl = null, $cancelUrl = null)
    {
        try {
            $accessToken = $this->getAccessToken();
            if (!$accessToken) {
                return [
                    'success' => false,
                    'error' => 'Failed to get PayPal access token'
                ];
            }

            $orderData = [
                'intent' => 'CAPTURE',
                'purchase_units' => [
                    [
                        'amount' => [
                            'currency_code' => $currency,
                            'value' => number_format($amount, 2, '.', '')
                        ],
                        'description' => $description
                    ]
                ],
                'application_context' => [
                    'brand_name' => 'VeiNovel',
                    'locale' => 'en-US',
                    'landing_page' => 'BILLING',
                    'shipping_preference' => 'NO_SHIPPING',
                    'user_action' => 'PAY_NOW',
                    'return_url' => $returnUrl ?: url('/payment/success'),
                    'cancel_url' => $cancelUrl ?: url('/payment/cancel')
                ]
            ];

            $response = Http::withToken($accessToken)
                ->post($this->baseUrl . '/v2/checkout/orders', $orderData);

            if ($response->successful()) {
                $result = $response->json();
                return [
                    'success' => true,
                    'order_id' => $result['id'],
                    'approval_url' => $this->getApprovalUrl($result['links']),
                    'data' => $result
                ];
            }

            Log::error('PayPal create order failed: ' . $response->body());
            return [
                'success' => false,
                'error' => 'Failed to create PayPal order'
            ];

        } catch (\Exception $e) {
            Log::error('PayPal create order exception: ' . $e->getMessage());
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }

    public function captureOrder($orderId)
    {
        try {
            $accessToken = $this->getAccessToken();
            if (!$accessToken) {
                return [
                    'success' => false,
                    'error' => 'Failed to get PayPal access token'
                ];
            }

            $response = Http::withToken($accessToken)
                ->post($this->baseUrl . "/v2/checkout/orders/{$orderId}/capture");

            if ($response->successful()) {
                $result = $response->json();
                return [
                    'success' => true,
                    'capture_id' => $result['purchase_units'][0]['payments']['captures'][0]['id'] ?? null,
                    'data' => $result
                ];
            }

            Log::error('PayPal capture order failed: ' . $response->body());
            return [
                'success' => false,
                'error' => 'Failed to capture PayPal order'
            ];

        } catch (\Exception $e) {
            Log::error('PayPal capture order exception: ' . $e->getMessage());
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }

    public function getOrder($orderId)
    {
        try {
            $accessToken = $this->getAccessToken();
            if (!$accessToken) {
                return [
                    'success' => false,
                    'error' => 'Failed to get PayPal access token'
                ];
            }

            $response = Http::withToken($accessToken)
                ->get($this->baseUrl . "/v2/checkout/orders/{$orderId}");

            if ($response->successful()) {
                return [
                    'success' => true,
                    'data' => $response->json()
                ];
            }

            Log::error('PayPal get order failed: ' . $response->body());
            return [
                'success' => false,
                'error' => 'Failed to get PayPal order'
            ];

        } catch (\Exception $e) {
            Log::error('PayPal get order exception: ' . $e->getMessage());
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }

    private function getApprovalUrl($links)
    {
        foreach ($links as $link) {
            if ($link['rel'] === 'approve') {
                return $link['href'];
            }
        }
        return null;
    }

    public function isConfigured()
    {
        return !empty($this->clientId) && !empty($this->clientSecret);
    }
}
