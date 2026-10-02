<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * An address a reader has signed in from.
 *
 * One row per (account, address) pair: signing in again from a known address
 * bumps its counters rather than adding a row, so the list stays a set of
 * places rather than a log of every session.
 */
class UserLoginIp extends Model
{
    public $timestamps = false;

    protected $fillable = ['user_id', 'ip', 'first_seen_at', 'last_seen_at', 'logins'];

    protected function casts(): array
    {
        return [
            'first_seen_at' => 'datetime',
            'last_seen_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
