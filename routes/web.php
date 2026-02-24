<?php

use App\Http\Controllers\HrController\CreateMemberController;
use App\Http\Controllers\HrController\MemberProfileViewController;
use App\Http\Controllers\Member\LoanController;
use App\Http\Controllers\Member\MemberProfileController;
use App\Models\LoanType;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;

Route::get('/', function () {
    return Inertia::render('welcome', [
        'canRegister' => Features::enabled(Features::registration()),
    ]);
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', function () {
        $roleComponents = [
            'member' => 'dashboards/Member/MemberDashboard',
            'gm' => 'dashboards/Gm/GmDashboard',
            'secretary' => 'dashboards/Secretary/SecretaryDashboard',
            'hr' => 'dashboards/HR/HrDashboard',
            'chairman' => 'dashboards/ChairMan/ChairManDashboard',
        ];

        $role = auth()->user()->role;

        if (!array_key_exists($role, $roleComponents)) {
            abort(403, 'Unauthorized role.');
        }

        return Inertia::render($roleComponents[$role]);
    })->name('dashboard')->middleware('ensure.profile.completed');

    // HR
    Route::get('dashboards/HR/SeeUsers', [CreateMemberController::class, 'index'])->middleware('role:hr')->name('users');

    Route::get('dashboards/HR/MembersProfile/{userId}', [MemberProfileViewController::class, 'show'])->middleware('role:hr')->name('users.profile');

    Route::get('dashboards/HR/create', [CreateMemberController::class, 'create'])->middleware('role:hr')->name('users.create');
    Route::post('dashboards/HR/SeeUsers', [CreateMemberController::class, 'store'])->middleware('role:hr')->name('users.store');

    Route::get('dashboards/HR/dashboard', function () {
        return Inertia::render('dashboards/HR/HrDashboard');
    })->middleware('role:hr')->name('hr.dashboard');

    Route::get('dashboards/HR/HRActiveLoan', function () {
        return Inertia::render('dashboards/HR/HRActiveLoan');
    })->middleware('role:hr')->name('hr.active-loan');

    Route::get('dashboards/HR/HRCompletedLoan', function () {
        return Inertia::render('dashboards/HR/HRCompletedLoan');
    })->middleware('role:hr')->name('hr.completed-loan');


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

    Route::get('dashboards/Member/UserProfile', [MemberProfileController::class, 'show'])->middleware('role:member')->name('member.user-profile');
    Route::post('dashboards/Member/UserProfile', [MemberProfileController::class, 'store'])->middleware('role:member')->name('member.user-profile.store');

Route::get('dashboards/Member/MemberActiveLoan', function () {
        return Inertia::render('dashboards/Member/MemberActiveLoan');
    })->middleware(['role:member', 'ensure.profile.completed'])->name('member.active-loan');

    Route::get('dashboards/Member/MemberCompletedLoan', function () {
        return Inertia::render('dashboards/Member/MemberCompletedLoan');
    })->middleware(['role:member', 'ensure.profile.completed'])->name('member.completed-loan');

    Route::get('dashboards/Member/CoMaker', function () {
    return Inertia::render('dashboards/Member/CoMaker');
    })->middleware(['role:member', 'ensure.profile.completed'])->name('member.co-maker');



    // Secretary
    Route::get('dashboards/Secretary/VerifyMemberProfile', function () {
        return Inertia::render('dashboards/Secretary/VerifyMemberProfile');
    })->middleware('role:secretary')->name('secretary.verify-member-profile');


    // GM
    Route::get('dashboards/Gm/ValidateLoan', function () {
        return Inertia::render('dashboards/Gm/ValidateLoan');
    })->middleware('role:gm')->name('gm.validate-loan');

    Route::get('dashboards/Gm/GMActiveLoan', function () {
        return Inertia::render('dashboards/Gm/GMActiveLoan');
    })->middleware('role:gm')->name('gm.active-loan');

    Route::get('dashboards/Gm/GMCompletedLoan', function () {
        return Inertia::render('dashboards/Gm/GMCompletedLoan');
    })->middleware('role:gm')->name('gm.completed-loan');

    // Chairman


});

require __DIR__.'/settings.php';
