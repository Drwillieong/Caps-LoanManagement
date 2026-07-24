<?php

namespace App\Services;

use App\Models\ActivityLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ActivityLogService
{
    private const ADMIN_ROLES = ['gm', 'hr'];

    public function logActivity(
        string $actionType,
        ?int $loanId = null,
        string $description = '',
        ?string $rejectReason = null,
        ?Request $request = null
    ): ?ActivityLog {
        $request ??= request();
        $userId = Auth::id() ?? $request->user()?->id;

        if (! $userId) {
            return null;
        }

        return ActivityLog::create([
            'user_id' => $userId,
            'loan_id' => $loanId,
            'action_type' => $actionType,
            'description' => $description,
            'reject_reason' => $rejectReason,
            'ip_address' => $request->ip(),
        ]);
    }

    public function adminLogsQuery(
        ?string $actorRole = null,
        ?string $actionType = null,
        ?string $search = null
    ) {
        $roles = in_array($actorRole, self::ADMIN_ROLES, true)
            ? [$actorRole]
            : self::ADMIN_ROLES;

        $query = ActivityLog::query()
            ->with([
                'user:id,first_name,middle_name,last_name,role',
                'loan:id,principal_amount,user_id',
            ])
            ->forAdministrativeActors($roles)
            ->latest();

        if ($actionType && $actionType !== 'all') {
            $query->where('action_type', $actionType);
        }

        if ($search && trim($search) !== '') {
            $term = trim($search);

            $query->where(function ($query) use ($term) {
                $query->where('description', 'like', "%{$term}%")
                    ->orWhere('action_type', 'like', "%{$term}%")
                    ->orWhere('ip_address', 'like', "%{$term}%")
                    ->orWhereHas('user', function ($query) use ($term) {
                        $query->where('first_name', 'like', "%{$term}%")
                            ->orWhere('middle_name', 'like', "%{$term}%")
                            ->orWhere('last_name', 'like', "%{$term}%")
                            ->orWhere('email', 'like', "%{$term}%");
                    });

                if (is_numeric($term)) {
                    $query->orWhere('loan_id', (int) $term);
                }
            });
        }

        return $query;
    }

    public function availableActionTypes(?string $actorRole = null): array
    {
        $roles = in_array($actorRole, self::ADMIN_ROLES, true)
            ? [$actorRole]
            : self::ADMIN_ROLES;

        return ActivityLog::query()
            ->forAdministrativeActors($roles)
            ->distinct()
            ->orderBy('action_type')
            ->pluck('action_type')
            ->filter()
            ->values()
            ->all();
    }

    public function formatForApi(ActivityLog $activity): array
    {
        $actor = $activity->user;
        $actorPayload = $actor ? [
            'id' => $actor->id,
            'name' => $actor->name,
            'role' => $actor->role,
        ] : null;

        return [
            'id' => $activity->id,
            'user_id' => $activity->user_id,
            'loan_id' => $activity->loan_id,
            'action_type' => $activity->action_type,
            'description' => $activity->description,
            'reject_reason' => $activity->reject_reason,
            'ip_address' => $activity->ip_address,
            'created_at' => $activity->created_at?->toIso8601String(),
            'updated_at' => $activity->updated_at?->toIso8601String(),
            'actor' => $actorPayload,
            'user' => $actorPayload,
            'loan' => $activity->loan ? [
                'id' => $activity->loan->id,
                'principal_amount' => (float) $activity->loan->principal_amount,
            ] : null,
        ];
    }

    public function getGmActivityLogs(int $limit = 50)
    {
        return $this->adminLogsQuery('gm')
            ->orderBy('created_at', 'desc')
            ->limit($limit)
            ->get();
    }
}
