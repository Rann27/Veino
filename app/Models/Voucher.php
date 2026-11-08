<?php

namespace App\Models;

use App\Exceptions\VoucherUnavailableException;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Voucher extends Model
{
    protected $fillable = [
        'code',
        'type',
        'discount_type',
        'discount_value',
        'usage_limit_type',
        'usage_limit',
        'usage_count',
        'expires_at',
        'is_active',
        'auto_kind',
        'period_key',
    ];

    /**
     * A reader may win one automatic voucher per this many days, across all
     * kinds. They are first-come, so without it whoever refreshes the homepage
     * most could take every one of them.
     */
    public const AUTO_CLAIM_COOLDOWN_DAYS = 7;

    protected $casts = [
        'discount_value' => 'decimal:2',
        'expires_at' => 'datetime',
        'is_active' => 'boolean',
    ];

    public function usages(): HasMany
    {
        return $this->hasMany(VoucherUsage::class);
    }

    /**
     * Check if voucher is valid for a user and type
     */
    public function isValidFor(int $userId, string $type): array
    {
        // Check if voucher is active
        if (!$this->is_active) {
            return ['valid' => false, 'message' => 'This voucher is no longer active.'];
        }

        // Check if expired
        if ($this->expires_at && $this->expires_at->isPast()) {
            return ['valid' => false, 'message' => 'This voucher has expired.'];
        }

        // Check if type matches
        if ($this->type !== 'hybrid' && $this->type !== $type) {
            return ['valid' => false, 'message' => 'This voucher is not applicable for this purchase.'];
        }

        // Check usage limit - Global
        if ($this->usage_limit_type === 'global' && $this->usage_count >= $this->usage_limit) {
            return ['valid' => false, 'message' => 'This voucher has reached its usage limit.'];
        }

        // Check usage limit - Per User
        if ($this->usage_limit_type === 'per_user') {
            $userUsageCount = $this->usages()->where('user_id', $userId)->count();
            if ($userUsageCount >= $this->usage_limit) {
                return ['valid' => false, 'message' => 'You have already used this voucher the maximum number of times.'];
            }
        }

        if ($this->auto_kind && $this->wonAutoVoucherRecently($userId)) {
            return ['valid' => false, 'message' => 'You already claimed one of the free-for-all vouchers this week. Leave this one for someone else!'];
        }

        return ['valid' => true, 'message' => 'Voucher is valid!'];
    }

    /**
     * Calculate discount amount (rounded UP to make users happy!)
     */
    public function calculateDiscount(float $originalAmount): float
    {
        if ($this->discount_type === 'percent') {
            // Calculate percentage discount and round UP
            $discount = ($originalAmount * $this->discount_value) / 100;
            return (float) ceil($discount); // Always round up! 🎉
        }

        // Flat discount (already whole number)
        return (float) min($this->discount_value, $originalAmount); // Can't discount more than the total
    }

    /** Every use taken: for a first-come voucher, someone got there first. */
    public function isClaimed(): bool
    {
        return $this->usage_limit_type === 'global' && $this->usage_count >= $this->usage_limit;
    }

    private function wonAutoVoucherRecently(int $userId): bool
    {
        return VoucherUsage::where('user_id', $userId)
            ->where('created_at', '>=', now()->subDays(self::AUTO_CLAIM_COOLDOWN_DAYS))
            ->whereHas('voucher', fn ($q) => $q->whereNotNull('auto_kind'))
            ->exists();
    }

    /**
     * Record usage of voucher.
     *
     * Must run inside the purchase's transaction. The voucher row is locked
     * and every rule checked again before the use is written: the check at
     * the start of checkout happens outside any lock, so two buyers racing
     * for the last use of a first-come voucher could both pass it. The second
     * one now waits on the lock, finds the voucher used up, and the exception
     * rolls their whole purchase back, so they are not charged at all.
     *
     * @throws VoucherUnavailableException
     */
    public function recordUsage(int $userId, string $usedFor, float $discountAmount): void
    {
        $locked = static::whereKey($this->getKey())->lockForUpdate()->first();

        if (! $locked) {
            throw new VoucherUnavailableException('This voucher no longer exists. Nothing was charged.');
        }

        $check = $locked->isValidFor($userId, $usedFor);
        if (! $check['valid']) {
            $message = $locked->isClaimed()
                ? 'Someone claimed this voucher a moment before you. Nothing was charged.'
                : $check['message'].' Nothing was charged.';

            throw new VoucherUnavailableException($message);
        }

        $locked->usages()->create([
            'user_id' => $userId,
            'used_for' => $usedFor,
            'discount_amount' => $discountAmount,
        ]);

        if ($locked->usage_limit_type === 'global') {
            static::whereKey($locked->getKey())->increment('usage_count');
        }

        if ($locked->auto_kind) {
            app(\App\Services\AutoVoucherService::class)->forget();
        }
    }
}
