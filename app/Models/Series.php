<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class Series extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'alternative_title',
        'slug',
        'cover_url',
        'cover_type',
        'synopsis',
        'author',
        'artist',
        'rating',
        'status',
        'is_mature',
        'native_language_id',
        'views',
        'bookmarks_count',
        'comments_count',
        'show_epub_button',
        'epub_series_slug',
    ];

    protected $casts = [
        'rating' => 'decimal:1',
        'show_epub_button' => 'boolean',
        'is_mature' => 'boolean',
    ];

    protected static function boot()
    {
        parent::boot();
        
        static::creating(function ($series) {
            if (empty($series->slug)) {
                $series->slug = Str::slug($series->title);
            }
        });

        static::deleting(function ($series) {
            // Delete all chapters when series is deleted
            $series->chapters()->delete();
            
            // Delete all bookmarks when series is deleted
            $series->bookmarks()->delete();
        });
    }

    public function nativeLanguage(): BelongsTo
    {
        return $this->belongsTo(NativeLanguage::class);
    }

    public function genres(): BelongsToMany
    {
        return $this->belongsToMany(Genre::class, 'series_genres');
    }

    public function chapters(): HasMany
    {
        return $this->hasMany(Chapter::class)->orderBy('chapter_number');
    }

    public function getNextChapterNumber(): int
    {
        // Use fresh query to avoid caching issues
        $maxChapterNumber = Chapter::where('series_id', $this->id)
            ->max('chapter_number');
        
        return $maxChapterNumber ? $maxChapterNumber + 1 : 1;
    }

    public function getRouteKeyName()
    {
        return 'slug';
    }

    /**
     * Get the cover URL with proper path
     * Accessor for cover_url that automatically handles file vs CDN
     */
    public function getCoverUrlAttribute($value)
    {
        if (!$value) {
            return null;
        }

        // Check if it's already a full URL (CDN link)
        if (filter_var($value, FILTER_VALIDATE_URL)) {
            return $value;
        }
        
        // Check if already has storage/ prefix
        if (str_starts_with($value, 'storage/')) {
            return asset($value);
        }

        // Assume it's a storage path and prepend storage/
        return asset('storage/' . $value);
    }

    /**
     * Get series bookmarks
     */
    public function bookmarks(): HasMany
    {
        return $this->hasMany(Bookmark::class);
    }

    /**
     * Get users who bookmarked this series
     */
    public function bookmarkedByUsers(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'bookmarks')
            ->withTimestamps()
            ->withPivot('note');
    }

    /**
     * Get all comments for this series
     */
    public function comments()
    {
        return $this->morphMany(Comment::class, 'commentable')->whereNull('parent_id')->orderBy('created_at', 'desc');
    }

    /**
     * Get all reactions for this series
     */
    public function reactions()
    {
        return $this->morphMany(Reaction::class, 'reactable');
    }
}
