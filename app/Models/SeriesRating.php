<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** A reader's 1–5 star vote on a series. One per reader per series. */
class SeriesRating extends Model
{
    protected $fillable = ['user_id', 'series_id', 'stars'];

    protected function casts(): array
    {
        return ['stars' => 'integer'];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function series(): BelongsTo
    {
        return $this->belongsTo(Series::class);
    }
}
