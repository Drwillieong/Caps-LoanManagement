<?php

namespace App\Services;

use App\Models\ActivityLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ActivityLogService
{
    public function logActivity(string $actionType, ?int $loanId = null, string $description = '', ?string $rejectReason = null)
    {
        ActivityLog::create([
            'user_id' => Auth::id(),
            'loan_id' => $loanId,
            'action_type' => $actionType,
            'description' => $description,
            'reject_reason' => $rejectReason,
            'ip_address' => request()->ip(),
        ]);
    }

    public function getGmActivityLogs(int $limit = 50)
    {
        return ActivityLog::with(['user', 'loan'])
            ->whereHas('user', function ($query) {
                $query->where('role', 'gm');
            })
            ->orWhere('user_id', Auth::id())
            ->orderBy('created_at', 'desc')
            ->limit($limit)
            ->get();
    }
}

