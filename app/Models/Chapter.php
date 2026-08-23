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
        'chapter_link',
        'volume',
        'title',
        'content',
        'is_premium',
        'coin_price',
        'is_published',
        'views',
    ];

    /**
     * Builds the URL segment for a chapter: `v2c12-5`, or `12-5` without volumes.
     *
     * The decimal separator is a hyphen, not a dot, because a dot in the last
     * path segment makes the URL look like a filename to everything in front of
     * the app — CDNs route it as a static asset, and anything inferring a file
     * type from the path reads ".5" as an extension.
     *
     * Chapters created before this keep their dotted links: lookups match the
     * stored string exactly, so both spellings resolve and nothing needs
     * rewriting.
     */
    public static function buildLink(float|int|string|null $volume, float|int|string $chapterNumber): string
    {
        $number = self::formatLinkSegment($chapterNumber);

        if ($volume === null || $volume === '') {
            return $number;
        }

        return 'v'.self::formatLinkSegment($volume).'c'.$number;
    }

    /**
     * True when an edit leaves the volume and chapter number untouched.
     *
     * Callers use this to keep an existing `chapter_link` as-is, so editing a
     * title never moves a URL readers may have bookmarked — and so chapters
     * published with the old dotted links are not quietly renamed.
     */
    public function hasSameNumbering(float|int|string|null $volume, float|int|string $number): bool
    {
        $sameVolume = ($volume === null || $volume === '')
            ? $this->volume === null
            : ($this->volume !== null && abs((float) $volume - (float) $this->volume) < 0.0001);

        return $sameVolume
            && abs((float) $number - (float) $this->chapter_number) < 0.0001;
    }

    /** Trims trailing zeros, then swaps the decimal point for a hyphen. */
    private static function formatLinkSegment(float|int|string $value): string
    {
        $text = rtrim(rtrim(number_format((float) $value, 2, '.', ''), '0'), '.');

        return str_replace('.', '-', $text);
    }

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
