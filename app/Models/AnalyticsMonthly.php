<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AnalyticsMonthly extends Model
{
    protected $table = 'analytics_monthly';

    protected $fillable = [
        'month',
        'pageviews',
        'visitors',
        'sessions',
        'new_visitors',
        'member_views',
        'guest_views',
        'active_days',
        'devices',
        'browsers',
        'os',
        'page_types',
        'top_pages',
        'top_referrers',
        'countries',
    ];

    protected $casts = [
        'devices' => 'array',
        'browsers' => 'array',
        'os' => 'array',
        'page_types' => 'array',
        'top_pages' => 'array',
        'top_referrers' => 'array',
        'countries' => 'array',
    ];
}
