<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Facades\DB;

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
     * The accessors to append to the model's array form.
     *
     * @var array
     */
    protected $appends = [
        'avatar_url',
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
     * Get user's chart items
     */
    public function chartItems(): HasMany
    {
        return $this->hasMany(ChartItem::class);
    }

    /**
     * Get user's purchased ebook items
     */
    public function purchasedItems(): HasMany
    {
        return $this->hasMany(PurchasedItem::class);
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

    /** Paid tiers, weakest first. Order matters for tier comparisons. */
    public const PAID_TIERS = ['premium', 'exclusive'];

    /**
     * Check if user has an active membership
     *
     * Any paid tier counts. This used to test for 'premium' alone, which would
     * have left Premium Exclusive buyers with no access at all.
     */
    public function hasActiveMembership(): bool
    {
        return in_array($this->membership_tier, self::PAID_TIERS, true)
            && $this->membership_expires_at
            && $this->membership_expires_at->isFuture();
    }

    /**
     * Check if user's membership has expired
     */
    public function isMembershipExpired(): bool
    {
        return in_array($this->membership_tier, self::PAID_TIERS, true)
            && $this->membership_expires_at
            && $this->membership_expires_at->isPast();
    }

    /**
     * Premium Exclusive: everything Premium has, plus every EPUB volume.
     */
    public function hasExclusiveMembership(): bool
    {
        return $this->membership_tier === 'exclusive'
            && $this->membership_expires_at
            && $this->membership_expires_at->isFuture();
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
        $sameTier = $this->hasActiveMembership() && $this->membership_tier === $tier;

        if ($sameTier) {
            // Renewing the tier they already hold simply stacks on the end.
            $this->membership_expires_at = $this->membership_expires_at->addDays($days);
        } else {
            // Switching tiers. Unused days on the old one are worth half on the
            // new one, so nothing paid for is silently thrown away.
            $days += $this->carryOverDays();
            $this->membership_expires_at = now()->addDays($days);
        }

        $this->membership_tier = $tier;

        return $this->save();
    }

    /**
     * Add complimentary membership days without ever lowering the tier held.
     *
     * Bonus days ride along with something else the user bought (coin packages,
     * promotions), so they must never cost them the tier they are on. Granting
     * a flat 'premium' would demote an Exclusive member — and halve their
     * remaining days on the way out — as a reward for spending money.
     */
    public function grantBonusDays(int $days): bool
    {
        return $this->grantMembership(
            $this->hasActiveMembership() ? $this->membership_tier : 'premium',
            $days
        );
    }

    /**
     * Compensation, in days, for switching away from an active membership.
     *
     * Half of the whole days left, rounded down, and nothing at all below two
     * days. Part-days never count: 23 days and 22 hours is 23 whole days, which
     * earns 11.
     */
    public function carryOverDays(): int
    {
        if (! $this->hasActiveMembership()) {
            return 0;
        }

        $wholeDays = (int) floor(now()->diffInDays($this->membership_expires_at, false));

        // Under 48 hours is not eligible; intdiv also floors the odd case.
        return $wholeDays < 2 ? 0 : intdiv($wholeDays, 2);
    }

    /**
     * Get membership display name
     */
    public function getMembershipDisplayNameAttribute(): string
    {
        return match ($this->membership_tier) {
            'exclusive' => 'Premium Exclusive',
            'premium' => 'Premium',
            default => 'Basic',
        };
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
        if ($amount <= 0) {
            return true;
        }

        // Settled in a single conditional UPDATE rather than read-modify-write.
        // Two checkouts firing at once both loaded the same balance and both
        // wrote their own subtraction of it, so the second silently erased the
        // first — two purchases, one payment. The `coins >= ?` guard also makes
        // it impossible to spend into a negative balance.
        $affected = static::whereKey($this->getKey())
            ->where('coins', '>=', $amount)
            ->update(['coins' => DB::raw('coins - '.(int) $amount)]);

        if ($affected === 0) {
            return false;
        }

        // Keep the in-memory model in step with what the database now holds.
        $this->coins = max(0, (int) $this->coins - $amount);
        $this->syncOriginalAttribute('coins');

        return true;
    }

    /**
     * Check if user has enough coins
     */
    public function hasEnoughCoins(int $amount): bool
    {
        return $this->coins >= $amount;
    }
}
