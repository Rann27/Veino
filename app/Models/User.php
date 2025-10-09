<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name', // Keep for Laravel compatibility
        'display_name', // This is what we actually use
        'uid', // Unique user identifier  
        'email',
        'password',
        'role',
        'coins', // User's coin balance
        'membership_tier', // User's membership level
        'membership_expires_at', // When membership expires
        'is_banned',
        'avatar', // User's avatar image path
        'bio', // User's biography
        // Removed email_verified_at since we don't use email verification
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_banned' => 'boolean',
            'coins' => 'integer',
            'membership_expires_at' => 'datetime',
        ];
    }

    /**
     * Get the user's theme preference.
     */
    public function themePreference()
    {
        return $this->hasOne(UserThemePreference::class);
    }

    /**
     * Get or create user's theme preference with defaults
     */
    public function getThemePreference()
    {
        if (!$this->themePreference) {
            return $this->themePreference()->create([
                'theme_name' => 'Light',
                'auto_theme' => false,
                'reader_settings' => UserThemePreference::getDefaultReaderSettings(),
            ]);
        }
        
        return $this->themePreference;
    }

    /**
     * Get the user's avatar URL.
     */
    public function getAvatarUrlAttribute()
    {
        if ($this->avatar) {
            return asset('storage/' . $this->avatar);
        }
        
        // Default avatar URL - you can use a placeholder service or default image
        return asset('images/default-avatar.svg');
    }

    /**
     * Get user's bookmarks
     */
    public function bookmarks(): HasMany
    {
        return $this->hasMany(Bookmark::class);
    }

    /**
     * Get user's bookmarked series
     */
    public function bookmarkedSeries(): BelongsToMany
    {
        return $this->belongsToMany(Series::class, 'bookmarks')
            ->withTimestamps()
            ->withPivot('note');
    }

    /**
     * Check if user has bookmarked a series
     */
    public function hasBookmarked(Series $series): bool
    {
        return $this->bookmarks()->where('series_id', $series->id)->exists();
    }

    /**
     * Get user's comments
     */
    public function comments(): HasMany
    {
        return $this->hasMany(Comment::class);
    }

    /**
     * Get user's reactions
     */
    public function reactions(): HasMany
    {
        return $this->hasMany(Reaction::class);
    }

    /**
     * Get user's coin purchases
     */
    public function coinPurchases(): HasMany
    {
        return $this->hasMany(CoinPurchase::class);
    }

    /**
     * Get user's membership purchases
     */
    public function membershipPurchases(): HasMany
    {
        return $this->hasMany(MembershipPurchase::class);
    }

    /**
     * Get user's active membership purchase
     */
    public function activeMembershipPurchase()
    {
        return $this->membershipPurchases()
            ->where('status', 'completed')
            ->where('expires_at', '>', now())
            ->orderBy('expires_at', 'desc')
            ->first();
    }

    // ==================== MEMBERSHIP METHODS ====================

    /**
     * Check if user has an active membership
     */
    public function hasActiveMembership(): bool
    {
        return $this->membership_tier === 'premium' 
            && $this->membership_expires_at 
            && $this->membership_expires_at->isFuture();
    }

    /**
     * Check if user's membership has expired
     */
    public function isMembershipExpired(): bool
    {
        return $this->membership_tier === 'premium' 
            && $this->membership_expires_at 
            && $this->membership_expires_at->isPast();
    }

    /**
     * Get days remaining on membership
     */
    public function getMembershipDaysRemainingAttribute(): int
    {
        if (!$this->hasActiveMembership()) {
            return 0;
        }
        
        return max(0, $this->membership_expires_at->diffInDays(now()));
    }

    /**
     * Check if user has specific membership tier
     */
    public function hasMembershipTier(string $tier): bool
    {
        return $this->hasActiveMembership() && $this->membership_tier === $tier;
    }

    /**
     * Check if user is premium member
     */
    public function isPremiumMember(): bool
    {
        return $this->hasActiveMembership();
    }

    /**
     * Expire the user's membership (set to basic)
     */
    public function expireMembership(): bool
    {
        $this->membership_tier = 'basic';
        $this->membership_expires_at = null;
        return $this->save();
    }

    /**
     * Grant membership to user
     */
    public function grantMembership(string $tier, int $days): bool
    {
        $this->membership_tier = $tier;
        
        // If user already has active membership of same tier, extend it
        if ($this->hasActiveMembership() && $this->membership_tier === $tier) {
            $this->membership_expires_at = $this->membership_expires_at->addDays($days);
        } else {
            $this->membership_expires_at = now()->addDays($days);
        }
        
        return $this->save();
    }

    /**
     * Get membership display name
     */
    public function getMembershipDisplayNameAttribute(): string
    {
        return ucfirst($this->membership_tier);
    }

    /**
     * Check if user can access premium content
     */
    public function canAccessPremiumContent(): bool
    {
        return $this->isPremiumMember();
    }

    // ==================== COIN METHODS ====================

    /**
     * Add coins to user's balance
     */
    public function addCoins(int $amount): bool
    {
        $this->coins += $amount;
        return $this->save();
    }

    /**
     * Deduct coins from user's balance
     */
    public function deductCoins(int $amount): bool
    {
        if ($this->coins < $amount) {
            return false;
        }
        
        $this->coins -= $amount;
        return $this->save();
    }

    /**
     * Check if user has enough coins
     */
    public function hasEnoughCoins(int $amount): bool
    {
        return $this->coins >= $amount;
    }
}
