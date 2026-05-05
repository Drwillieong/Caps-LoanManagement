<?php

namespace App\Http\Controllers;

use App\Services\DashboardService;
use Inertia\Inertia;
use Illuminate\Http\Request;

class DashBoardController extends Controller
{
    use \App\Traits\HasNotificationCount;

    public function __construct(
        protected DashboardService $dashboardService
    ) {}

    public function index(Request $request)
    {
        $user = $request->user();
        $role = $user->role;
        
    $roleComponents = [
        'member' => 'dashboards/Member/MemberDashboard',
        'gm' => 'dashboards/Gm/GmDashboard',
        'hr' => 'dashboards/HR/HrDashboard',
    ];

        if (!array_key_exists($role, $roleComponents)) {
            abort(403, 'Unauthorized role.');
        }

        $data = $this->dashboardService->getDashboardData($role);

        return Inertia::render($roleComponents[$role], $data);
    }

    public function memberNotifications(Request $request)
    {
        $user = $request->user();
        $notificationService = app(\App\Services\NotificationService::class);
        
        return Inertia::render('dashboards/Member/Notification', [
            'loan_notifications' => $notificationService->getNotificationsForUser($user)->items(),
            'unread_notifications_count' => $notificationService->getUnreadCount($user)
        ]);
    }

    public function markNotificationsAsRead(Request $request)
    {
        $user = $request->user();
        $notificationService = app(\App\Services\NotificationService::class);
        $notificationService->markAllRead($user);

       
    }
}
