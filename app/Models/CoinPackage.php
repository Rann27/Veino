<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CoinPackage extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'coin_amount',
        'bonus_premium_days',
        'price_usd',
        'is_active',
    ];

    protected $casts = [
        'coin_amount' => 'integer',
        'bonus_premium_days' => 'integer',
        'price_usd' => 'decimal:2',
        'is_active' => 'boolean',
    ];

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }
}
