<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Loan extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'user_id',
        'loan_type_id',
        'principal_amount',
        'terms_months',
        'interest_amount',
        'total_amount_due',
        'monthly_amortization',
        'voucher_number',
        'check_number',
        'release_date',
        'status',
        'remarks',
    ];

    /**
     * The attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'principal_amount' => 'decimal:2',
            'interest_amount' => 'decimal:2',
            'total_amount_due' => 'decimal:2',
            'monthly_amortization' => 'decimal:2',
            'release_date' => 'date',
            'terms_months' => 'integer',
        ];
    }

    /**
     * Get the user that owns the loan.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the loan type that owns the loan.
     */
    public function loanType(): BelongsTo
    {
        return $this->belongsTo(LoanType::class);
    }

    /**
     * Get the co-makers for the loan.
     */
    public function coMakers(): HasMany
    {
        return $this->hasMany(LoanCoMaker::class);
    }

    /**
     * Get the amortizations for the loan.
     */
    public function amortizations(): HasMany
    {
        return $this->hasMany(LoanAmortization::class);
    }

    /**
     * Get the payments for the loan.
     */
    public function payments(): HasMany
    {
        return $this->hasMany(LoanPayment::class);
    }
}

