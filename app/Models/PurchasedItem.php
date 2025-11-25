<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PurchasedItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'ebook_item_id',
        'transaction_id',
        'price_paid',
        'purchased_at',
    ];

    protected $casts = [
        'purchased_at' => 'datetime',
        'price_paid' => 'integer',
    ];

    // Relationships
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function ebookItem()
    {
        return $this->belongsTo(EbookItem::class);
    }
}
