<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PayrollUploadRow extends Model
{
    use HasFactory;

    protected $fillable = [
        'payroll_upload_id',
        'matched_user_id',
        'matched_member_profile_id',
        'row_number',
        'members_id',
        'payroll_id',
        'member_id',
        'employee_name',
        'cutoff_date',
        'deduction_amount',
        'applied_amount',
        'unapplied_amount',
        'status',
        'deduction_status',
        'errors',
        'raw_payload',
        'remarks',
        'processed_at',
    ];

    protected function casts(): array
    {
        return [
            'cutoff_date' => 'date',
            'deduction_amount' => 'decimal:2',
            'applied_amount' => 'decimal:2',
            'unapplied_amount' => 'decimal:2',
            'errors' => 'array',
            'raw_payload' => 'array',
            'processed_at' => 'datetime',
        ];
    }

    public function upload(): BelongsTo
    {
        return $this->belongsTo(PayrollUpload::class, 'payroll_upload_id');
    }

    public function memberProfile(): BelongsTo
    {
        return $this->belongsTo(MemberProfile::class, 'matched_member_profile_id', 'members_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'matched_user_id');
    }

    public function deductionRecords(): HasMany
    {
        return $this->hasMany(DeductionRecord::class);
    }
}
