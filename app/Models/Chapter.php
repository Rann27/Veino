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
        'title',
        'content',
        'is_premium',
        'coin_price',
        'is_published',
    ];

    protected $casts = [
        'is_premium' => 'boolean',
        'is_published' => 'boolean',
    ];

    public function series(): BelongsTo
    {
        return $this->belongsTo(Series::class);
    }

    public function getNextChapter(): ?Chapter
    {
        return static::where('series_id', $this->series_id)
            ->where('chapter_number', '>', $this->chapter_number)
            ->where('is_published', true)
            ->orderBy('chapter_number')
            ->first();
    }

    public function getPreviousChapter(): ?Chapter
    {
        return static::where('series_id', $this->series_id)
            ->where('chapter_number', '<', $this->chapter_number)
            ->where('is_published', true)
            ->orderBy('chapter_number', 'desc')
            ->first();
    }
}
