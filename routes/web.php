<?php

use App\Http\Controllers\CreditComController\CreditComController;
use App\Http\Controllers\CreditComController\CreditComDashboardController;
use App\Http\Controllers\DashBoardController;
use App\Http\Controllers\GmController\GmController;
use App\Http\Controllers\GmController\GmDashboardController;
use App\Http\Controllers\HrController\HrDashboardController;
use App\Http\Controllers\HrController\CreateMemberController;
use App\Http\Controllers\HrController\MemberProfileViewController;
use App\Http\Controllers\Member\LoanController;
use App\Http\Controllers\Member\MemberController;
use App\Http\Controllers\Member\MemberProfileController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;

Route::get('/', function () {
    return Inertia::render('welcome', [
        'canRegister' => Features::enabled(Features::registration()),
    ]);
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', [DashBoardController::class, 'index'])
        ->name('dashboard')
        ->middleware('ensure.profile.completed');

    // HR
    Route::get('dashboards/HR/SeeUsers', [CreateMemberController::class, 'index'])->middleware('role:hr')->name('users');

    Route::get('dashboards/HR/MembersProfile/{userId}', [MemberProfileViewController::class, 'show'])->middleware('role:hr')->name('users.profile');

    Route::get('dashboards/HR/create', [CreateMemberController::class, 'create'])->middleware('role:hr')->name('users.create');
    Route::post('dashboards/HR/SeeUsers', [CreateMemberController::class, 'store'])->middleware('role:hr')->name('users.store');


    Route::get('dashboards/HR/HRActiveLoan', [HrDashboardController::class, 'activeLoans'])
        ->middleware('role:hr')
        ->name('hr.active-loan');

    Route::get('dashboards/HR/HRCompletedLoan', [HrDashboardController::class, 'completedLoans'])
        ->middleware('role:hr')
        ->name('hr.completed-loan');

    Route::get('dashboards/HR/active-loans/{loan}/view', [HrDashboardController::class, 'viewActiveLoan'])
        ->middleware('role:hr')
        ->name('hr.active-loan.view'); 


    // Member - Loan Routes
    Route::get('dashboards/Member/ApplyLoan', [LoanController::class, 'create'])
        ->middleware(['role:member', 'ensure.profile.completed'])
        ->name('member.apply-loan');

    Route::get('dashboards/Member/PendingApplication', [LoanController::class, 'pendingApplication'])
        ->middleware(['role:member', 'ensure.profile.completed'])
        ->name('member.pending-application');

    Route::post('dashboards/Member/ApplyLoan', [LoanController::class, 'store'])
        ->middleware(['role:member', 'ensure.profile.completed'])
        ->name('member.loan.store');

    Route::put('dashboards/Member/Loan/{loan}', [LoanController::class, 'update'])
        ->middleware(['role:member', 'ensure.profile.completed'])
        ->name('member.loan.update');

    Route::get('dashboards/Member/Loan/{loan}/edit', [LoanController::class, 'edit'])
        ->middleware(['role:member', 'ensure.profile.completed'])
        ->name('member.loan.edit');

    Route::get('dashboards/Member/UserProfile', [MemberProfileController::class, 'show'])->middleware('role:member')->name('member.user-profile');
    Route::post('dashboards/Member/UserProfile', [MemberProfileController::class, 'store'])->middleware('role:member')->name('member.user-profile.store');

    // HR - Edit Member Profile
    Route::get('dashboards/HR/EditMember/{userId}', [MemberProfileController::class, 'editMember'])
        ->middleware('role:hr,gm,creditcom')
        ->name('hr.edit-member');
    
    Route::put('dashboards/HR/EditMember/{userId}', [MemberProfileController::class, 'updateMember'])
        ->middleware('role:hr,gm,creditcom')
        ->name('hr.update-member');

    Route::get('dashboards/Member/MemberActiveLoan', [MemberController::class, 'activeLoans'])
        ->middleware(['role:member', 'ensure.profile.completed'])
        ->name('member.active-loan');

    Route::get('dashboards/Member/MemberCompletedLoan', [MemberController::class, 'completedLoans'])
        ->middleware(['role:member', 'ensure.profile.completed'])
        ->name('member.completed-loan');

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
    Route::get('/api/members/search', [MemberController::class, 'search'])
        ->middleware('auth')
        ->name('api.members.search');
    
    Route::get('/api/members/{memberId}/eligible', [MemberController::class, 'checkEligibility'])
        ->middleware('auth')
        ->name('api.members.eligible');

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

    Route::get('dashboards/Gm/GMCompletedLoan', [GmDashboardController::class, 'completedLoans'])
        ->middleware('role:gm')
        ->name('gm.completed-loan');

    Route::get('dashboards/Gm/active-loans/{loan}/view', [GmDashboardController::class, 'viewActiveLoan'])
        ->middleware('role:gm')
        ->name('gm.active-loan.view');

    Route::get('dashboards/Gm/ApprovedLoan', [GmDashboardController::class, 'approvedLoans'])
        ->middleware('role:gm')
        ->name('gm.approved-loan');

    Route::get('dashboards/Gm/ActivityLog', \App\Http\Controllers\GmController\ActivityLogController::class)
        ->middleware('role:gm')
        ->name('gm.activity-log');

    // GM - Create Application (NEW)
    Route::get('dashboards/Gm/CreateApplication', [GmController::class, 'createApplication'])
        ->middleware('role:gm')
        ->name('gm.create-application');

    Route::post('dashboards/Gm/CreateApplication', [GmController::class, 'storeApplication'])
        ->middleware('role:gm')
        ->name('gm.create-application.store');

    // Credit Coordinator
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

    // CreditCom - View Loan Decision History
    Route::get('dashboards/CreditCom/Loan/{loan}/viewDecision', [CreditComDashboardController::class, 'viewDecision'])
        ->middleware('role:creditcom')
        ->name('creditcom.loan.viewDecision');
});

require __DIR__.'/settings.php';