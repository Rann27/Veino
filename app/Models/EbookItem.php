<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class EbookItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'ebook_series_id',
        'title',
        'cover',
        'summary',
        'file_path',
        'pdf_file_path',
        'price_coins',
        'order',
    ];

    protected $casts = [
        'price_coins' => 'integer',
        'order' => 'integer',
    ];

    protected $appends = ['cover_url'];

    // Relationships
    public function ebookSeries()
    {
        return $this->belongsTo(EbookSeries::class);
    }

    public function chartItems()
    {
        return $this->hasMany(ChartItem::class);
    }

    public function purchasedItems()
    {
        return $this->hasMany(PurchasedItem::class);
    }

    // Helper methods
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

    public function getFileUrlAttribute()
    {
        if ($this->file_path && file_exists(storage_path('app/' . $this->file_path))) {
            return route('ebook.download', $this->id);
        }
        return null;
    }

    public function getPdfFileUrlAttribute()
    {
        if ($this->pdf_file_path && file_exists(storage_path('app/' . $this->pdf_file_path))) {
            return route('ebook.download.pdf', $this->id);
        }
        return null;
    }

    public function isPurchasedBy($userId)
    {
        return $this->purchasedItems()->where('user_id', $userId)->exists();
    }

    public function isInCartOf($userId)
    {
        return $this->chartItems()->where('user_id', $userId)->exists();
    }
}
