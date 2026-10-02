<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;
use App\Models\Concerns\HasCoverThumbnail;

class EbookSeries extends Model
{
    use HasCoverThumbnail;

    use HasFactory;

    protected $fillable = [
        'title',
        'alternative_title',
        'slug',
        'cover',
        'synopsis',
        'author',
        'artist',
        'status_id',
        'native_language_id',
        'show_trial_button',
        'series_slug',
        'free_for_premium_members',
        'is_mature',
    ];

    protected $appends = ['cover_url', 'price_range', 'thumb_url'];

    protected $casts = [
        'show_trial_button' => 'boolean',
        'free_for_premium_members' => 'boolean',
        'is_mature' => 'boolean',
    ];

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($ebookSeries) {
            if (empty($ebookSeries->slug)) {
                $ebookSeries->slug = Str::slug($ebookSeries->title);
            }
        });

        static::updating(function ($ebookSeries) {
            if ($ebookSeries->isDirty('title') && empty($ebookSeries->slug)) {
                $ebookSeries->slug = Str::slug($ebookSeries->title);
            }
        });
    }

    // Relationships
    public function status()
    {
        return $this->belongsTo(Status::class);
    }

    public function nativeLanguage()
    {
        return $this->belongsTo(NativeLanguage::class);
    }

    public function genres()
    {
        return $this->belongsToMany(Genre::class, 'ebook_series_genre');
    }

    public function items()
    {
        return $this->hasMany(EbookItem::class)->orderBy('order');
    }

    // Helper methods
    public function getPriceRangeAttribute()
    {
        $prices = $this->items->pluck('price_coins')->filter();
        
        if ($prices->isEmpty()) {
            return '0';
        }
        
        $min = $prices->min();
        $max = $prices->max();
        
        if ($min === $max) {
            return "¢{$min}";
        }
        
        return "¢{$min} ~ ¢{$max}";
    }

    public function getCoverUrlAttribute()
    {
        if (!$this->cover) {
            return asset('images/default-cover.jpg');
        }
        
        // Check if it's a full URL (CDN)
        if (filter_var($this->cover, FILTER_VALIDATE_URL)) {
            return $this->cover;
        }
        
        // Check if file exists in storage (via public symlink)
        if (str_starts_with($this->cover, 'storage/')) {
            // Already has storage/ prefix, use asset directly
            return asset($this->cover);
        }
        
        // Check if file exists in public directory
        if (file_exists(public_path($this->cover))) {
            return asset($this->cover);
        }
        
        // Assume it's in storage and needs storage/ prefix
        return asset('storage/' . $this->cover);
    }

    protected function thumbnailSource(): ?string
    {
        return $this->cover;
    }

    /**
     * Newest volume first.
     *
     * Ranked by when a volume was *added* (ebook_items.created_at), never by
     * updated_at — editing an old volume's price or blurb is not news, and
     * letting it count would shove a series to the top for a typo fix, the
     * same trap Latest Updates fell into with chapters.
     *
     * Series with no volumes yet sort last (MySQL places NULL last on DESC),
     * and the series' own created_at breaks ties so the order is stable.
     */
    public function scopeOrderByLatestVolume($query)
    {
        return $query
            ->select('ebook_series.*')
            ->selectSub(
                EbookItem::selectRaw('MAX(created_at)')
                    ->whereColumn('ebook_items.ebook_series_id', 'ebook_series.id'),
                'latest_volume_at'
            )
            ->orderByDesc('latest_volume_at')
            ->orderByDesc('ebook_series.created_at');
    }
}
