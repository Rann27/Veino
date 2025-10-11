<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Carbon\Carbon;

class Advertisement extends Model
{
    use HasFactory;

    protected $fillable = [
        'advertiser_name',
        'unit_type',
        'file_path_desktop',
        'file_path_mobile',
        'link_url',
        'link_caption',
        'expired_at',
        'clicks',
        'impressions',
        'is_active',
    ];

    protected $casts = [
        'expired_at' => 'datetime',
        'clicks' => 'integer',
        'impressions' => 'integer',
        'is_active' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Scope to get only active advertisements (not expired)
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true)
                    ->where('expired_at', '>', now());
    }

    /**
     * Scope to get expired advertisements
     */
    public function scopeExpired($query)
    {
        return $query->where('expired_at', '<=', now());
    }

    /**
     * Scope to filter by unit type
     */
    public function scopeByType($query, string $type)
    {
        return $query->where('unit_type', $type);
    }

    /**
     * Check if advertisement is expired
     */
    protected function isExpired(): Attribute
    {
        return Attribute::make(
            get: fn () => $this->expired_at->isPast(),
        );
    }

    /**
     * Get status text (active/expired)
     */
    public function getStatusAttribute(): string
    {
        return $this->is_expired ? 'expired' : 'active';
    }

    /**
     * Get desktop file URL
     */
    public function getFileUrlDesktopAttribute(): ?string
    {
        if (!$this->file_path_desktop) {
            return null;
        }
        return asset('storage/' . $this->file_path_desktop);
    }

    /**
     * Get mobile file URL
     */
    public function getFileUrlMobileAttribute(): ?string
    {
        if (!$this->file_path_mobile) {
            return null;
        }
        return asset('storage/' . $this->file_path_mobile);
    }

    /**
     * Legacy getter for backward compatibility
     */
    public function getFileUrlAttribute(): ?string
    {
        return $this->file_url_desktop;
    }

    /**
     * Increment click count
     */
    public function incrementClicks(): void
    {
        $this->increment('clicks');
    }

    /**
     * Increment impression count
     */
    public function incrementImpressions(): void
    {
        $this->increment('impressions');
    }

    /**
     * Get unit type display name
     */
    public function getUnitTypeDisplayAttribute(): string
    {
        return match($this->unit_type) {
            'banner' => 'Banner',
            'interstitial' => 'Interstitial',
            'in_text_link' => 'In-Text Link',
            default => ucfirst($this->unit_type),
        };
    }
}