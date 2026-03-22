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
        'loan_id' => 'integer',
        'reject_reason' => 'string|null',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function loan()
    {
        return $this->belongsTo(Loan::class);
    }
}

