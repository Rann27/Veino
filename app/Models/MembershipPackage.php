<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class MembershipPackage extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'tier',
        'price_usd',
        'duration_days',
        'features',
        'discount_percentage',
        'is_active',
        'sort_order',
    ];

    protected $casts = [
        'price_usd' => 'decimal:2',
        'duration_days' => 'integer',
        'features' => 'array',
        'discount_percentage' => 'integer',
        'is_active' => 'boolean',
        'sort_order' => 'integer',
    ];

    /**
     * Scope to get only active packages
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true)
                    ->orderBy('sort_order');
    }

    /**
     * Scope to filter by tier
     */
    public function scopeByTier($query, string $tier)
    {
        return $query->where('tier', $tier);
    }

    /**
     * Get all purchases for this package
     */
    public function purchases(): HasMany
    {
        return $this->hasMany(MembershipPurchase::class);
    }

    /**
     * Get the final price after discount
     */
    public function getFinalPriceAttribute(): float
    {
        if ($this->discount_percentage > 0) {
            return $this->price_usd * (1 - ($this->discount_percentage / 100));
        }
        return (float) $this->price_usd;
    }

    /**
     * Check if package has a specific feature
     */
    public function hasFeature(string $feature): bool
    {
        return isset($this->features[$feature]) && $this->features[$feature] === true;
    }

    /**
     * Get tier display name
     */
    public function getTierDisplayNameAttribute(): string
    {
        return ucfirst($this->tier);
    }

    /**
     * Get duration display (e.g., "1 Month", "1 Year")
     */
    public function getDurationDisplayAttribute(): string
    {
        if ($this->duration_days >= 365) {
            $years = round($this->duration_days / 365);
            return $years . ' ' . ($years > 1 ? 'Years' : 'Year');
        } elseif ($this->duration_days >= 30) {
            $months = round($this->duration_days / 30);
            return $months . ' ' . ($months > 1 ? 'Months' : 'Month');
        } else {
            return $this->duration_days . ' Days';
        }
    }
}
