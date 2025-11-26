<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Blog extends Model
{
    protected $fillable = [
        'title',
        'content',
        'show_in_homepage',
    ];

    protected $casts = [
        'show_in_homepage' => 'boolean',
    ];
}
