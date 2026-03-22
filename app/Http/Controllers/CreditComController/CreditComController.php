<?php

namespace App\Http\Controllers\CreditComController;

use App\Http\Controllers\Controller;
use App\Models\Loan;
use App\Models\LoanCoMaker;
use App\Models\LoanAmortization;
use App\Models\LoanPayment;
use App\Models\MemberProfile;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CreditComController extends Controller
{
    /**
     * Display list of loans pending Credit Coordinator validation
     */
    public function index()
    {
        // Get loans with status 'pending_cc_review' or 'endorsed_by_gm' (legacy status)
        $pendingLoans = Loan::whereIn('status', ['pending_cc_review', 'endorsed_by_gm'])
            ->with([
                'user.memberProfile',
                'loanType',
                'coMakers.user'
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
                    'active_loans_count' => $activeLoansCount,
                ];
            });

        return Inertia::render('dashboards/CreditCom/CrCoorValidateLoan', [
            'pendingLoans' => $pendingLoans,
        ]);
    }

    /**
     * Approve a loan application (Credit Coordinator final approval)
     */
    public function approve(Request $request, $loanId)
    {
        $validated = $request->validate([
            'remarks' => 'nullable|string|max:1000',
        ]);

        $loan = Loan::findOrFail($loanId);

        // Verify the loan is in pending_cc_review or endorsed_by_gm status
        if (!in_array($loan->status, ['pending_cc_review', 'endorsed_by_gm'])) {
            return back()->with('error', 'This loan is not pending Credit Coordinator review.');
        }

        $notificationService = app(\App\Services\NotificationService::class);
        $borrower = $loan->user;

        $notificationService->createNotification(
            $borrower,
            'Loan Approved by Credit Coordinator',
            'Your loan application has been fully approved' . ($validated['remarks'] ? ': ' . $validated['remarks'] : '.'),
            'loan_status',
            $loan->id,
            Loan::class
        );

        // Update loan status to approved
        $loan->update([
            'status' => 'approved',
            'remarks' => $validated['remarks'] ?? 'Approved by Credit Coordinator',
        ]);

        // Generate amortization schedule now that CC has approved
        $this->generateAmortizationSchedule($loan);

        return redirect()
            ->route('creditcom.validate-loan')
            ->with('success', 'Loan application approved successfully!');
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

        // Verify the loan is in pending_cc_review or endorsed_by_gm status
        if (!in_array($loan->status, ['pending_cc_review', 'endorsed_by_gm'])) {
            return back()->with('error', 'This loan is not pending Credit Coordinator review.');
        }

        $notificationService = app(\App\Services\NotificationService::class);
        $borrower = $loan->user;

        $notificationService->createNotification(
            $borrower,
            'Loan Rejected by Credit Coordinator',
            'Your loan application has been rejected by Credit Coordinator: ' . $validated['remarks'],
            'loan_status',
            $loan->id,
            Loan::class
        );

        // Update loan status to rejected_by_credit_com
        $loan->update([
            'status' => 'rejected_by_credit_com',
            'remarks' => $validated['remarks'],
            'rejected_by' => 'credit_com',
            'rejected_at' => now(),
        ]);

        return redirect()
            ->route('creditcom.validate-loan')
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
     * Get count of pending Credit Coordinator validations for dashboard
     */
    public function pendingCount()
    {
        $count = Loan::whereIn('status', ['pending_cc_review', 'endorsed_by_gm'])->count();

        return response()->json(['count' => $count]);
    }

    /**
     * Get all pending CC review loans for the loan application table
     */
    public function loanApplication()
    {
        // Get loans with status 'pending_cc_review' or 'endorsed_by_gm' (legacy status)
        $pendingLoans = Loan::whereIn('status', ['pending_cc_review', 'endorsed_by_gm'])
            ->with([
                'user.memberProfile',
                'loanType',
                'coMakers.user'
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
                ];
            });

        return Inertia::render('dashboards/CreditCom/CrCoorLoanApplication', [
            'pendingLoans' => $pendingLoans,
        ]);
    }

    /**
     * Get a single loan's full details for validation
     */
    public function viewLoan($loanId)
    {
        $loan = Loan::where('id', $loanId)
            ->whereIn('status', ['pending_cc_review', 'endorsed_by_gm'])
            ->with([
                'user.memberProfile',
                'loanType',
                'coMakers.user'
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
            'active_loans_count' => $activeLoansCount,
        ];

        return Inertia::render('dashboards/CreditCom/CrCoorValidateLoan', [
            'pendingLoans' => [$loanDetails],
        ]);
    }
}

