<?php

namespace App\Services;

use App\Models\Loan;
use App\Models\LoanPayment;
use App\Models\User;
use Illuminate\Support\Facades\Auth;

class DashboardService
{
    protected LoanService $loanService;

    public function __construct(LoanService $loanService)
    {
        $this->loanService = $loanService;
    }

    /**
     * Get dashboard data for specific role
     */
    public function getDashboardData(string $role): array
    {
        return match ($role) {
            'member' => $this->getMemberData(),
            'hr' => $this->getHrData(),
            'gm' => $this->getGmData(),
            'creditcom' => $this->getCreditComData(),
            default => [],
        };
    }

    /**
     * Member-specific dashboard data
     */
    protected function getMemberData(): array
    {
        $user = Auth::user();

        $activeLoans = Loan::where('user_id', $user->id)
            ->active()
            ->with(['payments', 'amortizations' => fn($q) => $q->orderBy('due_date')])
            ->get();

        $loanBalance = $activeLoans->sum(function ($loan) {
            return $loan->total_amount_due - $loan->payments->sum('amount');
        });

        $activeLoanCount = Loan::where('user_id', $user->id)->active()->count();
        $completedLoanCount = Loan::where('user_id', $user->id)->paidOff()->count();
        $hasPendingLoan = Loan::where('user_id', $user->id)
            ->byStatus(['pending', 'pending_gm_review', 'pending_cc_review', 'awaiting_comaker'])
            ->exists();

        $loanProgress = $activeLoans->isNotEmpty() 
            ? $this->loanService->getLoanProgress($activeLoans->first())
            : null;

        return [
            'share_capital_balance' => $user->memberProfile?->share_capital_balance ?? 0,
            'loan_balance' => $loanBalance,
            'active_loan_count' => $activeLoanCount,
            'completed_loan_count' => $completedLoanCount,
            'has_pending_loan' => $hasPendingLoan,
            'loan_progress' => $loanProgress,
            'loan_eligibility' => $this->getLoanEligibility($user),
            'profileCompleted' => $user->hasCompletedProfile(),
            'loan_notifications' => $this->loanService->getLoanNotifications($user),
        ];
    }

    /**
     * HR-specific dashboard data
     */
    protected function getHrData(): array
    {
        $totalMembers = User::where('role', 'member')->count();
        $activeMembers = User::where('role', 'member')->where('is_active', true)->count();
        $inactiveMembers = User::where('role', 'member')->where('is_active', false)->count();

        $recentMembers = User::where('role', 'member')
            ->where('created_at', '>=', now()->subDays(30))
            ->with('memberProfile')
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get();

        $pendingLoans = Loan::byStatus(['pending'])->count();
        $activeLoans = Loan::active()->count();
        $completedLoans = Loan::paidOff()->count();

        $totalLoanPortfolio = Loan::active()->sum('total_amount_due');
        $totalPaidAmount = LoanPayment::sum('amount');
        $membersWithLoans = Loan::active()->distinct('user_id')->count('user_id');

        return [
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
            'loan_status_breakdown' => Loan::selectRaw('status, count(*) as count')
                ->groupBy('status')
                ->pluck('count', 'status'),
            'recent_members' => $recentMembers->map(fn($u) => [
                'id' => $u->id,
                'full_name' => trim($u->first_name . ' ' . $u->middle_name . ' ' . $u->last_name),
                'email' => $u->email,
                'position' => $u->memberProfile?->position ?? 'N/A',
                'date_hired' => $u->memberProfile?->date_hired?->format('Y-m-d'),
                'created_at' => $u->created_at->format('Y-m-d'),
            ]),
        ];
    }

    /**
     * GM-specific dashboard data
     */
    protected function getGmData(): array
    {
        $totalLoanPortfolio = Loan::active()->sum('total_amount_due');
        $activeMembers = User::where('role', 'member')->where('is_active', true)->count();
        $pendingApprovals = Loan::pendingGmReview()->count();

        $recentPendingLoans = Loan::pendingGmReview()
            ->with(['user', 'loanType'])
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get()
            ->map(fn($l) => [
                'id' => $l->id,
                'member_name' => trim($l->user->first_name . ' ' . $l->user->middle_name . ' ' . $l->user->last_name),
                'loan_type' => $l->loanType->name ?? 'N/A',
                'principal_amount' => $l->principal_amount,
                'total_amount_due' => $l->total_amount_due,
                'created_at' => $l->created_at->format('Y-m-d'),
            ]);

        $totalPaidAmount = LoanPayment::sum('amount');
        $totalAmountDue = Loan::active()->sum('total_amount_due');
        $actualCollectionRate = $totalAmountDue > 0 ? round(($totalPaidAmount / $totalAmountDue) * 100) : 0;

        return [
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
            ],
            'business_loans_over_100k' => Loan::pendingGmReview()
                ->whereHas('loanType', fn($q) => $q->where('name', 'like', '%Business%'))
                ->where('principal_amount', '>', 100000)
                ->count(),
        ];
    }

    /**
     * CreditCom-specific dashboard data
     */
    protected function getCreditComData(): array
    {
        // Similar structure to GM but for pending_cc_review
        $totalLoanPortfolio = Loan::active()->sum('total_amount_due');
        $activeMembers = User::where('role', 'member')->where('is_active', true)->count();
        $pendingValidations = Loan::pendingCcReview()->count();

        $recentPendingLoans = Loan::pendingCcReview()
            ->with(['user', 'loanType'])
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get()
            ->map(fn($l) => [
                'id' => $l->id,
                'member_name' => trim($l->user->first_name . ' ' . $l->user->middle_name . ' ' . $l->user->last_name),
                'loan_type' => $l->loanType->name ?? 'N/A',
                'principal_amount' => $l->principal_amount,
                'total_amount_due' => $l->total_amount_due,
                'created_at' => $l->created_at->format('Y-m-d'),
            ]);

        $totalPaidAmount = LoanPayment::sum('amount');
        $totalAmountDue = Loan::active()->sum('total_amount_due');
        $actualCollectionRate = $totalAmountDue > 0 ? round(($totalPaidAmount / $totalAmountDue) * 100) : 0;

        return [
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
            ],
        ];
    }

    protected function getLoanEligibility($user): array
    {
        $profile = $user->memberProfile;
        return [
            'max_loan_allowed' => ($profile?->share_capital_balance ?? 0) * 2,
            'basic_salary' => $profile?->basic_salary ?? 0,
            'max_monthly_payment' => ($profile?->basic_salary ?? 0) / 2,
            'has_active_loan' => Loan::where('user_id', $user->id)->active()->exists(),
        ];
    }
}

