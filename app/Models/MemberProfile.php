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
        'date_of_birth',
        'sex',
        'civil_status',
        'spouse_name',
        'mobile_number',
        'present_address',
        'permanent_address',
        'position',
        'date_hired',
        'basic_salary',
        'share_capital_balance',
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
            'share_capital_balance' => 'decimal:2',
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
