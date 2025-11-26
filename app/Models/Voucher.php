<?php

namespace App\Models;

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
    ];

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

    /**
     * Record usage of voucher
     */
    public function recordUsage(int $userId, string $usedFor, float $discountAmount): void
    {
        // Create usage record
        $this->usages()->create([
            'user_id' => $userId,
            'used_for' => $usedFor,
            'discount_amount' => $discountAmount,
        ]);

        // Increment global usage count
        if ($this->usage_limit_type === 'global') {
            $this->increment('usage_count');
        }
    }
}
