<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * A file the storage manager removed, held for a grace period before it is
 * really gone.
 */
class StorageTrash extends Model
{
    protected $table = 'storage_trash';

    protected $fillable = [
        'original_path',
        'trash_path',
        'disk',
        'size',
        'deleted_by',
        'deleted_at',
    ];

    protected $casts = [
        'size' => 'integer',
        'deleted_at' => 'datetime',
    ];

    /** How long a quarantined file survives before automatic purging. */
    public const RETENTION_DAYS = 30;

    public function deletedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'deleted_by');
    }

    public function scopeExpired($query)
    {
        return $query->where('deleted_at', '<=', now()->subDays(self::RETENTION_DAYS));
    }

    public function getExpiresAtAttribute()
    {
        return $this->deleted_at?->copy()->addDays(self::RETENTION_DAYS);
    }
}
