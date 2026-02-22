<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LoanAmortization extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'loan_id',
        'installment_number',
        'due_date',
        'amount_due',
        'amount_paid',
        'status',
    ];

    /**
     * The attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'due_date' => 'date',
            'amount_due' => 'decimal:2',
            'amount_paid' => 'decimal:2',
            'installment_number' => 'integer',
        ];
    }

    /**
     * Get the loan that owns the amortization.
     */
    public function loan(): BelongsTo
    {
        return $this->belongsTo(Loan::class);
    }
}

