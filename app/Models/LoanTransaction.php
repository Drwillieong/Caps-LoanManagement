<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LoanTransaction extends Model
{
    use HasFactory;

    protected $fillable = [
        'loan_id',
        'loan_amortization_id',
        'payroll_upload_id',
        'payroll_upload_row_id',
        'processed_by',
        'transaction_type',
        'amount',
        'transaction_date',
        'balance_after',
        'reference_number',
        'remarks',
        'meta',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'transaction_date' => 'date',
            'balance_after' => 'decimal:2',
            'meta' => 'array',
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

    public function processor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'processed_by');
    }
}
