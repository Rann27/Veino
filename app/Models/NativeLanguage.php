<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class NativeLanguage extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'slug',
    ];

    public function series(): HasMany
    {
        return $this->hasMany(Series::class);
    }
}
