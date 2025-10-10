<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ReadingHistory extends Model
{
    protected $table = 'reading_history';

    protected $fillable = [
        'user_id',
        'series_id',
        'chapter_id',
        'last_read_at',
    ];

    protected $casts = [
        'last_read_at' => 'datetime',
    ];

    /**
     * Get the user that owns the reading history
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the series
     */
    public function series(): BelongsTo
    {
        return $this->belongsTo(Series::class);
    }

    /**
     * Get the chapter
     */
    public function chapter(): BelongsTo
    {
        return $this->belongsTo(Chapter::class);
    }

    /**
     * Update or create reading history for a user and chapter
     */
    public static function updateOrCreateHistory(int $userId, int $seriesId, int $chapterId): void
    {
        static::updateOrCreate(
            [
                'user_id' => $userId,
                'chapter_id' => $chapterId,
            ],
            [
                'series_id' => $seriesId,
                'last_read_at' => now(),
            ]
        );
    }
}
