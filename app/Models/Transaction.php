<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Transaction extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'type',
        'amount',
        'coins_spent',
        'coins_received',
        'payment_method',
        'status',
        'coin_package_id',
        'membership_package_id',
        'ebook_item_id',
        'chapter_id',
        'paypal_order_id',
        'paypal_payer_id',
        'paypal_response',
        'description',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'coins_spent' => 'integer',
        'coins_received' => 'integer',
        'paypal_response' => 'array',
    ];

    // Relationships
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function coinPackage()
    {
        return $this->belongsTo(CoinPackage::class);
    }

    public function membershipPackage()
    {
        return $this->belongsTo(MembershipPackage::class);
    }

    public function ebookItem()
    {
        return $this->belongsTo(EbookItem::class);
    }

    public function chapter()
    {
        return $this->belongsTo(Chapter::class);
    }

    // Helper methods
    public function getTypeLabel()
    {
        return match($this->type) {
            'coin_purchase' => '¢ Coin Top-Up',
            'membership_purchase' => '👑 Membership',
            'ebook_purchase' => '📖 Ebook',
            'chapter_purchase' => '📄 Chapter',
            'admin_grant' => '🎁 Admin Grant (Coins)',
            'admin_deduction' => '📉 Admin Deduction',
            'admin_membership_grant' => '👑 Premium Membership (Admin)',
            default => $this->type,
        };
    }

    public function getStatusBadgeClass()
    {
        return match($this->status) {
            'completed' => 'bg-green-100 text-green-800',
            'pending' => 'bg-yellow-100 text-yellow-800',
            'failed' => 'bg-red-100 text-red-800',
            'refunded' => 'bg-gray-100 text-gray-800',
            default => 'bg-gray-100 text-gray-800',
        };
    }
}