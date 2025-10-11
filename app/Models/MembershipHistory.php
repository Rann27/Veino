<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MembershipHistory extends Model
{
    use HasFactory;

    protected $table = 'membership_history';

    protected $fillable = [
        'user_id',
        'membership_package_id',
        'invoice_number',
        'transaction_id',
        'tier',
        'duration_days',
        'amount_usd',
        'payment_method',
        'status',
        'paypal_order_id',
        'cryptomus_order_id',
        'gateway_response',
        'starts_at',
        'expires_at',
        'completed_at',
    ];

    protected $casts = [
        'amount_usd' => 'decimal:2',
        'duration_days' => 'integer',
        'gateway_response' => 'array',
        'starts_at' => 'datetime',
        'expires_at' => 'datetime',
        'completed_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Generate unique invoice number
     */
    public static function generateInvoiceNumber(): string
    {
        $date = now()->format('Ymd');
        $random = strtoupper(substr(md5(uniqid(mt_rand(), true)), 0, 6));
        return "INV-MEM-{$date}-{$random}";
    }

    /**
     * Relationships
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function package(): BelongsTo
    {
        return $this->belongsTo(MembershipPackage::class, 'membership_package_id');
    }

    // Alias for package relationship (for consistency)
    public function membershipPackage(): BelongsTo
    {
        return $this->package();
    }

    /**
     * Scopes
     */
    public function scopeCompleted($query)
    {
        return $query->where('status', 'completed');
    }

    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    public function scopeByUser($query, $userId)
    {
        return $query->where('user_id', $userId);
    }

    /**
     * Mark as completed
     */
    public function markAsCompleted(): void
    {
        $this->update([
            'status' => 'completed',
            'completed_at' => now(),
        ]);
    }

    /**
     * Mark as failed
     */
    public function markAsFailed(): void
    {
        $this->update(['status' => 'failed']);
    }
}
