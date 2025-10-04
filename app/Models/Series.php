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
        'synopsis',
        'author',
        'artist',
        'rating',
        'status',
        'native_language_id',
    ];

    protected $casts = [
        'rating' => 'decimal:1',
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
}
