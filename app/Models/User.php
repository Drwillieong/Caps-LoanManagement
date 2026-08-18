<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Fortify\TwoFactorAuthenticatable;
use Illuminate\Support\Facades\Storage;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable, TwoFactorAuthenticatable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
    'first_name',
    'middle_name',
    'last_name',
    'email',
    'password',
    'role',
    'is_active',
    'status',
    'rejection_reason',
    'temporary_password',
];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'two_factor_secret',
        'two_factor_recovery_codes',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'two_factor_confirmed_at' => 'datetime',
        ];
    }

    /**
     * The accessors to append to the model's array form.
     */
    protected $appends = ['avatar'];

    /**
     * Get the member profile associated with the user.
     */
    public function memberProfile(): HasOne
    {
        return $this->hasOne(MemberProfile::class);
    }

    /**
     * Check if the user has completed their profile.
     * A profile is considered complete when all required fields are filled.
     * Note: spouse_name and beneficiaries are optional and don't block access.
     */
    public function hasCompletedProfile(): bool
    {
        // Ensure memberProfile is loaded
        $profile = $this->memberProfile;
        
        if (!$profile) {
            return false;
        }
        
        // Check all required fields are filled (spouse_name and beneficiaries are optional)
        $requiredFields = [
            'members_id',
            'first_name',
            'last_name',
            'date_of_birth',
            'sex',
            'civil_status',
            'mobile_number',
            'present_address',
            'position',
            'basic_salary',
        ];
        
        foreach ($requiredFields as $field) {
            if (empty($profile->{$field})) {
                return false;
            }
        }
        
        return true;
    }

    /**
     * Check if the user is a member role.
     */
    public function isMember(): bool
    {
        return $this->role === 'member';
    }

    /**
     * Get the loans for the user (as borrower).
     */
    public function loans(): HasMany
    {
        return $this->hasMany(Loan::class);
    }

    /**
     * Get the co-maker loans for the user.
     */
    public function coMakerLoans(): HasMany
    {
        return $this->hasMany(LoanCoMaker::class);
    }

    /**
     * Get loans where user is co-maker (for eligibility check).
     * Used in: whereDoesntHave('loansAsCoMaker') query
     */
    public function loansAsCoMaker(): HasMany
    {
        return $this->hasMany(Loan::class, 'id')
            ->join('loan_co_makers', 'loans.id', '=', 'loan_co_makers.loan_id')
            ->whereColumn('loan_co_makers.user_id', $this->getTable() . '.id');
    }

    /**
     * Get the user's avatar URL.
     */
    public function getAvatarAttribute(): ?string
    {
        return $this->memberProfile?->profile_picture
            ? Storage::url('profiles/'.$this->memberProfile->profile_picture)
            : null;
    }

    public function getNameAttribute(): string
    {
        return trim($this->first_name.' '.($this->middle_name ? $this->middle_name.' ' : '').$this->last_name);
    }

    /**
     * Check if user status is pending.
     */
    public function isPending(): bool
    {
        return $this->status === 'pending';
    }

    /**
     * Check if user status is active.
     */
    public function isActiveStatus(): bool
    {
        return $this->status === 'active';
    }

    /**
     * Check if user status is rejected.
     */
    public function isRejected(): bool
    {
        return $this->status === 'rejected';
    }
}
