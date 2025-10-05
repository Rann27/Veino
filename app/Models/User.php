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
}
