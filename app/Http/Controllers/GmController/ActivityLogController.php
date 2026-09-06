<?php

namespace App\Http\Controllers\GmController;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class ActivityLogController extends Controller
{
    /**
     * Handle the incoming request.
     */
    public function __invoke(Request $request)
    {
        $activityLogService = new \App\Services\ActivityLogService;

        $activities = $activityLogService->getGmActivityLogs(100);

        return inertia('dashboards/Gm/ActivityLog', [
            'activities' => $activities,
        ]);
    }
}
