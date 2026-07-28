<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PageView extends Model
{
    public const UPDATED_AT = null;

    protected $fillable = [
        'visitor_id',
        'session_id',
        'user_id',
        'path',
        'page_type',
        'series_id',
        'title',
        'referrer_host',
        'device',
        'browser',
        'os',
        'country',
        'is_new_visitor',
        'is_member',
        'created_at',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'is_new_visitor' => 'boolean',
        'is_member' => 'boolean',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function series(): BelongsTo
    {
        return $this->belongsTo(Series::class);
    }
}
