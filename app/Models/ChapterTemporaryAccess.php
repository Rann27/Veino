<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Time-limited access to a premium chapter, earned through the shortlink
 * challenge rather than bought with coins.
 */
class ChapterTemporaryAccess extends Model
{
    protected $table = 'chapter_temporary_access';

    protected $fillable = [
        'user_id',
        'chapter_id',
        'granted_at',
        'expires_at',
        'source',
    ];

    protected $casts = [
        'granted_at' => 'datetime',
        'expires_at' => 'datetime',
    ];

    public function scopeActive($query)
    {
        return $query->where('expires_at', '>', now());
    }

    public function isActive(): bool
    {
        return $this->expires_at !== null && $this->expires_at->isFuture();
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function chapter(): BelongsTo
    {
        return $this->belongsTo(Chapter::class);
    }
}
