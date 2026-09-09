<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * A claim token a chapter has finished with.
 *
 * Retired tokens are kept, never deleted. They are what lets a claim arriving
 * on an old URL still be traced back to its chapter, so the reply looks
 * identical to every other failure instead of announcing that the token is
 * dead.
 */
class ChapterUnlockToken extends Model
{
    public $timestamps = false;

    protected $fillable = ['chapter_id', 'token', 'retired_at'];

    protected function casts(): array
    {
        return ['retired_at' => 'datetime'];
    }

    public function chapter(): BelongsTo
    {
        return $this->belongsTo(Chapter::class);
    }
}
