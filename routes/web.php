<?php

use App\Http\Controllers\Admin\ActivityLogController as AdminActivityLogController;
use App\Http\Controllers\CreditComController\CreditComController;
use App\Http\Controllers\CreditComController\CreditComDashboardController;
use App\Http\Controllers\DashBoardController;
use App\Http\Controllers\GmController\BulkMemberUploadController;
use App\Http\Controllers\GmController\GmController;
use App\Http\Controllers\GmController\GmDashboardController;
use App\Http\Controllers\HrController\CreateMemberController;
use App\Http\Controllers\HrController\HrDashboardController;
use App\Http\Controllers\HrController\MemberProfileViewController;
use App\Http\Controllers\LoanSettlementRequestController;
use App\Http\Controllers\Member\LoanController;
use App\Http\Controllers\Member\MemberController;
use App\Http\Controllers\Member\MemberProfileController;
use App\Http\Controllers\Payroll\PayrollDeductionController;
use App\Http\Controllers\SidebarNotificationBadgeController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;

Route::get('/', function () {
    return Inertia::render('welcome', [
        'canRegister' => Features::enabled(Features::registration()),
    ]);
})->name('home');

Route::get('/faq', function () {
    return Inertia::render('Faq/Faq');
})->name('faq');

Route::get('/faq/{slug}', function (string $slug) {
    return Inertia::render('Faq/FaqDetail', ['slug' => $slug]);
})->name('faq.detail');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', [DashBoardController::class, 'index'])
        ->name('dashboard')
        ->middleware('ensure.profile.completed');

    Route::post('sidebar-notification-badges/mark-read', [SidebarNotificationBadgeController::class, 'markRead'])
        ->name('sidebar-notification-badges.mark-read');

    // HR
    Route::get('dashboards/HR/SeeUsers', [CreateMemberController::class, 'index'])->middleware('role:hr')->name('users');

    Route::get('dashboards/HR/MembersProfile/{membersId}', [MemberProfileViewController::class, 'show'])->middleware('role:hr')->name('users.profile');

    Route::get('dashboards/HR/create', [CreateMemberController::class, 'create'])->middleware('role:hr')->name('users.create');
    Route::post('dashboards/HR/SeeUsers', [CreateMemberController::class, 'store'])->middleware('role:hr')->name('users.store');
    Route::patch('dashboards/HR/users/{user}/status', [CreateMemberController::class, 'updateStatus'])->middleware('role:hr')->name('users.status.update');

    // HR - Rejected Member Resubmit Workflow (rejected list merged into SeeUsers)
    Route::get('dashboards/HR/RejectedMembers', [CreateMemberController::class, 'index'])
        ->middleware('role:hr')
        ->name('hr.rejected-members');
    Route::get('dashboards/HR/RejectedMembers/{user}/edit', [CreateMemberController::class, 'editRejected'])->middleware('role:hr')->name('hr.rejected-members.edit');
    Route::put('dashboards/HR/RejectedMembers/{user}', [CreateMemberController::class, 'resubmit'])->middleware('role:hr')->name('hr.rejected-members.update');

    Route::get('dashboards/HR/HRActiveLoan', [HrDashboardController::class, 'activeLoans'])
        ->middleware('role:hr')
        ->name('hr.active-loan');

    Route::get('dashboards/HR/HRCompletedLoan', [HrDashboardController::class, 'completedLoans'])
        ->middleware('role:hr')
        ->name('hr.completed-loan');

    Route::get('dashboards/HR/active-loans/{loan}/view', [HrDashboardController::class, 'viewActiveLoan'])
        ->middleware('role:hr')
        ->name('hr.active-loan.view');

    Route::get('dashboards/HR/completed-loans/{loan}/view', [HrDashboardController::class, 'viewActiveLoan'])
        ->middleware('role:hr')
        ->name('hr.completed-loan.view');

    // Member - Loan Routes
    Route::get('dashboards/Member/ApplyLoan', [LoanController::class, 'create'])
        ->middleware(['role:member', 'ensure.profile.completed'])
        ->name('member.apply-loan');

    Route::get('dashboards/Member/PendingApplication', [LoanController::class, 'pendingApplication'])
        ->middleware(['role:member', 'ensure.profile.completed'])
        ->name('member.pending-application');

    Route::post('dashboards/Member/ApplyLoan', [LoanController::class, 'store'])
        ->middleware(['role:member', 'ensure.profile.completed', 'throttle:loan-application'])
        ->name('member.loan.store');

    Route::post('dashboards/Member/ApplyLoan/preview', [LoanController::class, 'preview'])
        ->middleware(['role:member', 'ensure.profile.completed'])
        ->name('member.loan.preview');

    Route::put('dashboards/Member/Loan/{loan}', [LoanController::class, 'update'])
        ->middleware(['role:member', 'ensure.profile.completed'])
        ->name('member.loan.update');

    Route::get('dashboards/Member/Loan/{loan}/edit', [LoanController::class, 'edit'])
        ->middleware(['role:member', 'ensure.profile.completed'])
        ->name('member.loan.edit');

    Route::get('dashboards/Member/UserProfile', [MemberProfileController::class, 'show'])->middleware('role:member')->name('member.user-profile');
    Route::post('dashboards/Member/UserProfile', [MemberProfileController::class, 'store'])->middleware('role:member')->name('member.user-profile.store');

    // HR - Edit Member Profile
    Route::get('dashboards/HR/EditMember/{membersId}', [MemberProfileController::class, 'editMember'])
        ->middleware('role:hr,gm,creditcom')
        ->name('hr.edit-member');

    Route::put('dashboards/HR/EditMember/{membersId}', [MemberProfileController::class, 'updateMember'])
        ->middleware('role:hr,gm,creditcom')
        ->name('hr.update-member');

    Route::get('dashboards/Member/ShowActiveLoans', [MemberController::class, 'showActiveLoans'])
        ->middleware(['role:member', 'ensure.profile.completed'])
        ->name('member.show-active-loans');

    Route::get('dashboards/Member/MemberActiveLoan', [MemberController::class, 'activeLoans'])
        ->middleware(['role:member', 'ensure.profile.completed'])
        ->name('member.active-loan');

    Route::post('dashboards/Member/active-loans/{loan}/settlement-request', [LoanSettlementRequestController::class, 'store'])
        ->middleware(['role:member', 'ensure.profile.completed'])
        ->name('member.loan-settlement-requests.store');

    Route::get('dashboards/Member/MemberCompletedLoan', [MemberController::class, 'completedLoans'])
        ->middleware(['role:member', 'ensure.profile.completed'])
        ->name('member.completed-loan');

    Route::get('dashboards/Member/active-loans/{loan}/view', [MemberController::class, 'viewActiveLoan'])
        ->middleware(['role:member', 'ensure.profile.completed'])
        ->name('member.active-loan.view');

    // Member - Completed loan details (reuse ViewActiveLoan UI)
    Route::get('dashboards/Member/completed-loans/{loan}/view', [MemberController::class, 'viewActiveLoan'])
        ->middleware(['role:member', 'ensure.profile.completed'])
        ->name('member.completed-loan.view');

    Route::get('dashboards/Member/CoMaker', [LoanController::class, 'comakerRequests'])
        ->middleware(['role:member', 'ensure.profile.completed'])
        ->name('member.co-maker');

    Route::post('dashboards/Member/CoMaker/Respond', [LoanController::class, 'respondToCoMakerRequest'])
        ->middleware(['role:member', 'ensure.profile.completed'])
        ->name('member.comaker.respond');

    Route::get('dashboards/Member/CoMaker/Count', [LoanController::class, 'comakerRequestCount'])
        ->middleware(['role:member', 'ensure.profile.completed'])
        ->name('member.comaker.count');

    Route::get('dashboards/Member/ChooseComaker', [LoanController::class, 'chooseComaker'])
        ->middleware(['role:member', 'ensure.profile.completed'])
        ->name('member.choose-comaker');

    Route::get('dashboards/Member/Notification', [DashBoardController::class, 'memberNotifications'])
        ->middleware('role:member')
        ->name('member.notifications');

    Route::post('dashboards/Member/Notification/mark-read', [DashBoardController::class, 'markNotificationsAsRead'])
        ->middleware('role:member')
        ->name('dashboards.member.notifications.mark-read');

    // GM
    Route::get('dashboards/Gm/ValidateLoan', [GmController::class, 'index'])
        ->middleware('role:gm')
        ->name('gm.validate-loan');

    // API Routes (since no api.php)
    Route::get('/api/salary-deductions/export', [\App\Http\Controllers\Payroll\PayrollDeductionController::class, 'exportSalaryDeductions'])
        ->middleware(['auth', 'role:gm'])
        ->name('api.salary-deductions.export');

    Route::get('/api/members/search', [MemberController::class, 'search'])
        ->middleware('auth')
        ->name('api.members.search');

    Route::get('/api/members/{memberId}/eligible', [MemberController::class, 'checkEligibility'])
        ->middleware('auth')
        ->name('api.members.eligible');

    Route::get('/api/loans/co-maker', [LoanController::class, 'comakerLoans'])
        ->middleware(['auth', 'role:member'])
        ->name('api.loans.co-maker');

    Route::get('/api/admin/activity-logs', [AdminActivityLogController::class, 'index'])
        ->middleware('role:gm,hr,creditcom')
        ->name('api.admin.activity-logs.index');

    Route::post('/api/admin/loan-applications', [GmController::class, 'storeApplicationApi'])
        ->middleware(['auth', 'role:gm'])
        ->name('api.admin.loans.store');

    Route::get('dashboards/Gm/LoanApplication', [GmController::class, 'loanApplication'])
        ->middleware('role:gm')
        ->name('gm.loan-application');

    Route::get('dashboards/Gm/Loan/{loan}/view', [GmController::class, 'viewLoan'])
        ->middleware('role:gm')
        ->name('gm.loan.view');

    Route::post('dashboards/Gm/Loan/{loan}/approve', [GmController::class, 'approve'])
        ->middleware('role:gm')
        ->name('gm.loan.approve');

    Route::post('dashboards/Gm/Loan/{loan}/reject', [GmController::class, 'reject'])
        ->middleware('role:gm')
        ->name('gm.loan.reject');

    Route::get('dashboards/Gm/Loan/PendingCount', [GmController::class, 'pendingCount'])
        ->middleware('role:gm')
        ->name('gm.pending-count');

    Route::get('dashboards/Gm/GMActiveLoan', [GmDashboardController::class, 'activeLoans'])
        ->middleware('role:gm')
        ->name('gm.active-loan');

    Route::get('dashboards/Gm/SettlementRequests', [LoanSettlementRequestController::class, 'index'])
        ->middleware('role:gm')
        ->name('gm.loan-settlement-requests.index');

    Route::post('dashboards/Gm/SettlementRequests/{settlementRequest}/approve', [LoanSettlementRequestController::class, 'approve'])
        ->middleware('role:gm')
        ->name('gm.loan-settlement-requests.approve');

    Route::post('dashboards/Gm/SettlementRequests/{settlementRequest}/reject', [LoanSettlementRequestController::class, 'reject'])
        ->middleware('role:gm')
        ->name('gm.loan-settlement-requests.reject');

    Route::post('dashboards/Gm/SettlementRequests/{settlementRequest}/verify-payment', [LoanSettlementRequestController::class, 'verifyPayment'])
        ->middleware('role:gm')
        ->name('gm.loan-settlement-requests.verify-payment');

    Route::get('dashboards/Gm/GMCompletedLoan', [GmDashboardController::class, 'completedLoans'])
        ->middleware('role:gm')
        ->name('gm.completed-loan');

    Route::get('dashboards/Gm/active-loans/{loan}/view', [GmDashboardController::class, 'viewActiveLoan'])
        ->middleware('role:gm')
        ->name('gm.active-loan.view');

    // GM - Completed loan details (reuse ViewActiveLoan UI)
    Route::get('dashboards/Gm/completed-loans/{loan}/view', [GmDashboardController::class, 'viewActiveLoan'])
        ->middleware('role:gm')
        ->name('gm.completed-loan.view');

    Route::get('dashboards/Gm/ApprovedLoan', [GmDashboardController::class, 'approvedLoans'])
        ->middleware('role:gm')
        ->name('gm.approved-loan');

    Route::get('dashboards/Gm/ActivityLog', [AdminActivityLogController::class, 'gm'])
        ->middleware('role:gm')
        ->name('gm.activity-log');

    Route::get('dashboards/Gm/UploadSalaryDeduct', [PayrollDeductionController::class, 'index'])
        ->middleware('role:gm')
        ->name('gm.payroll-deductions');

    Route::post('dashboards/Gm/UploadSalaryDeduct', [PayrollDeductionController::class, 'store'])
        ->middleware('role:gm')
        ->name('gm.payroll-deductions.store');

    Route::post('dashboards/Gm/UploadSalaryDeduct/start-maintenance', [PayrollDeductionController::class, 'startPayrollMaintenance'])
        ->middleware('role:gm')
        ->name('gm.payroll-deductions.start-maintenance');

    Route::post('dashboards/Gm/UploadSalaryDeduct/stop-maintenance', [PayrollDeductionController::class, 'stopPayrollMaintenance'])
        ->middleware('role:gm')
        ->name('gm.payroll-deductions.stop-maintenance');

    Route::post('dashboards/Gm/UploadSalaryDeduct/manual-payment', [PayrollDeductionController::class, 'manualPayment'])

        ->middleware('role:gm')
        ->name('gm.payroll-deductions.manual-payment');

    Route::get('dashboards/Gm/UploadSalaryDeduct/template', [PayrollDeductionController::class, 'template'])
        ->middleware('role:gm')
        ->name('gm.payroll-deductions.template');

    // GM - Profile Update Requests (Maker-Checker)
    Route::get('dashboards/Gm/PendingEdits', [\App\Http\Controllers\GmController\ProfileUpdateRequestController::class, 'index'])
        ->middleware('role:gm')
        ->name('gm.pending-edits');

    // HR - Submit Profile Update Request
    Route::post('dashboards/HR/EditMember/{membersId}/update-request', [\App\Http\Controllers\GmController\ProfileUpdateRequestController::class, 'store'])
        ->middleware('role:hr')
        ->name('hr.profile-update-request.store');

    Route::post('dashboards/HR/Members/{membersId}/status-change-request', [\App\Http\Controllers\GmController\ProfileUpdateRequestController::class, 'requestStatusChange'])
        ->middleware('role:hr')
        ->name('hr.member-status-change-request.store');

    // API-like routes for GM actions on pending edits
    Route::post('dashboards/Gm/PendingEdits/{id}/approve', [\App\Http\Controllers\GmController\ProfileUpdateRequestController::class, 'approve'])
        ->middleware('role:gm')
        ->name('gm.pending-edits.approve');

    Route::post('dashboards/Gm/PendingEdits/{id}/reject', [\App\Http\Controllers\GmController\ProfileUpdateRequestController::class, 'reject'])
        ->middleware('role:gm')
        ->name('gm.pending-edits.reject');

    // GM - Create Application (NEW)
    Route::get('dashboards/Gm/CreateApplication', [GmController::class, 'createApplication'])
        ->middleware('role:gm')
        ->name('gm.create-application');

    Route::post('dashboards/Gm/CreateApplication', [GmController::class, 'storeApplication'])
        ->middleware('role:gm')
        ->name('gm.create-application.store');

    // GM - Member Validation
    Route::get('dashboards/Gm/MemberValidate', [GmController::class, 'pendingMembers'])
        ->middleware('role:gm')
        ->name('gm.pending-members');

    Route::post('dashboards/Gm/Member/{user}/approve', [GmController::class, 'approveMember'])
        ->middleware('role:gm')
        ->name('gm.member.approve');

    Route::post('dashboards/Gm/Member/{user}/reject', [GmController::class, 'rejectMember'])
        ->middleware('role:gm')
        ->name('gm.member.reject');

    // GM - Bulk Member Upload
    Route::get('dashboards/Gm/BulkUploadMembers', [BulkMemberUploadController::class, 'index'])
        ->middleware('role:gm')
        ->name('gm.bulk-upload-members');

    Route::post('dashboards/Gm/BulkUploadMembers', [BulkMemberUploadController::class, 'store'])
        ->middleware('role:gm')
        ->name('gm.bulk-upload-members.store');

    Route::get('dashboards/Gm/BulkUploadMembers/template', [BulkMemberUploadController::class, 'template'])
        ->middleware('role:gm')
        ->name('gm.bulk-upload-members.template');

    Route::get('dashboards/HR/SecActivityLog', [AdminActivityLogController::class, 'hr'])
        ->middleware('role:hr')
        ->name('hr.activity-log');

    // Credit Coordinator
    Route::get('dashboards/CreditCom/ActivityLog', [AdminActivityLogController::class, 'creditCom'])
        ->middleware('role:creditcom')
        ->name('creditcom.activity-log');

    Route::get('dashboards/CreditCom/ValidateLoan', [CreditComController::class, 'index'])
        ->middleware('role:creditcom')
        ->name('creditcom.validate-loan');

    Route::get('dashboards/CreditCom/LoanApplication', [CreditComController::class, 'loanApplication'])
        ->middleware('role:creditcom')
        ->name('creditcom.loan-application');

    Route::get('dashboards/CreditCom/Loan/{loan}/view', [CreditComController::class, 'viewLoan'])
        ->middleware('role:creditcom')
        ->name('creditcom.loan.view');

    Route::post('dashboards/CreditCom/Loan/{loan}/approve', [CreditComController::class, 'approve'])
        ->middleware('role:creditcom')
        ->name('creditcom.loan.approve');

    Route::post('dashboards/CreditCom/Loan/{loan}/reject', [CreditComController::class, 'reject'])
        ->middleware('role:creditcom')
        ->name('creditcom.loan.reject');

    Route::get('dashboards/CreditCom/Loan/PendingCount', [CreditComController::class, 'pendingCount'])
        ->middleware('role:creditcom')
        ->name('creditcom.pending-count');

    Route::get('dashboards/CreditCom/ApprovedHistory', [CreditComDashboardController::class, 'approvedHistory'])
        ->middleware('role:creditcom')
        ->name('creditcom.approved-history');

    // GM - View Loan Decision History
    Route::get('dashboards/Gm/Loan/{loan}/viewDecision', [GmDashboardController::class, 'viewDecision'])
        ->middleware('role:gm')
        ->name('gm.loan.viewDecision');

    // GM - Activate loan (approved -> active)
    Route::post('dashboards/Gm/Loan/{loan}/activate', [GmDashboardController::class, 'activateLoan'])
        ->middleware('role:gm')
        ->name('gm.loan.activate');

    // CreditCom - View Loan Decision History
    Route::get('dashboards/CreditCom/Loan/{loan}/viewDecision', [CreditComDashboardController::class, 'viewDecision'])
        ->middleware('role:creditcom')
        ->name('creditcom.loan.viewDecision');
});

require __DIR__.'/settings.php';
