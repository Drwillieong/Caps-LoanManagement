<?php

namespace App\Http\Controllers\HrController;

use App\Http\Controllers\Controller;
use App\Services\DashboardService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Loan;
use App\Models\User;
use App\Models\LoanPayment;

class HrDashboardController extends Controller
{
    public function __construct(
        protected DashboardService $dashboardService
    ) {}

    public function activeLoans(Request $request)
    {
        // Get HR view of all active loans (same logic as member dashboard HR data)
        $activeLoans = Loan::active()
            ->with(['user.memberProfile', 'loanType', 'amortizations', 'payments'])
            ->orderBy('created_at', 'desc')
            ->paginate(10);

        $stats = [
            'total_active_loans' => Loan::active()->count(),
            'total_amount_due' => Loan::active()->sum('total_amount_due'),
            'total_loan_portfolio' => Loan::active()->sum('total_amount_due'),
        ];

        return Inertia::render('dashboards/HR/HRActiveLoan', [
            'active_loans' => $activeLoans,
            'stats' => $stats,
        ]);

    }

    public function completedLoans(Request $request)
    {
        $completedLoans = Loan::paidOff()
            ->with(['user.memberProfile', 'loanType'])
            ->orderBy('updated_at', 'desc')
            ->paginate(10);

        $stats = [
            'total_completed_loans' => Loan::paidOff()->count(),
            'total_recovered_amount' => LoanPayment::sum('amount'),
        ];

        return Inertia::render('dashboards/HR/HRCompletedLoan', [
            'completed_loans' => $completedLoans,
            'stats' => $stats,
        ]);

    }
}

