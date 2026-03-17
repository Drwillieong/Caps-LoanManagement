<?php

namespace App\Http\Controllers;

use App\Services\DashboardService;
use Inertia\Inertia;
use Illuminate\Http\Request;

class DashBoardController extends Controller
{
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
            'creditcom' => 'dashboards/CreditCom/CreditComDashboard',
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
        $loanService = new \App\Services\LoanService();
        $loan_notifications = $loanService->getLoanNotifications($user);
        return Inertia::render('dashboards/Member/Notification', [
            'loan_notifications' => $loan_notifications
        ]);
    }

    public function markNotificationsAsRead(Request $request)
    {
        $user = $request->user();
        
        \App\Models\Loan::where('user_id', $user->id)
            ->whereNull('notifications_read_at')
            ->byStatus([
                'rejected_by_co_maker',
                'pending_gm_review',
                'rejected_by_gm',
                'pending_cc_review',
                'rejected_by_credit_com',
                'approved',
                'released',
            ])
            ->update(['notifications_read_at' => now()]);

        return response()->json(['message' => 'Notifications marked as read']);
    }
}
