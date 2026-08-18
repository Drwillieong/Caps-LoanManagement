<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProfileUpdateRequest extends Model
{
    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'member_id',
        'request_type',
        'proposed_status',
        'reason',
        'requested_by',
        'original_data',
        'pending_data',
        'status',
        'rejection_reason',
        'reviewed_by',
    ];

    /**
     * The attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'original_data' => 'array',
            'pending_data' => 'array',
        ];
    }

    /**
     * Get the member profile associated with this update request.
     */
    public function member(): BelongsTo
    {
        return $this->belongsTo(MemberProfile::class, 'member_id', 'members_id');
    }

    /**
     * Get the user who requested the update (HR).
     */
    public function requester(): BelongsTo
    {
        return $this->belongsTo(User::class, 'requested_by');
    }

    /**
     * Get the user who reviewed the request (GM).
     */
    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }
}

