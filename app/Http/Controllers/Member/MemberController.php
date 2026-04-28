<?php

namespace App\Http\Controllers\Member;

use App\Http\Controllers\Controller;
use App\Models\Loan;
use App\Services\LoanService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class MemberController extends Controller
{
    use \App\Traits\HasNotificationCount;

    public function __construct(
        protected LoanService $loanService
    ) {}

    /**
     * Display member's active loans
     */
    public function activeLoans(Request $request)
    {
        $user = $request->user();
        
        $activeLoans = Loan::where('user_id', $user->id)
            ->active()
            ->with(['loanType', 'amortizations', 'payments'])
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
                    'amortizations' => $loan->amortizations->map(fn($a) => [
                        'id' => $a->id,
                        'installment_number' => $a->installment_number,
                        'due_date' => $a->due_date?->format('Y-m-d'),
                        'amount_due' => $a->amount_due,
                        'amount_paid' => $a->amount_paid,
                        'status' => $a->status,
                    ])->sortBy('installment_number')->values(),
                    'payments' => $loan->payments->map(fn($p) => [
                        'id' => $p->id,
                        'amount' => $p->amount,
                        'payment_date' => $p->payment_date?->format('Y-m-d'),
                        'reference_number' => $p->reference_number,
                        'paid_by' => $p->paid_by,
                    ])->sortByDesc('payment_date')->values(),
                ];
            });

        $totalLoanBalance = $activeLoans->sum('remaining_balance');
        $totalAmountPaid = $activeLoans->sum('total_paid');
        $hasActiveLoan = $activeLoans->isNotEmpty();

        return Inertia::render('dashboards/Member/MemberActiveLoan', [
            'activeLoans' => $activeLoans,
            'hasActiveLoan' => $hasActiveLoan,
            'totalLoanBalance' => $totalLoanBalance,
            'totalAmountPaid' => $totalAmountPaid,
            'unread_notifications_count' => $this->getMemberUnreadNotificationCount($request),
        ]);
    }

    /**
     * Display member's completed loans (placeholder for now)
     */
    public function completedLoans(Request $request)
    {
        $user = $request->user();
        
        $completedLoans = Loan::where('user_id', $user->id)
            ->paidOff()
            ->with(['loanType'])
            ->orderBy('release_date', 'desc')
            ->get()
            ->map(fn($loan) => [
                'id' => $loan->id,
                'loan_type_name' => $loan->loanType->name ?? 'N/A',
                'principal_amount' => $loan->principal_amount,
                'total_amount_due' => $loan->total_amount_due,
                'release_date' => $loan->release_date?->format('Y-m-d'),
                'paid_date' => $loan->updated_at->format('Y-m-d'),
            ]);

        return Inertia::render('dashboards/Member/MemberCompletedLoan', [
            'completedLoans' => $completedLoans,
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
                  ->orWhereHas('memberProfile', fn($q) => $q->where('employee_id', 'like', "%{$query}%"));
            })
            ->with(['memberProfile' => fn($q) => $q->select('user_id', 'basic_salary', 'share_capital_balance', 'employee_id')])
            ->limit(10)
            ->get()
            ->map(function ($user) {
                return [
                    'id' => $user->id,
                    'name' => trim($user->first_name . ' ' . ($user->middle_name ?? '') . ' ' . $user->last_name),
                    'email' => $user->email,
                    'employee_id' => $user->memberProfile->employee_id ?? 'N/A',
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
        
        $loanService = new \App\Services\LoanService();
        $profile = $member->memberProfile;
        $hasPendingLoan = Loan::where('user_id', $memberId)
            ->whereIn('status', ['awaiting_comaker', 'pending_gm_review', 'pending_cc_review'])
            ->exists();
        $hasActiveLoans = Loan::where('user_id', $memberId)
            ->whereIn('status', ['approved', 'released'])
            ->exists();
        
        $eligible = $profile && !$hasPendingLoan && $loanService->canApplyForNewLoan($member);
        
        return response()->json([
            'eligible' => $eligible,
            'hasActiveLoans' => $hasActiveLoans,
            'hasPendingLoan' => $hasPendingLoan,
            'activeLoansCount' => Loan::where('user_id', $memberId)
                ->whereIn('status', ['approved', 'released'])
                ->count(),
            'reason' => $hasPendingLoan
                ? 'Member already has a pending loan application.'
                : (!$eligible ? 'Member has active loans that must be at least 75% paid.' : null),
        ]);
    }
}

