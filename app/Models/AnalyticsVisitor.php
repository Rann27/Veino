<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AnalyticsVisitor extends Model
{
    protected $table = 'analytics_visitors';

    protected $primaryKey = 'visitor_id';

    public $incrementing = false;

    public $timestamps = false;

    protected $keyType = 'string';

    protected $fillable = [
        'visitor_id',
        'first_seen_at',
        'last_seen_at',
        'pageviews',
        'country',
        'device',
    ];

    protected $casts = [
        'first_seen_at' => 'datetime',
        'last_seen_at' => 'datetime',
    ];
}
