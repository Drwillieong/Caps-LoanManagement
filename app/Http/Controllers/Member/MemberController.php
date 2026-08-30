<?php

namespace App\Http\Controllers\Member;

use App\Http\Controllers\Controller;
use App\Models\Loan;
use App\Services\LoanSettlementService;
use App\Services\LoanService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class MemberController extends Controller
{
    use \App\Traits\HasNotificationCount;

    public function __construct(
        protected LoanService $loanService,
        protected LoanSettlementService $settlementService,
    ) {}

    /**
     * Display member's active loans list
     */
    public function showActiveLoans(Request $request)
    {
        return Inertia::render('dashboards/Member/ShowActiveLoans', $this->getActiveLoanPageData($request));
    }

    /**
     * Display member's active loan details
     */
    public function activeLoans(Request $request)
    {
        return Inertia::render('dashboards/Member/MemberActiveLoan', $this->getActiveLoanPageData($request));
    }

    private function getActiveLoanPageData(Request $request): array
    {
        $user = $request->user();

        $activeLoans = Loan::where('user_id', $user->id)
            ->active()
            ->with(['loanType', 'amortizations', 'payments', 'transactions.processor', 'settlementRequests' => fn ($query) => $query->latest()])
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($loan) {
                $totalPaid = $loan->payments->sum('amount');
                $remainingBalance = max(0, (float) $loan->total_amount_due - $totalPaid);
                $progressPercentage = $loan->total_amount_due > 0
                    ? round(($totalPaid / $loan->total_amount_due) * 100, 1)
                    : 0;

                $paidAmortizations = $loan->amortizations->where('status', 'paid')->count();
                $totalAmortizations = $loan->amortizations->count();

                $nextDueAmortization = $loan->amortizations
                    ->whereIn('status', ['pending', 'partial', 'overdue'])
                    ->sortBy('due_date')
                    ->first();

                $paymentStatus = $nextDueAmortization
                    ? (now()->diffInDays($nextDueAmortization->due_date, false) < 0 ? 'overdue' : 'due_soon')
                    : 'paid_off';
                $settlementCalculation = $this->settlementService->calculate($loan);
                $latestSettlementRequest = $loan->settlementRequests->first();

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
                    'settlement' => [
                        'outstanding_balance' => $settlementCalculation['outstanding_balance'],
                        'settlement_amount' => $settlementCalculation['settlement_amount'],
                        'calculation_basis' => $settlementCalculation['breakdown']['calculation_basis'],
                        'is_eligible' => $settlementCalculation['is_eligible'],
                        'eligibility_checks' => $settlementCalculation['eligibility_checks'],
                        'latest_request' => $latestSettlementRequest ? [
                            'id' => $latestSettlementRequest->id,
                            'status' => $latestSettlementRequest->status,
                            'settlement_amount' => $latestSettlementRequest->settlement_amount,
                            'rejection_reason' => $latestSettlementRequest->rejection_reason,
                            'created_at' => $latestSettlementRequest->created_at?->format('Y-m-d H:i:s'),
                            'approved_at' => $latestSettlementRequest->approved_at?->format('Y-m-d H:i:s'),
                            'verified_at' => $latestSettlementRequest->verified_at?->format('Y-m-d H:i:s'),
                        ] : null,
                    ],
                    'amortizations' => $loan->amortizations->map(fn ($a) => [
                        'id' => $a->id,
                        'installment_number' => $a->installment_number,
                        'due_date' => $a->due_date?->format('Y-m-d'),
                        'amount_due' => $a->amount_due,
                        'principal_amount' => $a->principal_amount,
                        'interest_amount' => $a->interest_amount,
                        'beginning_balance' => $a->beginning_balance,
                        'ending_balance' => $a->ending_balance,
                        'amount_paid' => $a->amount_paid,
                        'status' => $a->status,
                    ])->sortBy('installment_number')->values(),
                    'payments' => $loan->payments->map(fn ($p) => [
                        'id' => $p->id,
                        'amount' => $p->amount,
                        'payment_date' => $p->payment_date?->format('Y-m-d'),
                        'reference_number' => $p->reference_number,
                        'paid_by' => $p->paid_by,
                        'payment_method' => $p->payment_method,
                    ])->sortByDesc('payment_date')->values(),
                    'transactions' => $loan->transactions->map(fn ($t) => [
                        'id' => $t->id,
                        'date' => $t->transaction_date?->format('Y-m-d'),
                        'type' => $t->transaction_type,
                        'amount' => $t->amount,
                        'remarks' => $t->remarks,
                        'balance_after' => $t->balance_after,
                        'processed_by' => $t->processor
                            ? trim($t->processor->first_name.' '.$t->processor->last_name)
                            : 'System',
                    ])->sortByDesc('date')->values(),
                ];
            });

        $totalLoanBalance = $activeLoans->sum('remaining_balance');
        $totalAmountPaid = $activeLoans->sum('total_paid');
        $hasActiveLoan = $activeLoans->isNotEmpty();

        return [
            'activeLoans' => $activeLoans,
            'hasActiveLoan' => $hasActiveLoan,
            'totalLoanBalance' => $totalLoanBalance,
            'totalAmountPaid' => $totalAmountPaid,
            'unread_notifications_count' => $this->getMemberUnreadNotificationCount($request),
        ];
    }

    /**
     * Display member's completed loans
     */
    public function completedLoans(Request $request)
    {
        $user = $request->user();

        $completedLoans = Loan::where('user_id', $user->id)
            ->paidOff()
            ->with(['loanType'])
            ->orderBy('release_date', 'desc')
            ->get()
            ->map(fn ($loan) => [
                'id' => $loan->id,
                'loan_type_name' => $loan->loanType->name ?? 'N/A',
                'principal_amount' => $loan->principal_amount,
                'total_amount_due' => $loan->total_amount_due,
                'release_date' => $loan->release_date?->format('Y-m-d'),
                'paid_date' => $loan->updated_at->format('Y-m-d'),
                // fields referenced by the TS page
                'completion_date' => $loan->updated_at?->format('Y-m-d'),
                'status' => $loan->status,
                'terms_months' => $loan->terms_months,
                'principal_amount' => $loan->principal_amount,
                'total_paid' => $loan->total_amount_due,
            ]);

        return Inertia::render('dashboards/Member/MemberCompletedLoan', [
            'completedLoans' => $completedLoans,
            'unread_notifications_count' => $this->getMemberUnreadNotificationCount($request),
        ]);
    }

    /**
     * Display member's completed loan details (reuse ViewActiveLoan UI)
     */
    public function viewActiveLoan(Request $request, Loan $loan)
    {
        // Authorization: ensure the logged-in member owns this loan
        $user = $request->user();
        if ($loan->user_id !== $user->id) {
            abort(403);
        }

        // Ensure loan is paid off / completed
        $loan->loadMissing([
            'user.memberProfile',
            'loanType',
            'coMakers.user.memberProfile',
            'amortizations' => fn ($q) => $q->orderBy('due_date'),
            'payments' => fn ($q) => $q->orderBy('created_at', 'desc'),
            'transactions.processor' => fn ($q) => $q->select('id', 'first_name', 'last_name'),
        ]);

        $totalPaid = $loan->payments->sum('amount');
        $remainingBalance = max(0, $loan->total_amount_due - $totalPaid);
        $interestRate = $loan->principal_amount > 0
            ? ($loan->interest_amount / $loan->principal_amount) * 100
            : 0;

        $amortizationSchedule = $loan->amortizations->map(function ($amort) {
            return [
                'period' => $amort->installment_number,
                'due_date' => $amort->due_date->format('Y-m-d'),
                'principal_payment' => $amort->principal_amount ?? ($amort->amount_due * 0.8),
                'interest_payment' => $amort->interest_amount ?? ($amort->amount_due * 0.2),
                'total_payment' => $amort->amount_due,
                'status' => $amort->status,
            ];
        });

        $payments = $loan->payments->map(function ($payment) {
            return [
                'id' => $payment->id,
                'date' => $payment->created_at->format('Y-m-d'),
                'amount' => $payment->amount,
                'method' => $payment->payment_method ?? 'Cash',
                'reference' => $payment->reference_number ?? 'N/A',
            ];
        });

        $transactions = $loan->transactions?->sortByDesc('transaction_date')->map(function ($transaction) {
            return [
                'id' => $transaction->id,
                'date' => $transaction->transaction_date?->format('Y-m-d'),
                'type' => $transaction->transaction_type,
                'amount' => $transaction->amount,
                'remarks' => $transaction->remarks,
                'balance_after' => $transaction->balance_after,
                'processed_by' => $transaction->processor
                    ? trim($transaction->processor->first_name.' '.$transaction->processor->last_name)
                    : 'System',
            ];
        })->values() ?? [];

        $detailedLoan = [
            'id' => $loan->id,
            'member_id' => 'MEM-'.str_pad($loan->user_id, 4, '0', STR_PAD_LEFT),
            'member_name' => trim($loan->user->first_name.' '.($loan->user->middle_name ?? '').' '.$loan->user->last_name),
            'beneficiary_name' => $loan->user->memberProfile?->beneficiary_name ?? null,
            'loan_type' => $loan->loanType->name ?? 'Unknown',
            'principal' => $loan->principal_amount,
            'terms' => $loan->terms_months,
            'interest_rate' => round($interestRate, 1),
            'total_due' => $loan->total_amount_due,
            'remaining_balance' => $remainingBalance,
            'total_paid' => $totalPaid,
            'date_approved' => $loan->release_date?->format('Y-m-d') ?? $loan->created_at->format('Y-m-d'),
            'status' => $loan->status,
            'next_due_date' => $loan->amortizations->where('status', 'pending')->first()?->due_date?->format('Y-m-d') ?? null,
            'disbursement_method' => $loan->disbursement_method,
            'co_maker' => $loan->coMakers->first()?->user ? [
                'name' => trim($loan->coMakers->first()->user->first_name.' '.($loan->coMakers->first()->user->middle_name ?? '').' '.$loan->coMakers->first()->user->last_name),
                'relationship' => $loan->coMakers->first()->user->memberProfile?->relationship ?? 'N/A',
            ] : null,
            'amortization_schedule' => $amortizationSchedule,
            'payments' => $payments,
            'transactions' => $transactions,
        ];

        return Inertia::render('dashboards/Shared/ViewActiveLoan', [
            'loan' => $detailedLoan,
            'unread_notifications_count' => $this->getMemberUnreadNotificationCount($request),
        ]);
    }


    /**
     * API Search members for admin create application
     */
    public function search(Request $request)
    {
        $query = $request->get('q', '');

        if (strlen($query) < 2) {
            return response()->json(['data' => []]);
        }

        $members = \App\Models\User::where('role', 'member')
            ->where(function ($q) use ($query) {
                $q->where('email', 'like', "%{$query}%")
                    ->orWhere('first_name', 'like', "%{$query}%")
                    ->orWhere('last_name', 'like', "%{$query}%")
                    ->orWhere('middle_name', 'like', "%{$query}%")
                    ->orWhereHas('memberProfile', fn ($q) => $q
                        ->where('members_id', 'like', "%{$query}%")
                        ->orWhere('payroll_id', 'like', "%{$query}%"));
            })
            ->with(['memberProfile' => fn ($q) => $q->select('user_id', 'basic_salary', 'share_capital_balance', 'members_id', 'payroll_id')])
            ->limit(10)
            ->get()
            ->map(function ($user) {
                return [
                    'id' => $user->id,
                    'name' => trim($user->first_name.' '.($user->middle_name ?? '').' '.$user->last_name),
                    'email' => $user->email,
                    'members_id' => $user->memberProfile->members_id ?? 'N/A',
                    'payroll_id' => $user->memberProfile->payroll_id ?? null,
                    'basic_salary' => (float) $user->memberProfile->basic_salary,
                    'share_capital_balance' => (float) $user->memberProfile->share_capital_balance,
                ];
            });

        return response()->json([
            'data' => $members,
            'query' => $query,
        ]);
    }

    /**
     * Check if member is eligible for new loan (for frontend feedback)
     */
    public function checkEligibility($memberId)
    {
        $member = \App\Models\User::where('role', 'member')->findOrFail($memberId);

        $loanService = new \App\Services\LoanService;
        $profile = $member->memberProfile;
        $hasPendingLoan = Loan::where('user_id', $memberId)
            ->whereIn('status', ['awaiting_comaker', 'pending_gm_review', 'pending_cc_review'])
            ->exists();
        $hasActiveLoans = Loan::where('user_id', $memberId)
            ->whereIn('status', ['approved', 'released'])
            ->exists();

        $eligible = $profile && ! $hasPendingLoan && $loanService->canApplyForNewLoan($member);

        return response()->json([
            'eligible' => $eligible,
            'hasActiveLoans' => $hasActiveLoans,
            'hasPendingLoan' => $hasPendingLoan,
            'activeLoansCount' => Loan::where('user_id', $memberId)
                ->whereIn('status', ['approved', 'released'])
                ->count(),
            'reason' => $hasPendingLoan
                ? 'Member already has a pending loan application.'
                : (! $eligible ? 'Member has active loans that must be at least 50% paid.' : null),
        ]);
    }
}
