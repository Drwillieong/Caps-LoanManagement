<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class MemberProfile extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'user_id',
        'employee_id',
        'payroll_id',
        'first_name',
        'middle_name',
        'last_name',
        'place_of_birth',
        'date_of_birth',
        'sex',
        'civil_status',
        'educational_attainment',
        'spouse_name',
        'mobile_number',
        'permanent_mobile_number',
        'present_address',
        'present_zip_code',
        'permanent_address',
        'permanent_zip_code',
        'position',
        'date_hired',
        'basic_salary',
        'income_type',
        'net_income',
        'share_capital_balance',
        'other_source_of_income',
        'facebook_account_name',
        'spouse_occupation',
        'spouse_gross_income',
        'spouse_income_type',
        'spouse_net_income',
        'legal_beneficiary_1_name',
        'real_properties_owned',
        'bank_account_number',
        'tin_number',
        'profile_picture',
    ];

    /**
     * The attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'date_of_birth' => 'date',
            'date_hired' => 'date',
            'basic_salary' => 'decimal:2',
            'net_income' => 'decimal:2',
            'share_capital_balance' => 'decimal:2',
            'spouse_gross_income' => 'decimal:2',
            'spouse_net_income' => 'decimal:2',
        ];
    }

    /**
     * Get the user that owns the member profile.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the beneficiaries for the member profile.
     */
    public function beneficiaries(): HasMany
    {
        return $this->hasMany(Beneficiary::class);
    }

    public function deductionRecords(): HasMany
    {
        return $this->hasMany(DeductionRecord::class);
    }

    /**
     * Get the full name of the member.
     */
    public function getFullNameAttribute(): string
    {
        return trim("{$this->first_name} {$this->middle_name} {$this->last_name}");
    }
}
