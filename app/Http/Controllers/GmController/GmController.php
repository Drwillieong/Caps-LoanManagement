<?php

namespace App\Http\Controllers\GmController;

use App\Http\Controllers\Controller;
use App\Models\Loan;
use App\Models\LoanAmortization;
use App\Models\LoanPayment;
use App\Models\User;
use App\Service\ApplyLoan\LoanEligibilityService;
use App\Services\ActivityLogService;
use App\Mail\SendMembersPass;
use App\Mail\MemberRejectedMail;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Inertia\Inertia;

class GmController extends Controller
{
    /**
     * Display list of loans pending GM validation
     */
    public function index()
    {
        // Get loans with status 'pending_gm_review'
        $pendingLoans = Loan::where('status', 'pending_gm_review')
            ->with([
                'user.memberProfile',
                'loanType',
                'coMakers.user',
            ])
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($loan) {
                $user = $loan->user;
                $memberProfile = $user->memberProfile;

                // Get past loans for this member (exclude rejected)
                $pastLoans = Loan::where('user_id', $user->id)
                    ->where('id', '!=', $loan->id)
                    ->whereIn('status', ['approved', 'released', 'paid_off'])
                    ->with('loanType')
                    ->orderBy('created_at', 'desc')
                    ->limit(10)
                    ->get()
                    ->map(function ($pastLoan) {
                        // Calculate balance for past loans
                        $totalPaid = LoanPayment::where('loan_id', $pastLoan->id)
                            ->sum('amount');

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

                // Calculate active loans count
                $activeLoansCount = Loan::where('user_id', $user->id)
                    ->whereIn('status', ['approved', 'released'])
                    ->count();

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
                    'member' => [
                        'id' => $user->id,
                        'name' => trim($user->first_name.($user->middle_name ? ' '.$user->middle_name : '').' '.$user->last_name),
                        'email' => $user->email,
                        'member_id' => 'MEM-'.str_pad($user->id, 4, '0', STR_PAD_LEFT),
                        'date_hired' => $memberProfile?->date_hired?->format('Y-m-d'),
                        'basic_salary' => $memberProfile?->basic_salary ?? 0,
                        'share_capital_balance' => $memberProfile?->share_capital_balance ?? 0,
                    ],
                    'co_makers' => $loan->coMakers->map(function ($coMaker) {
                        $coMakerUser = $coMaker->user;

                        return [
                            'id' => $coMakerUser->id,
                            'name' => trim($coMakerUser->first_name.($coMakerUser->middle_name ? ' '.$coMakerUser->middle_name : '').' '.$coMakerUser->last_name),
                            'email' => $coMakerUser->email,
                            'status' => $coMaker->status,
                        ];
                    }),
                    'past_loans' => $pastLoans,
                    'active_loans_count' => $activeLoansCount,
                ];
            });

        return Inertia::render('dashboards/Gm/ValidateLoan', [
            'pendingLoans' => $pendingLoans,
        ]);
    }

    /**
     * Approve a loan application
     */
    public function approve(Request $request, $loanId)
    {
        $validated = $request->validate([
            'remarks' => 'nullable|string|max:1000',
        ]);

        $loan = Loan::findOrFail($loanId);

        // Verify the loan is in pending_gm_review status
        if ($loan->status !== 'pending_gm_review') {
            return back()->with('error', 'This loan is not pending GM review.');
        }

        $notificationService = app(\App\Services\NotificationService::class);
        $borrower = $loan->user;

        $notificationService->createNotification(
            $borrower,
            'Loan Approved by GM',
            'Your loan application has been approved by General Manager'.($validated['remarks'] ? ': '.$validated['remarks'] : '.'),
            'loan_status',
            $loan->id,
            Loan::class
        );

        // Update loan status to pending_cc_review (Credit Coordinator Review)
        // Credit Coordinator will validate and then approve to generate amortization schedule
        $loan->update([
            'status' => 'pending_cc_review',
            'remarks' => $validated['remarks'] ?? 'Approved by GM, pending Credit Coordinator validation',
        ]);

        app(ActivityLogService::class)->logActivity(
            'loan_approved',
            $loan->id,
            'Approved loan #'.$loan->id.' for '.$borrower->name.' and forwarded it to Credit Coordinator.'
        );

        // Do NOT generate amortization schedule yet - Credit Coordinator will do that
        // after final approval

        return redirect()
            ->route('gm.validate-loan')
            ->with('success', 'Loan application approved and forwarded to Credit Coordinator.');
    }

    /**
     * Reject a loan application
     */
    public function reject(Request $request, $loanId)
    {
        $validated = $request->validate([
            'remarks' => 'required|string|max:1000',
        ]);

        $loan = Loan::findOrFail($loanId);

        // Verify the loan is in pending_gm_review status
        if ($loan->status !== 'pending_gm_review') {
            return back()->with('error', 'This loan is not pending GM review.');
        }

        $notificationService = app(\App\Services\NotificationService::class);
        $borrower = $loan->user;

        $notificationService->createNotification(
            $borrower,
            'Loan Rejected by GM',
            'Your loan application has been rejected by General Manager: '.$validated['remarks'],
            'loan_status',
            $loan->id,
            Loan::class
        );

        // Update loan status to rejected_by_gm
        $loan->update([
            'status' => 'rejected_by_gm',
            'remarks' => $validated['remarks'],
            'rejected_by' => 'gm',
            'rejected_at' => now(),
        ]);

        app(ActivityLogService::class)->logActivity(
            'loan_rejected',
            $loan->id,
            'Rejected loan #'.$loan->id.' for '.$borrower->name.'.',
            $validated['remarks']
        );

        return redirect()
            ->route('gm.validate-loan')
            ->with('success', 'Loan application rejected.');
    }

    /**
     * Generate amortization schedule for approved loan
     * Creates two payments per month (10th and 25th)
     */
    private function generateAmortizationSchedule(Loan $loan)
    {
        $monthlyPayment = $loan->monthly_amortization;
        $terms = $loan->terms_months;
        $startDate = now()->addMonth();

        // Calculate bi-monthly payment (half of monthly payment)
        $biMonthlyPayment = $monthlyPayment / 2;

        // Generate two installments per month (10th and 25th)
        $installmentNumber = 1;

        for ($month = 0; $month < $terms; $month++) {
            // First payment: 10th of each month
            $dueDate10 = $startDate->copy()->addMonths($month)->day(10);
            LoanAmortization::create([
                'loan_id' => $loan->id,
                'installment_number' => $installmentNumber++,
                'amount_due' => $biMonthlyPayment,
                'due_date' => $dueDate10,
                'status' => 'pending',
            ]);

            // Second payment: 25th of each month
            $dueDate25 = $startDate->copy()->addMonths($month)->day(25);
            LoanAmortization::create([
                'loan_id' => $loan->id,
                'installment_number' => $installmentNumber++,
                'amount_due' => $biMonthlyPayment,
                'due_date' => $dueDate25,
                'status' => 'pending',
            ]);
        }
    }

    /**
     * Get count of pending GM validations for dashboard
     */
    public function pendingCount()
    {
        $count = Loan::where('status', 'pending_gm_review')->count();

        return response()->json(['count' => $count]);
    }

    /**
     * Get all pending GM review loans for the loan application table
     */
    public function loanApplication()
    {
        // Get loans with status 'pending_gm_review'
        $pendingLoans = Loan::where('status', 'pending_gm_review')
            ->with([
                'user.memberProfile',
                'loanType',
                'coMakers.user',
            ])
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($loan) {
                $user = $loan->user;
                $memberProfile = $user->memberProfile;

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
                    'member' => [
                        'id' => $user->id,
                        'name' => trim($user->first_name.($user->middle_name ? ' '.$user->middle_name : '').' '.$user->last_name),
                        'email' => $user->email,
                        'member_id' => 'MEM-'.str_pad($user->id, 4, '0', STR_PAD_LEFT),
                        'date_hired' => $memberProfile?->date_hired?->format('Y-m-d'),
                        'basic_salary' => $memberProfile?->basic_salary ?? 0,
                        'share_capital_balance' => $memberProfile?->share_capital_balance ?? 0,
                    ],
                    'co_makers' => $loan->coMakers->map(function ($coMaker) {
                        $coMakerUser = $coMaker->user;

                        return [
                            'id' => $coMakerUser->id,
                            'name' => trim($coMakerUser->first_name.($coMakerUser->middle_name ? ' '.$coMakerUser->middle_name : '').' '.$coMakerUser->last_name),
                            'email' => $coMakerUser->email,
                            'status' => $coMaker->status,
                        ];
                    }),
                ];
            });

        return Inertia::render('dashboards/Gm/LoanApplication', [
            'pendingLoans' => $pendingLoans,
        ]);
    }

    /**
     * Get a single loan's full details for validation
     */
    public function viewLoan($loanId)
    {
        $loan = Loan::where('id', $loanId)
            ->where('status', 'pending_gm_review')
            ->with([
                'user.memberProfile',
                'loanType',
                'coMakers.user',
            ])
            ->firstOrFail();

        $user = $loan->user;
        $memberProfile = $user->memberProfile;

        // Get past loans for this member (exclude rejected)
        $pastLoans = Loan::where('user_id', $user->id)
            ->where('id', '!=', $loan->id)
            ->whereIn('status', ['approved', 'released', 'paid_off'])
            ->with('loanType')
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get()
            ->map(function ($pastLoan) {
                // Calculate balance for past loans
                $totalPaid = LoanPayment::where('loan_id', $pastLoan->id)
                    ->sum('amount');

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

        // Calculate active loans count
        $activeLoansCount = Loan::where('user_id', $user->id)
            ->whereIn('status', ['approved', 'released'])
            ->count();

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
            'member' => [
                'id' => $user->id,
                'name' => trim($user->first_name.($user->middle_name ? ' '.$user->middle_name : '').' '.$user->last_name),
                'email' => $user->email,
                'member_id' => 'MEM-'.str_pad($user->id, 4, '0', STR_PAD_LEFT),
                'date_hired' => $memberProfile?->date_hired?->format('Y-m-d'),
                'basic_salary' => $memberProfile?->basic_salary ?? 0,
                'share_capital_balance' => $memberProfile?->share_capital_balance ?? 0,
            ],
            'co_makers' => $loan->coMakers->map(function ($coMaker) {
                $coMakerUser = $coMaker->user;

                return [
                    'id' => $coMakerUser->id,
                    'name' => trim($coMakerUser->first_name.($coMakerUser->middle_name ? ' '.$coMakerUser->middle_name : '').' '.$coMakerUser->last_name),
                    'email' => $coMakerUser->email,
                    'status' => $coMaker->status,
                ];
            }),
            'past_loans' => $pastLoans,
            'active_loans_count' => $activeLoansCount,
        ];

        return Inertia::render('dashboards/Gm/ValidateLoan', [
            'pendingLoans' => [$loanDetails],
        ]);
    }

    /**
     * Create Application Page - Render form with loan types and co-makers
     */
    public function createApplication()
    {
        // SIMPLIFIED for testing - basic Inertia render first
        \Log::info('GM CreateApplication accessed by user: '.auth()->id());

        try {
            $loanTypes = \App\Models\LoanType::select('id', 'name', 'interest_rate_per_annum')->get();
            \Log::info('LoanTypes count: '.$loanTypes->count());
        } catch (\Exception $e) {
            \Log::error('LoanType query failed: '.$e->getMessage());
            $loanTypes = collect();
        }

        return Inertia::render('dashboards/Gm/CreateApplication', [
            'test' => 'GM CreateApplication LOADED SUCCESSFULLY!',
            'loanTypes' => $loanTypes,
            'eligibleCoMakers' => User::where('role', 'member')
                ->whereDoesntHave('coMakerLoans.loan', function ($q) {
                    $q->whereIn('status', ['approved', 'released']);
                })
                ->select('id', 'first_name', 'middle_name', 'last_name', 'email')
                ->get()
                ->map(function ($user) {
                    return [
                        'id' => $user->id,
                        'name' => trim($user->first_name.($user->middle_name ? ' '.$user->middle_name.' ' : ' ').$user->last_name),
                        'email' => $user->email,
                    ];
                })->toArray(),
        ]);
    }

    /**
     * Store Loan Application (Web POST)
     */
    public function storeApplication(Request $request)
    {
        $validated = $request->validate([
            'member_id' => 'required|exists:users,id',
            'loan_type_id' => 'required|exists:loan_types,id',
            'principal_amount' => 'required|numeric|min:1000',
            'terms_months' => 'required|integer|min:1|max:24',
            'co_maker_user_id' => 'nullable|exists:users,id|different:member_id',
        ]);

        $member = \App\Models\User::findOrFail($validated['member_id']);
        $loanType = \App\Models\LoanType::findOrFail($validated['loan_type_id']);
        $profile = $member->memberProfile;

        $hasPendingLoan = Loan::where('user_id', $member->id)
            ->whereIn('status', ['awaiting_comaker', 'pending_gm_review', 'pending_cc_review'])
            ->exists();

        if ($hasPendingLoan) {
            return back()->withErrors([
                'member_id' => 'This member already has a pending loan application.',
            ]);
        }

        // Basic eligibility check
        $maxLoan = $profile->share_capital_balance * 2;
        if ($validated['principal_amount'] > $maxLoan) {
            return back()->withErrors(['principal_amount' => 'Amount exceeds 2x share capital ('.number_format($maxLoan, 2).')']);
        }

        $eligibilityService = new LoanEligibilityService;
        $eligibilityService->check(
            $member,
            (float) $validated['principal_amount'],
            ! empty($validated['co_maker_user_id']) ? (int) $validated['co_maker_user_id'] : null,
            (int) $validated['loan_type_id'],
            (int) $validated['terms_months']
        );

        // Compute loan values
        $interest = ($validated['principal_amount'] * ($loanType->interest_rate_per_annum / 100)) * ($validated['terms_months'] / 12);
        $totalAmount = $validated['principal_amount'] + $interest;
        $monthlyAmort = $totalAmount / $validated['terms_months'];

        // Create loan
        $loan = \App\Models\Loan::create([
            'user_id' => $member->id,
            'loan_type_id' => $loanType->id,
            'principal_amount' => $validated['principal_amount'],
            'terms_months' => $validated['terms_months'],
            'interest_amount' => $interest,
            'total_amount_due' => $totalAmount,
            'monthly_amortization' => $monthlyAmort,
            'status' => 'pending_gm_review',
            'created_by_admin' => true,
            'created_by' => $request->user()->id,
        ]);

        // Co-maker
        if ($validated['co_maker_user_id']) {
            \App\Models\LoanCoMaker::create([
                'loan_id' => $loan->id,
                'user_id' => $validated['co_maker_user_id'],
                'status' => 'pending',
            ]);
        }

        // Notify
        $notificationService = app(\App\Services\NotificationService::class);
        $notificationService->createNotification(
            $member,
            'Admin Loan Application Created',
            'A loan application has been created for you by admin.',
            'loan_status',
            $loan->id,
            \App\Models\Loan::class
        );

        app(ActivityLogService::class)->logActivity(
            'loan_application_created',
            $loan->id,
            'Created loan application #'.$loan->id.' for '.$member->name.' with principal amount PHP '.number_format((float) $loan->principal_amount, 2).'.'
        );

        return redirect()->route('gm.loan-application')
            ->with('success', 'Loan application created successfully. Status: pending GM review.');
    }

    /**
     * Store Loan Application (API POST)
     */
    public function storeApplicationApi(Request $request)
    {
        $validated = $request->validate([
            'member_id' => 'required|exists:users,id',
            'loan_type_id' => 'required|exists:loan_types,id',
            'principal_amount' => 'required|numeric|min:1000',
            'terms_months' => 'required|integer|min:1|max:24',
            'co_maker_user_id' => 'nullable|exists:users,id|different:member_id',
        ]);

        // Reuse storeApplication logic (call internally or duplicate simplified)
        $member = \App\Models\User::findOrFail($validated['member_id']);
        $loanType = \App\Models\LoanType::findOrFail($validated['loan_type_id']);
        $profile = $member->memberProfile;

        $maxLoan = $profile->share_capital_balance * 2;
        if ($validated['principal_amount'] > $maxLoan) {
            return response()->json(['error' => 'Amount exceeds share capital limit'], 422);
        }

        // Full eligibility check using LoanEligibilityService
        $eligibilityService = new LoanEligibilityService;
        try {
            $eligibilityService->check(
                $member,
                $validated['principal_amount'],
                $validated['co_maker_user_id'] ?? null,
                $validated['loan_type_id'],
                $validated['terms_months']
            );
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 422);
        }

        $interest = ($validated['principal_amount'] * ($loanType->interest_rate_per_annum / 100)) * ($validated['terms_months'] / 12);
        $totalAmount = $validated['principal_amount'] + $interest;
        $monthlyAmort = $totalAmount / $validated['terms_months'];

        $loan = \App\Models\Loan::create([
            'user_id' => $member->id,
            'loan_type_id' => $loanType->id,
            'principal_amount' => $validated['principal_amount'],
            'terms_months' => $validated['terms_months'],
            'interest_amount' => $interest,
            'total_amount_due' => $totalAmount,
            'monthly_amortization' => $monthlyAmort,
            'status' => 'pending_gm_review',
            'created_by_admin' => true,
            'created_by' => $request->user()->id,
        ]);

        if ($validated['co_maker_user_id']) {
            \App\Models\LoanCoMaker::create([
                'loan_id' => $loan->id,
                'user_id' => $validated['co_maker_user_id'],
                'status' => 'pending',
            ]);
        }

        $notificationService = app(\App\Services\NotificationService::class);
        $notificationService->createNotification(
            $member,
            'Admin Loan Application Created',
            'Loan application created by admin.',
            'loan_status',
            $loan->id,
            \App\Models\Loan::class
        );

        app(ActivityLogService::class)->logActivity(
            'loan_application_created',
            $loan->id,
            'Created loan application #'.$loan->id.' for '.$member->name.' with principal amount PHP '.number_format((float) $loan->principal_amount, 2).'.'
        );

        return response()->json([
            'success' => true,
            'message' => 'Loan application created. Status: pending GM review.',
            'loan' => $loan->load('loanType', 'user.memberProfile'),
        ]);
    }

    // ======================================================================
    // GM Member Validation Methods
    // ======================================================================

    /**
     * Display members pending GM validation.
     */
    public function pendingMembers()
    {
        $pendingUsers = User::where('status', 'pending')
            ->where('role', 'member')
            ->with('memberProfile')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($user) {
                $profile = $user->memberProfile;
                return [
                    'id' => $user->id,
                    'first_name' => $user->first_name,
                    'middle_name' => $user->middle_name,
                    'last_name' => $user->last_name,
                    'name' => $user->name,
                    'email' => $user->email,
                    'status' => $user->status,
                    'created_at' => $user->created_at->format('Y-m-d H:i:s'),
                    'member_profile' => $profile ? [
                        'employee_id' => $profile->employee_id,
                        'payroll_id' => $profile->payroll_id,
                        'first_name' => $profile->first_name,
                        'middle_name' => $profile->middle_name,
                        'last_name' => $profile->last_name,
                        'place_of_birth' => $profile->place_of_birth,
                        'date_of_birth' => $profile->date_of_birth?->format('Y-m-d'),
                        'sex' => $profile->sex,
                        'civil_status' => $profile->civil_status,
                        'educational_attainment' => $profile->educational_attainment,
                        'position' => $profile->position,
                        'date_hired' => $profile->date_hired?->format('Y-m-d'),
                        'basic_salary' => $profile->basic_salary,
                        'income_type' => $profile->income_type,
                        'net_income' => $profile->net_income,
                        'share_capital_balance' => $profile->share_capital_balance,
                        'other_source_of_income' => $profile->other_source_of_income,
                        'facebook_account_name' => $profile->facebook_account_name,
                        'mobile_number' => $profile->mobile_number,
                        'permanent_mobile_number' => $profile->permanent_mobile_number,
                        'present_address' => $profile->present_address,
                        'present_zip_code' => $profile->present_zip_code,
                        'permanent_address' => $profile->permanent_address,
                        'permanent_zip_code' => $profile->permanent_zip_code,
                        'spouse_occupation' => $profile->spouse_occupation,
                        'spouse_gross_income' => $profile->spouse_gross_income,
                        'spouse_income_type' => $profile->spouse_income_type,
                        'spouse_net_income' => $profile->spouse_net_income,
                        'legal_beneficiary_1_name' => $profile->legal_beneficiary_1_name,
                        'real_properties_owned' => $profile->real_properties_owned,
                    ] : null,
                ];
            });

        return Inertia::render('dashboards/Gm/MemberValidate', [
            'pendingMembers' => $pendingUsers,
        ]);
    }

    /**
     * Approve a pending member — sends welcome email with credentials.
     */
    public function approveMember(Request $request, $userId)
    {
        $user = User::findOrFail($userId);

        if ($user->status !== 'pending') {
            return back()->with('error', 'This member is not in pending status.');
        }

        $temporaryPassword = $user->temporary_password;

        // Update user status to active
        $user->update([
            'status' => 'active',
            'is_active' => true,
        ]);

        // Send welcome email with the stored temporary password
        try {
            Mail::to($user->email)->send(new SendMembersPass(
                $user->email,
                $temporaryPassword,
                $user->name
            ));
        } catch (\Exception $e) {
            \Log::error('Failed to send welcome email on GM approval: '.$e->getMessage());
        }

        // Log activity
        app(ActivityLogService::class)->logActivity(
            'member_approved',
            null,
            'GM approved member registration for '.$user->name.' (ID #'.$user->id.'). Welcome email sent.'
        );

        // Notify the member
        $notificationService = app(\App\Services\NotificationService::class);
        $notificationService->createNotification(
            $user,
            'Membership Approved',
            'Your membership has been approved by the General Manager. You can now log in using the credentials sent to your email.',
            'system',
            $user->id,
            User::class
        );

        return redirect()
            ->route('gm.pending-members')
            ->with('success', 'Member approved successfully. Welcome email with credentials has been sent to '.$user->email.'.');
    }

    /**
     * Reject a pending member — notifies HR with rejection reason.
     */
    public function rejectMember(Request $request, $userId)
    {
        $validated = $request->validate([
            'rejection_reason' => 'required|string|max:2000',
        ]);

        $user = User::findOrFail($userId);

        if ($user->status !== 'pending') {
            return back()->with('error', 'This member is not in pending status.');
        }

        // Update user status to rejected
        $user->update([
            'status' => 'rejected',
            'rejection_reason' => $validated['rejection_reason'],
            'is_active' => false,
        ]);

        // Notify HR about the rejection
        $hrUsers = User::where('role', 'hr')->get();
        $notificationService = app(\App\Services\NotificationService::class);
        foreach ($hrUsers as $hr) {
            $notificationService->createNotification(
                $hr,
                'Member Registration Rejected',
                'The registration of '.$user->name.' ('.$user->email.') has been rejected by GM. Reason: '.$validated['rejection_reason'],
                'system',
                $user->id,
                User::class
            );
        }

        // Send email to HR about rejection
        try {
            $hrEmails = $hrUsers->pluck('email')->filter()->unique()->values()->toArray();
            if (! empty($hrEmails)) {
                Mail::send('emails.member-rejected', [
                    'memberName' => $user->name,
                    'memberEmail' => $user->email,
                    'rejectionReason' => $validated['rejection_reason'],
                    'hrName' => 'HR Team',
                ], function ($message) use ($hrEmails) {
                    $message->to($hrEmails[0])
                        ->subject('Member Registration Rejected — Action Required');
                    // Add CC for additional HR users if any
                    if (count($hrEmails) > 1) {
                        for ($i = 1; $i < count($hrEmails); $i++) {
                            $message->cc($hrEmails[$i]);
                        }
                    }
                });
            }
        } catch (\Exception $e) {
            \Log::error('Failed to send rejection email to HR: '.$e->getMessage());
        }

        // Log activity
        app(ActivityLogService::class)->logActivity(
            'member_rejected',
            null,
            'GM rejected member registration for '.$user->name.' (ID #'.$user->id.'). Reason: '.$validated['rejection_reason'],
            $validated['rejection_reason']
        );

        return redirect()
            ->route('gm.pending-members')
            ->with('success', 'Member registration rejected. HR has been notified.');
    }
}
