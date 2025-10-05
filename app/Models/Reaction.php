<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class Reaction extends Model
{
    protected $fillable = [
        'user_id',
        'reactable_type',
        'reactable_id',
        'type',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Get the user that owns the reaction
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the reactable model (Series, Chapter, or Comment)
     */
    public function reactable(): MorphTo
    {
        return $this->morphTo();
    }

    /**
     * Available reaction types
     */
    public static function types(): array
    {
        return ['like', 'love', 'haha', 'angry', 'sad'];
    }
}
