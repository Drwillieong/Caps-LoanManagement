<?php

use App\Http\Controllers\GmController\GmController;
use App\Http\Controllers\CreditComController\CreditComController;
use App\Http\Controllers\HrController\CreateMemberController;
use App\Http\Controllers\HrController\MemberProfileViewController;
use App\Http\Controllers\Member\LoanController;
use App\Http\Controllers\Member\MemberProfileController;
use App\Models\Loan;
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
            'hr' => 'dashboards/HR/HrDashboard',
            'creditcom' => 'dashboards/CreditCom/CreditComDashboard',
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

            // Check if user has a pending loan application
            $hasPendingLoan = \App\Models\Loan::where('user_id', $user->id)
                ->whereIn('status', ['pending', 'pending_gm_review', 'pending_cc_review', 'awaiting_comaker'])
                ->exists();

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
                'has_pending_loan' => $hasPendingLoan,
                'loan_progress' => $loanProgress,
                // Loan Eligibility Data
                'loan_eligibility' => [
                    'max_loan_allowed' => ($memberProfile?->share_capital_balance ?? 0) * 2,
                    'basic_salary' => $memberProfile?->basic_salary ?? 0,
                    'max_monthly_payment' => ($memberProfile?->basic_salary ?? 0) / 2,
                    'has_active_loan' => $activeLoanCount > 0,
                ],
                // Profile completion status
                'profileCompleted' => $user->hasCompletedProfile(),
            ];
        }
        
        // Get HR-specific data
        if ($role === 'hr') {
            // Get member counts
            $totalMembers = \App\Models\User::where('role', 'member')->count();
            $activeMembers = \App\Models\User::where('role', 'member')->where('is_active', true)->count();
            $inactiveMembers = \App\Models\User::where('role', 'member')->where('is_active', false)->count();
            
            // Get recent members (last 30 days)
            $recentMembers = \App\Models\User::where('role', 'member')
                ->where('created_at', '>=', now()->subDays(30))
                ->with('memberProfile')
                ->orderBy('created_at', 'desc')
                ->limit(5)
                ->get();
            
            // Get loan statistics
            $pendingLoans = \App\Models\Loan::where('status', 'pending')->count();
            $activeLoans = \App\Models\Loan::whereIn('status', ['released', 'approved'])->count();
            $completedLoans = \App\Models\Loan::where('status', 'paid_off')->count();
            
            // Get loan status breakdown
            $loanStatusBreakdown = [
                'pending' => \App\Models\Loan::where('status', 'pending')->count(),
                'approved' => \App\Models\Loan::where('status', 'approved')->count(),
                'released' => \App\Models\Loan::where('status', 'released')->count(),
                'paid_off' => \App\Models\Loan::where('status', 'paid_off')->count(),
                'rejected' => \App\Models\Loan::where('status', 'rejected')->count(),
            ];
            
            // Get total loan portfolio (active loans)
            $totalLoanPortfolio = \App\Models\Loan::whereIn('status', ['released', 'approved'])
                ->sum('total_amount_due');
            
            // Get total paid amount
            $totalPaidAmount = \App\Models\LoanPayment::sum('amount');
            
            // Get members with loans
            $membersWithLoans = \App\Models\Loan::whereIn('status', ['released', 'approved'])
                ->distinct('user_id')
                ->count('user_id');
            
            $memberData = [
                'stats' => [
                    'total_members' => $totalMembers,
                    'active_members' => $activeMembers,
                    'inactive_members' => $inactiveMembers,
                    'pending_loans' => $pendingLoans,
                    'active_loans' => $activeLoans,
                    'completed_loans' => $completedLoans,
                    'total_loan_portfolio' => $totalLoanPortfolio,
                    'total_paid_amount' => $totalPaidAmount,
                    'members_with_loans' => $membersWithLoans,
                ],
                'loan_status_breakdown' => $loanStatusBreakdown,
                'recent_members' => $recentMembers->map(function ($user) {
                    return [
                        'id' => $user->id,
                        'full_name' => $user->first_name . ($user->middle_name ? ' ' . $user->middle_name : '') . ' ' . $user->last_name,
                        'email' => $user->email,
                        'position' => $user->memberProfile?->position ?? 'N/A',
                        'date_hired' => $user->memberProfile?->date_hired?->format('Y-m-d'),
                        'created_at' => $user->created_at->format('Y-m-d'),
                    ];
                }),
            ];
        }

        // Get GM-specific data
        if ($role === 'gm') {
            // Get total loan portfolio (sum of active/released loans)
            $totalLoanPortfolio = \App\Models\Loan::whereIn('status', ['released', 'approved'])
                ->sum('total_amount_due');
            
            // Get active members count
            $activeMembers = \App\Models\User::where('role', 'member')->where('is_active', true)->count();
            
            // Get pending GM approvals count
            $pendingApprovals = \App\Models\Loan::where('status', 'pending_gm_review')->count();
            
            // Get recent pending GM review loans (latest 5)
            $recentPendingLoans = \App\Models\Loan::where('status', 'pending_gm_review')
                ->with(['user', 'loanType'])
                ->orderBy('created_at', 'desc')
                ->limit(5)
                ->get()
                ->map(function ($loan) {
                    return [
                        'id' => $loan->id,
                        'member_name' => $loan->user->first_name . ($loan->user->middle_name ? ' ' . $loan->user->middle_name : '') . ' ' . $loan->user->last_name,
                        'loan_type' => $loan->loanType->name ?? 'N/A',
                        'principal_amount' => $loan->principal_amount,
                        'total_amount_due' => $loan->total_amount_due,
                        'created_at' => $loan->created_at->format('Y-m-d'),
                    ];
                });
            
            // Calculate loan health metrics
            $totalLoans = \App\Models\Loan::whereIn('status', ['released', 'approved', 'paid_off'])->count();
            $completedLoans = \App\Models\Loan::where('status', 'paid_off')->count();
            $collectionRate = $totalLoans > 0 ? round(($completedLoans / $totalLoans) * 100) : 0;
            
            // Get total paid amount
            $totalPaidAmount = \App\Models\LoanPayment::sum('amount');
            
            // Get total amount due from active loans
            $totalAmountDue = \App\Models\Loan::whereIn('status', ['released', 'approved'])->sum('total_amount_due');
            
            // Calculate actual collection rate based on payments
            $actualCollectionRate = $totalAmountDue > 0 ? round(($totalPaidAmount / $totalAmountDue) * 100) : 0;
            
            // Get count of business loans over 100k
            $businessLoansOver100k = \App\Models\Loan::whereIn('status', ['pending', 'pending_gm_review'])
                ->whereHas('loanType', function ($query) {
                    $query->where('name', 'like', '%Business%');
                })
                ->where('principal_amount', '>', 100000)
                ->count();

            $memberData = [
                'stats' => [
                    'total_loan_portfolio' => $totalLoanPortfolio,
                    'active_members' => $activeMembers,
                    'pending_approvals' => $pendingApprovals,
                    'total_paid_amount' => $totalPaidAmount,
                    'total_amount_due' => $totalAmountDue,
                ],
                'recent_pending_loans' => $recentPendingLoans,
                'loan_health' => [
                    'collection_rate' => $actualCollectionRate,
                    'completed_loans' => $completedLoans,
                    'active_loans' => \App\Models\Loan::whereIn('status', ['released', 'approved'])->count(),
                ],
                'business_loans_over_100k' => $businessLoansOver100k,
            ];
        }

        // Get Credit Coordinator-specific data
        if ($role === 'creditcom') {
            // Get total loan portfolio (sum of active/released loans)
            $totalLoanPortfolio = \App\Models\Loan::whereIn('status', ['released', 'approved'])
                ->sum('total_amount_due');
            
            // Get active members count
            $activeMembers = \App\Models\User::where('role', 'member')->where('is_active', true)->count();
            
            // Get pending CC validations count (loans approved by GM awaiting CC review)
            $pendingValidations = \App\Models\Loan::where('status', 'pending_cc_review')->count();
            
            // Get recent pending CC review loans (latest 5)
            $recentPendingLoans = \App\Models\Loan::where('status', 'pending_cc_review')
                ->with(['user', 'loanType'])
                ->orderBy('created_at', 'desc')
                ->limit(5)
                ->get()
                ->map(function ($loan) {
                    return [
                        'id' => $loan->id,
                        'member_name' => $loan->user->first_name . ($loan->user->middle_name ? ' ' . $loan->user->middle_name : '') . ' ' . $loan->user->last_name,
                        'loan_type' => $loan->loanType->name ?? 'N/A',
                        'principal_amount' => $loan->principal_amount,
                        'total_amount_due' => $loan->total_amount_due,
                        'created_at' => $loan->created_at->format('Y-m-d'),
                    ];
                });
            
            // Calculate loan health metrics
            $totalLoans = \App\Models\Loan::whereIn('status', ['released', 'approved', 'paid_off'])->count();
            $completedLoans = \App\Models\Loan::where('status', 'paid_off')->count();
            
            // Get total paid amount
            $totalPaidAmount = \App\Models\LoanPayment::sum('amount');
            
            // Get total amount due from active loans
            $totalAmountDue = \App\Models\Loan::whereIn('status', ['released', 'approved'])->sum('total_amount_due');
            
            // Calculate actual collection rate based on payments
            $actualCollectionRate = $totalAmountDue > 0 ? round(($totalPaidAmount / $totalAmountDue) * 100) : 0;

            $memberData = [
                'stats' => [
                    'total_loan_portfolio' => $totalLoanPortfolio,
                    'active_members' => $activeMembers,
                    'pending_approvals' => $pendingValidations,
                    'total_paid_amount' => $totalPaidAmount,
                    'total_amount_due' => $totalAmountDue,
                ],
                'recent_pending_loans' => $recentPendingLoans,
                'loan_health' => [
                    'collection_rate' => $actualCollectionRate,
                    'completed_loans' => $completedLoans,
                    'active_loans' => \App\Models\Loan::whereIn('status', ['released', 'approved'])->count(),
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

    // HR - Edit Member Profile
    Route::get('dashboards/HR/EditMember/{userId}', [MemberProfileController::class, 'editMember'])
        ->middleware('role:hr,gm,creditcom')
        ->name('hr.edit-member');
    
    Route::put('dashboards/HR/EditMember/{userId}', [MemberProfileController::class, 'updateMember'])
        ->middleware('role:hr,gm,creditcom')
        ->name('hr.update-member');

    Route::get('dashboards/Member/MemberActiveLoan', function () {
        $user = auth()->user();
        
        // Get active loans (released or approved status)
        $activeLoans = Loan::where('user_id', $user->id)
            ->whereIn('status', ['released', 'approved'])
            ->with(['loanType', 'amortizations', 'payments'])
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($loan) {
                // Calculate total paid from payments
                $totalPaid = $loan->payments->sum('amount');
                
                // Calculate remaining balance
                $remainingBalance = max(0, $loan->total_amount_due - $totalPaid);
                
                // Calculate progress percentage
                $progressPercentage = $loan->total_amount_due > 0 
                    ? round(($totalPaid / $loan->total_amount_due) * 100, 1)
                    : 0;
                
                // Get paid amortizations count
                $paidAmortizations = $loan->amortizations->where('status', 'paid')->count();
                $totalAmortizations = $loan->amortizations->count();
                
                // Get next due amortization (first unpaid)
                $nextDueAmortization = $loan->amortizations
                    ->whereIn('status', ['pending', 'partial', 'overdue'])
                    ->sortBy('due_date')
                    ->first();
                
                // Determine payment status
                $paymentStatus = 'current';
                if ($nextDueAmortization) {
                    $dueDate = $nextDueAmortization->due_date;
                    $today = now()->startOfDay();
                    $daysUntilDue = $today->diffInDays($dueDate, false);
                    
                    if ($daysUntilDue < 0) {
                        $paymentStatus = 'overdue';
                    } elseif ($daysUntilDue <= 7) {
                        $paymentStatus = 'due_soon';
                    }
                } else {
                    $paymentStatus = 'paid_off';
                }
                
                return [
                    'id' => $loan->id,
                    'loan_type_name' => $loan->loanType->name ?? 'N/A',
                    'principal_amount' => $loan->principal_amount,
                    'terms_months' => $loan->terms_months,
                    'interest_amount' => $loan->interest_amount,
                    'total_amount_due' => $loan->total_amount_due,
                    'monthly_amortization' => $loan->monthly_amortization,
                    'voucher_number' => $loan->voucher_number,
                    'check_number' => $loan->check_number,
                    'release_date' => $loan->release_date?->format('Y-m-d'),
                    'status' => $loan->status,
                    'total_paid' => $totalPaid,
                    'remaining_balance' => $remainingBalance,
                    'progress_percentage' => $progressPercentage,
                    'paid_amortizations' => $paidAmortizations,
                    'total_amortizations' => $totalAmortizations,
                    'next_due_date' => $nextDueAmortization?->due_date?->format('Y-m-d'),
                    'next_due_amount' => $nextDueAmortization?->amount_due ?? 0,
                    'payment_status' => $paymentStatus,
                    'amortizations' => $loan->amortizations->map(function ($amortization) {
                        return [
                            'id' => $amortization->id,
                            'installment_number' => $amortization->installment_number,
                            'due_date' => $amortization->due_date?->format('Y-m-d'),
                            'amount_due' => $amortization->amount_due,
                            'amount_paid' => $amortization->amount_paid,
                            'status' => $amortization->status,
                        ];
                    })->sortBy('installment_number')->values(),
                    'payments' => $loan->payments->map(function ($payment) {
                        return [
                            'id' => $payment->id,
                            'amount' => $payment->amount,
                            'payment_date' => $payment->payment_date?->format('Y-m-d'),
                            'reference_number' => $payment->reference_number,
                            'paid_by' => $payment->paid_by,
                        ];
                    })->sortByDesc('payment_date')->values(),
                ];
            });
        
        // Calculate overall stats
        $totalLoanBalance = $activeLoans->sum('remaining_balance');
        $totalAmountPaid = $activeLoans->sum('total_paid');
        $hasActiveLoan = $activeLoans->isNotEmpty();
        
        return Inertia::render('dashboards/Member/MemberActiveLoan', [
            'activeLoans' => $activeLoans,
            'hasActiveLoan' => $hasActiveLoan,
            'totalLoanBalance' => $totalLoanBalance,
            'totalAmountPaid' => $totalAmountPaid,
        ]);
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

    Route::get('dashboards/Member/ChooseComaker', [LoanController::class, 'chooseComaker'])
        ->middleware(['role:member', 'ensure.profile.completed'])
        ->name('member.choose-comaker');



    // GM
    Route::get('dashboards/Gm/ValidateLoan', [GmController::class, 'index'])
        ->middleware('role:gm')
        ->name('gm.validate-loan');

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

    Route::get('dashboards/Gm/GMActiveLoan', function () {
        return Inertia::render('dashboards/Gm/GMActiveLoan');
    })->middleware('role:gm')->name('gm.active-loan');

    Route::get('dashboards/Gm/GMCompletedLoan', function () {
        return Inertia::render('dashboards/Gm/GMCompletedLoan');
    })->middleware('role:gm')->name('gm.completed-loan');

    Route::get('dashboards/Gm/ApprovedLoan', function () {
        // Get loans pending CC review (after GM approval) AND fully approved loans
        $pendingCCReviewLoans = Loan::whereIn('status', ['pending_cc_review', 'approved'])
            ->with(['user.memberProfile', 'loanType'])
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($loan) {
                $user = $loan->user;
                
                return [
                    'id' => $loan->id,
                    'loan_type_name' => $loan->loanType->name ?? 'N/A',
                    'principal_amount' => $loan->principal_amount,
                    'terms_months' => $loan->terms_months,
                    'interest_amount' => $loan->interest_amount,
                    'total_amount_due' => $loan->total_amount_due,
                    'monthly_amortization' => $loan->monthly_amortization,
                    'status' => $loan->status,
                    'created_at' => $loan->created_at->format('Y-m-d H:i:s'),
                    'release_date' => $loan->release_date?->format('Y-m-d'),
                    'remarks' => $loan->remarks,
                    'member' => [
                        'id' => $user->id,
                        'name' => trim($user->first_name . ($user->middle_name ? ' ' . $user->middle_name : '') . ' ' . $user->last_name),
                        'email' => $user->email,
                        'member_id' => 'MEM-' . str_pad($user->id, 4, '0', STR_PAD_LEFT),
                    ],
                ];
            });
        
        // Get loans rejected by GM
        $rejectedByGMLoans = Loan::where('status', 'rejected_by_gm')
            ->with(['user.memberProfile', 'loanType'])
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($loan) {
                $user = $loan->user;
                
                return [
                    'id' => $loan->id,
                    'loan_type_name' => $loan->loanType->name ?? 'N/A',
                    'principal_amount' => $loan->principal_amount,
                    'terms_months' => $loan->terms_months,
                    'interest_amount' => $loan->interest_amount,
                    'total_amount_due' => $loan->total_amount_due,
                    'monthly_amortization' => $loan->monthly_amortization,
                    'status' => $loan->status,
                    'created_at' => $loan->created_at->format('Y-m-d H:i:s'),
                    'release_date' => $loan->release_date?->format('Y-m-d'),
                    'remarks' => $loan->remarks,
                    'member' => [
                        'id' => $user->id,
                        'name' => trim($user->first_name . ($user->middle_name ? ' ' . $user->middle_name : '') . ' ' . $user->last_name),
                        'email' => $user->email,
                        'member_id' => 'MEM-' . str_pad($user->id, 4, '0', STR_PAD_LEFT),
                    ],
                ];
            });
        
        return Inertia::render('dashboards/Gm/ApprovedLoan', [
            'approvedLoans' => $pendingCCReviewLoans,
            'disapprovedLoans' => $rejectedByGMLoans,
        ]);
    })->middleware('role:gm')->name('gm.approved-loan');

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

    Route::get('dashboards/CreditCom/ApprovedHistory', function () {
        // Get loans approved by Credit Coordinator
        $approvedLoans = Loan::where('status', 'approved')
            ->with(['user.memberProfile', 'loanType'])
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($loan) {
                $user = $loan->user;
                
                return [
                    'id' => $loan->id,
                    'loan_type_name' => $loan->loanType->name ?? 'N/A',
                    'principal_amount' => $loan->principal_amount,
                    'terms_months' => $loan->terms_months,
                    'interest_amount' => $loan->interest_amount,
                    'total_amount_due' => $loan->total_amount_due,
                    'monthly_amortization' => $loan->monthly_amortization,
                    'status' => $loan->status,
                    'created_at' => $loan->created_at->format('Y-m-d H:i:s'),
                    'release_date' => $loan->release_date?->format('Y-m-d'),
                    'remarks' => $loan->remarks,
                    'member' => [
                        'id' => $user->id,
                        'name' => trim($user->first_name . ($user->middle_name ? ' ' . $user->middle_name : '') . ' ' . $user->last_name),
                        'email' => $user->email,
                        'member_id' => 'MEM-' . str_pad($user->id, 4, '0', STR_PAD_LEFT),
                    ],
                ];
            });
        
        // Get loans rejected by Credit Coordinator
        $disapprovedLoans = Loan::where('status', 'rejected_by_credit_com')
            ->with(['user.memberProfile', 'loanType'])
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($loan) {
                $user = $loan->user;
                
                return [
                    'id' => $loan->id,
                    'loan_type_name' => $loan->loanType->name ?? 'N/A',
                    'principal_amount' => $loan->principal_amount,
                    'terms_months' => $loan->terms_months,
                    'interest_amount' => $loan->interest_amount,
                    'total_amount_due' => $loan->total_amount_due,
                    'monthly_amortization' => $loan->monthly_amortization,
                    'status' => $loan->status,
                    'created_at' => $loan->created_at->format('Y-m-d H:i:s'),
                    'release_date' => $loan->release_date?->format('Y-m-d'),
                    'remarks' => $loan->remarks,
                    'member' => [
                        'id' => $user->id,
                        'name' => trim($user->first_name . ($user->middle_name ? ' ' . $user->middle_name : '') . ' ' . $user->last_name),
                        'email' => $user->email,
                        'member_id' => 'MEM-' . str_pad($user->id, 4, '0', STR_PAD_LEFT),
                    ],
                ];
            });
        
        return Inertia::render('dashboards/CreditCom/CrComApprovedHistory', [
            'approvedLoans' => $approvedLoans,
            'disapprovedLoans' => $disapprovedLoans,
        ]);
    })->middleware('role:creditcom')->name('creditcom.approved-history');

    // GM - View Loan Decision History
    Route::get('dashboards/Gm/Loan/{loan}/viewDecision', function ($loanId) {
        $loan = Loan::where('id', $loanId)
            ->with(['user.memberProfile', 'loanType', 'coMakers.user', 'amortizations', 'payments'])
            ->firstOrFail();
        
        $user = $loan->user;
        $memberProfile = $user->memberProfile;
        
        $pastLoans = Loan::where('user_id', $user->id)
            ->where('id', '!=', $loan->id)
            ->whereIn('status', ['approved', 'released', 'paid_off'])
            ->with('loanType')
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get()
            ->map(function ($pastLoan) {
                $totalPaid = \App\Models\LoanPayment::where('loan_id', $pastLoan->id)->sum('amount');
                $balance = $pastLoan->total_amount_due - $totalPaid;
                
                return [
                    'id' => $pastLoan->id,
                    'loan_type_name' => $pastLoan->loanType->name ?? 'N/A',
                    'principal_amount' => $pastLoan->principal_amount,
                    'total_amount_due' => $pastLoan->total_amount_due,
                    'balance' => max(0, $balance),
                    'status' => $pastLoan->status,
                    'release_date' => $pastLoan->release_date?->format('Y-m-d'),
                    'terms_months' => $pastLoan->terms_months,
                ];
            });
        
        $loanDetails = [
            'id' => $loan->id,
            'loan_type_name' => $loan->loanType->name ?? 'N/A',
            'principal_amount' => $loan->principal_amount,
            'terms_months' => $loan->terms_months,
            'interest_amount' => $loan->interest_amount,
            'total_amount_due' => $loan->total_amount_due,
            'monthly_amortization' => $loan->monthly_amortization,
            'status' => $loan->status,
            'created_at' => $loan->created_at->format('Y-m-d H:i:s'),
            'release_date' => $loan->release_date?->format('Y-m-d'),
            'remarks' => $loan->remarks,
            'member' => [
                'id' => $user->id,
                'name' => trim($user->first_name . ($user->middle_name ? ' ' . $user->middle_name : '') . ' ' . $user->last_name),
                'email' => $user->email,
                'member_id' => 'MEM-' . str_pad($user->id, 4, '0', STR_PAD_LEFT),
                'date_hired' => $memberProfile?->date_hired?->format('Y-m-d'),
                'basic_salary' => $memberProfile?->basic_salary ?? 0,
                'share_capital_balance' => $memberProfile?->share_capital_balance ?? 0,
            ],
            'co_makers' => $loan->coMakers->map(function ($coMaker) {
                $coMakerUser = $coMaker->user;
                return [
                    'id' => $coMakerUser->id,
                    'name' => trim($coMakerUser->first_name . ($coMakerUser->middle_name ? ' ' . $coMakerUser->middle_name : '') . ' ' . $coMakerUser->last_name),
                    'email' => $coMakerUser->email,
                    'status' => $coMaker->status,
                ];
            }),
            'past_loans' => $pastLoans,
            'active_loans_count' => Loan::where('user_id', $user->id)->whereIn('status', ['approved', 'released'])->count(),
        ];
        
        return Inertia::render('dashboards/Gm/GmViewLoanDecision', [
            'loan' => $loanDetails,
        ]);
    })->middleware('role:gm')->name('gm.loan.viewDecision');

    // CreditCom - View Loan Decision History
    Route::get('dashboards/CreditCom/Loan/{loan}/viewDecision', function ($loanId) {
        $loan = Loan::where('id', $loanId)
            ->with(['user.memberProfile', 'loanType', 'coMakers.user', 'amortizations', 'payments'])
            ->firstOrFail();
        
        $user = $loan->user;
        $memberProfile = $user->memberProfile;
        
        $pastLoans = Loan::where('user_id', $user->id)
            ->where('id', '!=', $loan->id)
            ->whereIn('status', ['approved', 'released', 'paid_off'])
            ->with('loanType')
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get()
            ->map(function ($pastLoan) {
                $totalPaid = \App\Models\LoanPayment::where('loan_id', $pastLoan->id)->sum('amount');
                $balance = $pastLoan->total_amount_due - $totalPaid;
                
                return [
                    'id' => $pastLoan->id,
                    'loan_type_name' => $pastLoan->loanType->name ?? 'N/A',
                    'principal_amount' => $pastLoan->principal_amount,
                    'total_amount_due' => $pastLoan->total_amount_due,
                    'balance' => max(0, $balance),
                    'status' => $pastLoan->status,
                    'release_date' => $pastLoan->release_date?->format('Y-m-d'),
                    'terms_months' => $pastLoan->terms_months,
                ];
            });
        
        $loanDetails = [
            'id' => $loan->id,
            'loan_type_name' => $loan->loanType->name ?? 'N/A',
            'principal_amount' => $loan->principal_amount,
            'terms_months' => $loan->terms_months,
            'interest_amount' => $loan->interest_amount,
            'total_amount_due' => $loan->total_amount_due,
            'monthly_amortization' => $loan->monthly_amortization,
            'status' => $loan->status,
            'created_at' => $loan->created_at->format('Y-m-d H:i:s'),
            'release_date' => $loan->release_date?->format('Y-m-d'),
            'remarks' => $loan->remarks,
            'member' => [
                'id' => $user->id,
                'name' => trim($user->first_name . ($user->middle_name ? ' ' . $user->middle_name : '') . ' ' . $user->last_name),
                'email' => $user->email,
                'member_id' => 'MEM-' . str_pad($user->id, 4, '0', STR_PAD_LEFT),
                'date_hired' => $memberProfile?->date_hired?->format('Y-m-d'),
                'basic_salary' => $memberProfile?->basic_salary ?? 0,
                'share_capital_balance' => $memberProfile?->share_capital_balance ?? 0,
            ],
            'co_makers' => $loan->coMakers->map(function ($coMaker) {
                $coMakerUser = $coMaker->user;
                return [
                    'id' => $coMakerUser->id,
                    'name' => trim($coMakerUser->first_name . ($coMakerUser->middle_name ? ' ' . $coMakerUser->middle_name : '') . ' ' . $coMakerUser->last_name),
                    'email' => $coMakerUser->email,
                    'status' => $coMaker->status,
                ];
            }),
            'past_loans' => $pastLoans,
            'active_loans_count' => Loan::where('user_id', $user->id)->whereIn('status', ['approved', 'released'])->count(),
        ];
        
        return Inertia::render('dashboards/CreditCom/ViewLoanDecision', [
            'loan' => $loanDetails,
        ]);
    })->middleware('role:creditcom')->name('creditcom.loan.viewDecision');

    // Chairman


});

require __DIR__.'/settings.php';