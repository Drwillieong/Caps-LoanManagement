<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LoanSettlementRequest extends Model
{
    use HasFactory;

    public const STATUS_PENDING = 'pending';
    public const STATUS_APPROVED = 'approved';
    public const STATUS_FOR_PAYMENT = 'for_payment';
    public const STATUS_COMPLETED = 'completed';
    public const STATUS_REJECTED = 'rejected';

    protected $fillable = [
        'loan_id',
        'requested_by',
        'reviewed_by',
        'verified_by',
        'outstanding_balance',
        'settlement_amount',
        'calculation_breakdown',
        'eligibility_checks',
        'status',
        'rejection_reason',
        'payment_method',
        'reference_number',
        'payment_date',
        'approved_at',
        'rejected_at',
        'verified_at',
    ];

    protected function casts(): array
    {
        return [
            'outstanding_balance' => 'decimal:2',
            'settlement_amount' => 'decimal:2',
            'calculation_breakdown' => 'array',
            'eligibility_checks' => 'array',
            'payment_date' => 'date',
            'approved_at' => 'datetime',
            'rejected_at' => 'datetime',
            'verified_at' => 'datetime',
        ];
    }

    public function loan(): BelongsTo
    {
        return $this->belongsTo(Loan::class);
    }

    public function requester(): BelongsTo
    {
        return $this->belongsTo(User::class, 'requested_by');
    }

    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }

    public function verifier(): BelongsTo
    {
        return $this->belongsTo(User::class, 'verified_by');
    }
}
