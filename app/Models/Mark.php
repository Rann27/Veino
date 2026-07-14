<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Mark extends Model
{
    protected $fillable = [
        'user_id',
        'series_id',
        'chapter_id',
        'paragraph_index',
        'paragraph_preview',
    ];

    protected $casts = [
        'paragraph_index' => 'integer',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function series()
    {
        return $this->belongsTo(Series::class);
    }

    public function chapter()
    {
        return $this->belongsTo(Chapter::class);
    }
}
