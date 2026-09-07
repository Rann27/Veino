<?php

namespace App\Services;

use App\Models\PaymentSetting;

/**
 * Works out what a buyer pays once the PayPal fee is passed on to them.
 *
 * The naive approach — price × (1 + rate) + fixed — comes up short, because
 * PayPal charges its percentage on the *final* amount, not on the list price.
 * Grossing up solves for the total that leaves the listed price behind after
 * the cut:
 *
 *     net  = gross − (gross × rate + fixed)
 *     want = net == price
 *     so     gross = (price + fixed) ÷ (1 − rate)
 *
 * At 4.4% + $0.30 a $10.00 item bills $10.77, PayPal keeps $0.77, and exactly
 * $10.00 lands in the account.
 */
class PaymentFeeCalculator
{
    /**
     * Percentage PayPal deducts, e.g. 4.4 for 4.4%.
     *
     * Rates differ by merchant country and change over time, so this is a
     * setting rather than a constant — correcting it must never need a deploy.
     */
    public function rate(): float
    {
        return max(0.0, (float) PaymentSetting::get('paypal_fee_percent', 4.4));
    }

    /** Flat amount PayPal deducts per transaction, in USD. */
    public function fixed(): float
    {
        return max(0.0, (float) PaymentSetting::get('paypal_fee_fixed', 0.30));
    }

    public function enabled(): bool
    {
        return (bool) PaymentSetting::get('paypal_fee_passthrough', true)
            && ($this->rate() > 0 || $this->fixed() > 0);
    }

    /**
     * Breakdown for a listed price, in USD.
     *
     * @return array{subtotal: float, fee: float, total: float, rate: float, fixed: float, enabled: bool}
     */
    public function breakdown(float $price): array
    {
        $subtotal = round($price, 2);

        if (! $this->enabled()) {
            return [
                'subtotal' => $subtotal,
                'fee' => 0.0,
                'total' => $subtotal,
                'rate' => 0.0,
                'fixed' => 0.0,
                'enabled' => false,
            ];
        }

        $rate = $this->rate() / 100;
        $fixed = $this->fixed();

        // A rate at or above 100% has no solution — no total would ever net the
        // price. Fall back to charging face value rather than a wild number.
        if ($rate >= 1) {
            return [
                'subtotal' => $subtotal,
                'fee' => 0.0,
                'total' => $subtotal,
                'rate' => $this->rate(),
                'fixed' => $fixed,
                'enabled' => false,
            ];
        }

        // Rounded up: rounding down would leave the fee a cent short.
        $total = ceil((($subtotal + $fixed) / (1 - $rate)) * 100) / 100;

        return [
            'subtotal' => $subtotal,
            'fee' => round($total - $subtotal, 2),
            'total' => $total,
            'rate' => $this->rate(),
            'fixed' => $fixed,
            'enabled' => true,
        ];
    }

    /** The amount to actually charge through PayPal. */
    public function totalFor(float $price): float
    {
        return $this->breakdown($price)['total'];
    }
}
