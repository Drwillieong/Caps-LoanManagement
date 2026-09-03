<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LoanAdvancePaymentRequest extends Model
{
    use HasFactory;

    public const STATUS_PENDING_VALIDATION = 'pending_validation';

    public const STATUS_APPROVED = 'approved';

    public const STATUS_REJECTED = 'rejected';

    public const STATUS_AWAITING_PAYMENT = 'awaiting_payment';

    public const STATUS_SCHEDULED_FOR_SALARY_DEDUCTION = 'scheduled_for_salary_deduction';

    public const STATUS_PAYMENT_SUBMITTED = 'payment_submitted';

    public const STATUS_PAYMENT_VERIFIED = 'payment_verified';

    public const STATUS_PAYMENT_APPLIED = 'payment_applied';

    public const STATUS_COMPLETED = 'completed';

    public const STATUS_CANCELLED = 'cancelled';

    public const STATUS_EXPIRED = 'expired';

    public const PAYMENT_METHOD_CASH = 'cash';

    public const PAYMENT_METHOD_BANK_TRANSFER = 'bank_transfer';

    public const PAYMENT_METHOD_SALARY_DEDUCTION = 'salary_deduction';

    public const BLOCKING_STATUSES = [
        self::STATUS_PENDING_VALIDATION,
        self::STATUS_APPROVED,
        self::STATUS_AWAITING_PAYMENT,
        self::STATUS_SCHEDULED_FOR_SALARY_DEDUCTION,
        self::STATUS_PAYMENT_SUBMITTED,
        self::STATUS_PAYMENT_VERIFIED,
        self::STATUS_PAYMENT_APPLIED,
    ];

    protected $fillable = ['loan_id', 'requested_by', 'reviewed_by', 'verified_by', 'outstanding_balance', 'regular_deduction_amount', 'requested_amount', 'installments_covered', 'payment_method', 'expected_payment_date', 'payment_date', 'reference_number', 'payment_proof_path', 'remarks', 'status', 'rejection_reason', 'calculation_snapshot', 'approved_at', 'rejected_at', 'payment_submitted_at', 'verified_at', 'applied_at'];

    protected function casts(): array
    {
        return [
            'outstanding_balance' => 'decimal:2',
            'regular_deduction_amount' => 'decimal:2',
            'requested_amount' => 'decimal:2',
            'installments_covered' => 'integer',
            'expected_payment_date' => 'date',
            'payment_date' => 'date',
            'calculation_snapshot' => 'array',
            'approved_at' => 'datetime',
            'rejected_at' => 'datetime',
            'payment_submitted_at' => 'datetime',
            'verified_at' => 'datetime',
            'applied_at' => 'datetime',
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
