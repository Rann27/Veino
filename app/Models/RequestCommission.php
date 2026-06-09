<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RequestCommission extends Model
{
    use HasFactory;

    public const TYPE_REQUEST = 'request';
    public const TYPE_COMMISSION = 'commission';

    public const STATUS_PENDING = 'pending';
    public const STATUS_APPROVED = 'approved';
    public const STATUS_BILLED = 'billed';
    public const STATUS_ON_QUEUE = 'on_queue';
    public const STATUS_COMPLETED = 'completed';

    protected $fillable = [
        'user_id',
        'type',
        'title',
        'raw_link',
        'note_for_admin',
        'is_private',
        'email',
        'status',
        'bill_amount',
        'admin_note',
        'paid_at',
    ];

    protected $casts = [
        'is_private' => 'boolean',
        'bill_amount' => 'integer',
        'paid_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function isCommission(): bool
    {
        return $this->type === self::TYPE_COMMISSION;
    }
}
