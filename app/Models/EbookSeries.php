<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class EbookSeries extends Model
{
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
    ];

    protected $appends = ['cover_url', 'price_range'];

    protected $casts = [
        'show_trial_button' => 'boolean',
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
        if ($this->cover && file_exists(public_path($this->cover))) {
            return asset($this->cover);
        }
        return asset('images/default-cover.jpg');
    }
}
