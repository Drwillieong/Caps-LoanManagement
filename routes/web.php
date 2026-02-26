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

        // Get member-specific data
        $memberData = [];
        if ($role === 'member') {
            $user = auth()->user();
            $memberProfile = $user->memberProfile;
            
            // Get active loans (released/approved status) with amortizations
            $activeLoans = \App\Models\Loan::where('user_id', $user->id)
                ->whereIn('status', ['released', 'approved'])
                ->with(['payments', 'amortizations' => function($query) {
                    $query->orderBy('due_date', 'asc');
                }])
                ->get();
            
            // Calculate total loan balance
            $loanBalance = $activeLoans->sum(function ($loan) {
                $totalPaid = $loan->payments->sum('amount');
                return $loan->total_amount_due - $totalPaid;
            });

            // Get active and completed loan counts
            $activeLoanCount = \App\Models\Loan::where('user_id', $user->id)
                ->whereIn('status', ['released', 'approved'])
                ->count();

            $completedLoanCount = \App\Models\Loan::where('user_id', $user->id)
                ->where('status', 'paid_off')
                ->count();

            // Get loan progress data for the most recent active loan
            $loanProgress = null;
            if ($activeLoans->isNotEmpty()) {
                $latestLoan = $activeLoans->first();
                $totalAmortizations = $latestLoan->amortizations->count();
                $paidAmortizations = $latestLoan->amortizations->where('status', 'paid')->count();
                
                // Get next due date (first unpaid amortization)
                $nextDueAmortization = $latestLoan->amortizations
                    ->where('status', 'unpaid')
                    ->sortBy('due_date')
                    ->first();

                // Determine payment status
                $paymentStatus = 'paid';
                if ($nextDueAmortization) {
                    $dueDate = $nextDueAmortization->due_date;
                    $today = now()->startOfDay();
                    $daysUntilDue = $today->diffInDays($dueDate, false);
                    
                    if ($daysUntilDue <= 7) {
                        $paymentStatus = 'due_soon'; // Orange - due within 7 days
                    } else {
                        $paymentStatus = 'upcoming'; // Green - upcoming (more than 7 days)
                    }
                } else {
                    $paymentStatus = 'paid'; // All paid
                }

                $loanProgress = [
                    'loan_id' => $latestLoan->id,
                    'loan_type' => $latestLoan->loanType->name ?? 'Loan',
                    'total_amount' => $latestLoan->total_amount_due,
                    'remaining_balance' => $loanBalance,
                    'total_months' => $latestLoan->terms_months,
                    'paid_months' => $paidAmortizations,
                    'next_due_date' => $nextDueAmortization?->due_date?->format('Y-m-d'),
                    'next_due_amount' => $nextDueAmortization?->amount_due ?? 0,
                    'payment_status' => $paymentStatus,
                ];
            }

            $memberData = [
                'share_capital_balance' => $memberProfile?->share_capital_balance ?? 0,
                'loan_balance' => $loanBalance,
                'active_loan_count' => $activeLoanCount,
                'completed_loan_count' => $completedLoanCount,
                'loan_progress' => $loanProgress,
                // Loan Eligibility Data
                'loan_eligibility' => [
                    'max_loan_allowed' => ($memberProfile?->share_capital_balance ?? 0) * 2,
                    'basic_salary' => $memberProfile?->basic_salary ?? 0,
                    'max_monthly_payment' => ($memberProfile?->basic_salary ?? 0) / 2,
                    'has_active_loan' => $activeLoanCount > 0,
                ],
            ];
        }

        return Inertia::render($roleComponents[$role], $memberData);
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

    Route::put('dashboards/Member/Loan/{loan}', [LoanController::class, 'update'])
        ->middleware(['role:member', 'ensure.profile.completed'])
        ->name('member.loan.update');

    Route::get('dashboards/Member/Loan/{loan}/edit', [LoanController::class, 'edit'])
        ->middleware(['role:member', 'ensure.profile.completed'])
        ->name('member.loan.edit');

    Route::get('dashboards/Member/UserProfile', [MemberProfileController::class, 'show'])->middleware('role:member')->name('member.user-profile');
    Route::post('dashboards/Member/UserProfile', [MemberProfileController::class, 'store'])->middleware('role:member')->name('member.user-profile.store');

Route::get('dashboards/Member/MemberActiveLoan', function () {
        return Inertia::render('dashboards/Member/MemberActiveLoan');
    })->middleware(['role:member', 'ensure.profile.completed'])->name('member.active-loan');

    Route::get('dashboards/Member/MemberCompletedLoan', function () {
        return Inertia::render('dashboards/Member/MemberCompletedLoan');
    })->middleware(['role:member', 'ensure.profile.completed'])->name('member.completed-loan');

    Route::get('dashboards/Member/CoMaker', [LoanController::class, 'comakerRequests'])
        ->middleware(['role:member', 'ensure.profile.completed'])
        ->name('member.co-maker');

    Route::post('dashboards/Member/CoMaker/Respond', [LoanController::class, 'respondToCoMakerRequest'])
        ->middleware(['role:member', 'ensure.profile.completed'])
        ->name('member.comaker.respond');

    Route::get('dashboards/Member/CoMaker/Count', [LoanController::class, 'comakerRequestCount'])
        ->middleware(['role:member', 'ensure.profile.completed'])
        ->name('member.comaker.count');



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
