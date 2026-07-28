<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AnalyticsDaily extends Model
{
    protected $table = 'analytics_daily';

    protected $fillable = [
        'date',
        'pageviews',
        'visitors',
        'sessions',
        'new_visitors',
        'member_views',
        'guest_views',
        'devices',
        'top_pages',
        'top_referrers',
        'countries',
    ];

    protected $casts = [
        'date' => 'date',
        'devices' => 'array',
        'top_pages' => 'array',
        'top_referrers' => 'array',
        'countries' => 'array',
    ];
}
