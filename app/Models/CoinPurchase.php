<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CoinPurchase extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'coin_package_id',
        'coins_amount',
        'price_usd',
        'payment_method',
        'transaction_id',
        'payment_url',
        'status',
        'expires_at',
    ];

    protected $casts = [
        'price_usd'  => 'decimal:2',
        'coins_amount' => 'integer',
        'expires_at' => 'datetime',
    ];

    public function isExpired(): bool
    {
        return $this->expires_at !== null && now()->isAfter($this->expires_at);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function coinPackage(): BelongsTo
    {
        return $this->belongsTo(CoinPackage::class);
    }
}
