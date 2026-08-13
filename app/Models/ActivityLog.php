<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ActivityLog extends Model
{
    protected $fillable = [
        'user_id',
        'loan_id',
        'action_type',
        'description',
        'reject_reason',
        'ip_address',
    ];

    protected $casts = [
        'user_id' => 'integer',
        'loan_id' => 'integer',
        'reject_reason' => 'string',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function loan()
    {
        return $this->belongsTo(Loan::class);
    }

    public function scopeForAdministrativeActors($query, ?array $roles = null)
    {
        return $query->whereHas('user', function ($query) use ($roles) {
            $query->whereIn('role', $roles ?? ['gm', 'hr', 'creditcom']);
        });
    }
}
