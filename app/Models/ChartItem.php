<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ChartItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'ebook_item_id',
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
