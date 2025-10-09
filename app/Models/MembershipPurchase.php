<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Carbon\Carbon;

class MembershipPurchase extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'membership_package_id',
        'tier',
        'duration_days',
        'price_usd',
        'payment_method',
        'transaction_id',
        'status',
        'starts_at',
        'expires_at',
        'notes',
    ];

    protected $casts = [
        'price_usd' => 'decimal:2',
        'duration_days' => 'integer',
        'starts_at' => 'datetime',
        'expires_at' => 'datetime',
    ];

    /**
     * Get the user who made this purchase
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the package that was purchased
     */
    public function membershipPackage(): BelongsTo
    {
        return $this->belongsTo(MembershipPackage::class);
    }

    /**
     * Scope for completed purchases
     */
    public function scopeCompleted($query)
    {
        return $query->where('status', 'completed');
    }

    /**
     * Scope for active memberships (completed and not expired)
     */
    public function scopeActive($query)
    {
        return $query->where('status', 'completed')
                    ->where('expires_at', '>', now());
    }

    /**
     * Scope for expired memberships
     */
    public function scopeExpired($query)
    {
        return $query->where('status', 'completed')
                    ->where('expires_at', '<=', now());
    }

    /**
     * Scope for pending purchases
     */
    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    /**
     * Check if this membership is currently active
     */
    public function isActive(): bool
    {
        return $this->status === 'completed' 
            && $this->expires_at 
            && $this->expires_at->isFuture();
    }

    /**
     * Check if this membership has expired
     */
    public function isExpired(): bool
    {
        return $this->status === 'completed' 
            && $this->expires_at 
            && $this->expires_at->isPast();
    }

    /**
     * Get days remaining
     */
    public function getDaysRemainingAttribute(): int
    {
        if (!$this->isActive()) {
            return 0;
        }
        
        return max(0, $this->expires_at->diffInDays(now()));
    }

    /**
     * Mark purchase as completed and activate membership
     */
    public function complete(): bool
    {
        $this->status = 'completed';
        $this->starts_at = now();
        $this->expires_at = now()->addDays($this->duration_days);
        
        return $this->save() && $this->activateUserMembership();
    }

    /**
     * Activate or extend user's membership
     */
    protected function activateUserMembership(): bool
    {
        $user = $this->user;
        
        // If user has active membership of same or higher tier, extend it
        if ($user->hasActiveMembership() && $user->membership_tier === $this->tier) {
            // Extend existing membership
            $user->membership_expires_at = Carbon::parse($user->membership_expires_at)
                ->addDays($this->duration_days);
        } else {
            // New membership or upgrade
            $user->membership_tier = $this->tier;
            $user->membership_expires_at = $this->expires_at;
        }
        
        return $user->save();
    }

    /**
     * Cancel/refund the purchase
     */
    public function refund(string $reason = null): bool
    {
        if ($this->status !== 'completed') {
            return false;
        }

        $this->status = 'refunded';
        if ($reason) {
            $this->notes = $reason;
        }
        
        // Optionally revert user membership here
        // For now, we'll keep it and handle manually if needed
        
        return $this->save();
    }
}
