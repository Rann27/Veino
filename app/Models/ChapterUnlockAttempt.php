<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * One row per claim of a free-unlock challenge, whether it succeeded or not.
 *
 * Refusals matter more than grants here: a burst of `too_fast` from one account
 * is what a circulating bypass looks like from the inside.
 */
class ChapterUnlockAttempt extends Model
{
    public const UPDATED_AT = null;

    protected $fillable = [
        'user_id', 'chapter_id', 'outcome', 'elapsed_seconds', 'source', 'ip', 'created_at',
    ];

    protected $casts = [
        'elapsed_seconds' => 'integer',
        'created_at' => 'datetime',
    ];

    /**
     * Outcomes of a *claim*. 'started' is deliberately absent: it records a
     * button press, not a verdict, and mixing it in would inflate every rate.
     */
    public const OUTCOMES = ['granted', 'too_fast', 'bad_referer', 'not_started', 'daily_limit', 'throttled', 'expired_token', 'disabled', 'ip_limit', 'fraud_hold', 'early_access'];

    /** Logged when the reader sets off, before any verdict exists. */
    public const STARTED = 'started';

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function chapter(): BelongsTo
    {
        return $this->belongsTo(Chapter::class);
    }
}
