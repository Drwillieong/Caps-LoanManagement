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
        $loans = Loan::whereIn('status', ['released', 'active', 'approved'])
            ->with(['user:id,first_name,middle_name,last_name', 'loanType:name'])
            ->orderBy('release_date', 'desc')
            ->get()
            ->map(function ($loan) {
                return [
                    'id' => $loan->id,
                    'member_id' => 'MEM-' . str_pad($loan->user_id, 4, '0', STR_PAD_LEFT),
                    'member_name' => trim($loan->user->first_name . ' ' . ($loan->user->middle_name ?? '') . ' ' . $loan->user->last_name),
                    'loan_type' => $loan->loanType->name ?? 'Unknown',
                    'principal' => $loan->principal_amount,
                    'terms' => $loan->terms_months,
                    'total_due' => $loan->total_amount_due,
                    'date' => $loan->release_date ?? $loan->created_at,
                    'status' => $loan->status,
                ];
            });

        $stats = [
            'total_active' => $loans->count(),
            'total_principal' => $loans->sum('principal'),
            'total_due' => $loans->sum('total_due'),
        ];

        return Inertia::render('dashboards/HR/HRActiveLoan', [
            'active_loans' => $loans,
            'stats' => $stats
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

