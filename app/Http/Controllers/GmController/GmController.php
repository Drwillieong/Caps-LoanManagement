<?php

namespace App\Http\Controllers\GmController;

use App\Http\Controllers\Controller;
use App\Models\Loan;
use App\Models\LoanCoMaker;
use App\Models\LoanAmortization;
use App\Models\LoanPayment;
use App\Models\MemberProfile;
use App\Models\User;
use Illuminate\Http\Request;
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

        // Update loan status to pending_cc_review (Credit Coordinator Review)
        // Credit Coordinator will validate and then approve to generate amortization schedule
        $loan->update([
            'status' => 'pending_cc_review',
            'remarks' => $validated['remarks'] ?? 'Approved by GM, pending Credit Coordinator validation',
        ]);

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

        // Update loan status to rejected_by_gm
        $loan->update([
            'status' => 'rejected_by_gm',
            'remarks' => $validated['remarks'],
        ]);

        return redirect()
            ->route('gm.validate-loan')
            ->with('success', 'Loan application rejected.');
    }

    /**
     * Generate amortization schedule for approved loan
     */
    private function generateAmortizationSchedule(Loan $loan)
    {
        $monthlyPayment = $loan->monthly_amortization;
        $terms = $loan->terms_months;
        $startDate = now()->addMonth();

        for ($i = 1; $i <= $terms; $i++) {
            LoanAmortization::create([
                'loan_id' => $loan->id,
                'installment_number' => $i,
                'amount_due' => $monthlyPayment,
                'due_date' => $startDate->copy()->addMonths($i - 1),
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

        return Inertia::render('dashboards/Gm/ValidateLoan', [
            'pendingLoans' => [$loanDetails],
        ]);
    }
}
