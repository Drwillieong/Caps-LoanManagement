<?php

use App\Http\Controllers\HrController\CreateMemberController;
use App\Http\Controllers\HrController\MemberProfileViewController;
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

Route::get('dashboards/HR/SeeUsers', [CreateMemberController::class, 'index'])->middleware('role:hr')->name('users');

    Route::get('dashboards/HR/MembersProfile/{userId}', [MemberProfileViewController::class, 'show'])->middleware('role:hr')->name('users.profile');

    Route::get('dashboards/HR/create', [CreateMemberController::class, 'create'])->middleware('role:hr')->name('users.create');
    Route::post('dashboards/HR/SeeUsers', [CreateMemberController::class, 'store'])->middleware('role:hr')->name('users.store');

    Route::get('dashboards/HR/dashboard', function () {
        return Inertia::render('dashboards/HR/HrDashboard');
    })->middleware('role:hr')->name('hr.dashboard');

Route::get('dashboards/Member/ApplyLoan', function () {
        return Inertia::render('dashboards/Member/ApplyLoan');
    })->middleware(['role:member', 'ensure.profile.completed'])->name('member.apply-loan');

    Route::get('dashboards/Member/UserProfile', [MemberProfileController::class, 'show'])->middleware('role:member')->name('member.user-profile');
    Route::post('dashboards/Member/UserProfile', [MemberProfileController::class, 'store'])->middleware('role:member')->name('member.user-profile.store');


});

require __DIR__.'/settings.php';
