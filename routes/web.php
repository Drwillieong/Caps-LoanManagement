<?php

use App\Http\Controllers\HrController\CreateMemberController;
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
            'hr' => 'dashboards/HR/SeeUsers',
            'chairman' => 'dashboards/ChairMan/ChairManDashboard',
        ];

        $role = auth()->user()->role;

        if (!array_key_exists($role, $roleComponents)) {
            abort(403, 'Unauthorized role.');
        }

        if ($role === 'hr') {
            return app(CreateMemberController::class)->index(request());
        }

        return Inertia::render($roleComponents[$role]);
    })->name('dashboard');

    Route::get('dashboards/HR/SeeUsers', [CreateMemberController::class, 'index'])->name('users');

    Route::get('/HR', [CreateMemberController::class, 'index'])->name('hr');

    Route::get('dashboards/HR/create', [CreateMemberController::class, 'create'])->name('users.create');
    Route::post('dashboards/HR/SeeUsers', [CreateMemberController::class, 'store'])->name('users.store');

});

require __DIR__.'/settings.php';
