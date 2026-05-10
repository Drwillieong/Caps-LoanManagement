<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DeductionRecord extends Model
{
    use HasFactory;

    protected $fillable = [
        'loan_id',
        'loan_amortization_id',
        'payroll_upload_id',
        'payroll_upload_row_id',
        'member_profile_id',
        'processed_by',
        'cutoff_date',
        'expected_amount',
        'deducted_amount',
        'status',
        'payment_method',
        'balance_after',
        'reference_number',
        'remarks',
        'processed_at',
    ];

    protected function casts(): array
    {
        return [
            'cutoff_date' => 'date',
            'expected_amount' => 'decimal:2',
            'deducted_amount' => 'decimal:2',
            'balance_after' => 'decimal:2',
            'processed_at' => 'datetime',
        ];
    }

    public function loan(): BelongsTo
    {
        return $this->belongsTo(Loan::class);
    }

    public function amortization(): BelongsTo
    {
        return $this->belongsTo(LoanAmortization::class, 'loan_amortization_id');
    }

    public function upload(): BelongsTo
    {
        return $this->belongsTo(PayrollUpload::class, 'payroll_upload_id');
    }

    public function uploadRow(): BelongsTo
    {
        return $this->belongsTo(PayrollUploadRow::class, 'payroll_upload_row_id');
    }

    public function processor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'processed_by');
    }
}
