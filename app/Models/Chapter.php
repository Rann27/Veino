<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Chapter extends Model
{
    use HasFactory;

    protected $fillable = [
        'series_id',
        'chapter_number',
        'volume',
        'title',
        'content',
        'is_premium',
        'coin_price',
        'is_published',
    ];

    protected $casts = [
        'is_premium' => 'boolean',
        'is_published' => 'boolean',
        'coin_price' => 'integer',
        'chapter_number' => 'float',
        'volume' => 'float',
    ];

    public function series(): BelongsTo
    {
        return $this->belongsTo(Series::class);
    }

    public function getNextChapter(): ?Chapter
    {
        return static::where('series_id', $this->series_id)
            ->where('is_published', true)
            ->where(function ($query) {
                // If current chapter has volume, find next chapter in same or higher volume
                if ($this->volume) {
                    $query->where(function ($q) {
                        // Same volume, higher chapter number
                        $q->where('volume', $this->volume)
                          ->where('chapter_number', '>', $this->chapter_number);
                    })->orWhere(function ($q) {
                        // Higher volume
                        $q->where('volume', '>', $this->volume);
                    });
                } else {
                    // No volume, just compare chapter numbers (traditional webnovel)
                    $query->whereNull('volume')
                          ->where('chapter_number', '>', $this->chapter_number);
                }
            })
            ->orderBy('volume')
            ->orderBy('chapter_number')
            ->first();
    }

    public function getPreviousChapter(): ?Chapter
    {
        return static::where('series_id', $this->series_id)
            ->where('is_published', true)
            ->where(function ($query) {
                // If current chapter has volume, find previous chapter in same or lower volume
                if ($this->volume) {
                    $query->where(function ($q) {
                        // Same volume, lower chapter number
                        $q->where('volume', $this->volume)
                          ->where('chapter_number', '<', $this->chapter_number);
                    })->orWhere(function ($q) {
                        // Lower volume
                        $q->where('volume', '<', $this->volume);
                    });
                } else {
                    // No volume, just compare chapter numbers (traditional webnovel)
                    $query->whereNull('volume')
                          ->where('chapter_number', '<', $this->chapter_number);
                }
            })
            ->orderBy('volume', 'desc')
            ->orderBy('chapter_number', 'desc')
            ->first();
    }

    /**
     * Get formatted chapter display title
     */
    public function getDisplayNumber(): string
    {
        if ($this->volume) {
            return "Vol {$this->volume} Ch {$this->chapter_number}";
        }
        
        return "Chapter {$this->chapter_number}";
    }

    /**
     * Get all comments for this chapter
     */
    public function comments()
    {
        return $this->morphMany(Comment::class, 'commentable')->whereNull('parent_id')->orderBy('created_at', 'desc');
    }

    /**
     * Get all reactions for this chapter
     */
    public function reactions()
    {
        return $this->morphMany(Reaction::class, 'reactable');
    }
}
