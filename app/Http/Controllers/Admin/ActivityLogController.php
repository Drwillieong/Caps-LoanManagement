<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\ActivityLogService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ActivityLogController extends Controller
{
    public function gm()
    {
        return Inertia::render('dashboards/Gm/ActivityLog');
    }

    public function hr()
    {
        return Inertia::render('dashboards/HR/SecActivityLog');
    }

    public function creditCom()
    {
        return Inertia::render('dashboards/CreditCom/ActivityLog');
    }

    public function index(Request $request, ActivityLogService $activityLogService)
    {
        $validated = $request->validate([
            'page' => 'sometimes|integer|min:1',
            'per_page' => 'sometimes|integer|min:1|max:500',
            'search' => 'nullable|string|max:255',
            'action_type' => 'nullable|string|max:100',
            'actor_role' => 'nullable|string|in:all,gm,hr,creditcom',
            'date_from' => 'nullable|date',
            'date_to' => 'nullable|date|after_or_equal:date_from',
        ]);

        $actorRole = ($validated['actor_role'] ?? 'all') === 'all'
            ? null
            : $validated['actor_role'];
        $actionType = ($validated['action_type'] ?? 'all') === 'all'
            ? null
            : $validated['action_type'];
        $search = $validated['search'] ?? null;
        $dateFrom = $validated['date_from'] ?? null;
        $dateTo = $validated['date_to'] ?? null;
        $perPage = (int) ($validated['per_page'] ?? 10);

        $baseQuery = $activityLogService->adminLogsQuery($actorRole);
        $filteredQuery = $activityLogService->adminLogsQuery($actorRole, $actionType, $search, $dateFrom, $dateTo);
        $activities = $filteredQuery->paginate($perPage)->withQueryString();

        return response()->json([
            'data' => $activities->getCollection()
                ->map(fn ($activity) => $activityLogService->formatForApi($activity))
                ->values(),
            'meta' => [
                'current_page' => $activities->currentPage(),
                'last_page' => $activities->lastPage(),
                'per_page' => $activities->perPage(),
                'total' => $activities->total(),
                'from' => $activities->firstItem(),
                'to' => $activities->lastItem(),
            ],
            'stats' => [
                'total' => (clone $baseQuery)->count(),
                'today' => (clone $baseQuery)->whereDate('created_at', today())->count(),
                'filtered' => $activities->total(),
            ],
            'filters' => [
                'action_types' => $activityLogService->availableActionTypes($actorRole),
            ],
        ]);
    }
}
