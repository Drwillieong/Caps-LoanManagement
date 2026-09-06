<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class LoanType extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = ['name', 'interest_rate_per_annum', 'max_term_months', 'requires_comaker'];

    /**
     * The attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'interest_rate_per_annum' => 'decimal:2',
            'max_term_months' => 'integer',
            'requires_comaker' => 'boolean',
        ];
    }

    /**
     * Get the loans for this loan type.
     */
    public function loans(): HasMany
    {
        return $this->hasMany(Loan::class);
    }
}
