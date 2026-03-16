<?php

namespace App\Http\Controllers\GmController;

use App\Http\Controllers\Controller;
use App\Http\Controllers\GmController\GmController as BaseGmController;
use App\Models\Loan;
use App\Models\LoanPayment;
use App\Services\LoanService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class GmDashboardController extends Controller
{
    public function __construct(
        protected LoanService $loanService,
        protected BaseGmController $gmController
    ) {}

    public function activeLoans()
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

        return Inertia::render('dashboards/Gm/GMActiveLoan', [
            'active_loans' => $loans,
            'stats' => $stats
        ]);
    }

    public function completedLoans()
    {
        $loans = Loan::where('status', 'paid_off')
            ->with(['user:id,first_name,middle_name,last_name', 'loanType:name'])
            ->orderBy('updated_at', 'desc')
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
                    'date' => $loan->updated_at,
                    'status' => $loan->status,
                ];
            });

        $stats = [
            'total_completed' => $loans->count(),
            'total_principal' => $loans->sum('principal'),
            'total_repaid' => $loans->sum('total_due'),
        ];

        return Inertia::render('dashboards/Gm/GMCompletedLoan', [
            'completed_loans' => $loans,
            'stats' => $stats
        ]);
    }

    public function approvedLoans()
    {
        $pendingCCReviewLoans = Loan::byStatus(['pending_cc_review', 'approved'])
            ->withFullRelations()
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(fn($loan) => [
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
                    'id' => $loan->user->id,
                    'name' => trim($loan->user->first_name . ' ' . $loan->user->middle_name . ' ' . $loan->user->last_name),
                    'email' => $loan->user->email,
                    'member_id' => 'MEM-' . str_pad($loan->user->id, 4, '0', STR_PAD_LEFT),
                ],
            ]);

        $rejectedByGMLoans = Loan::where('status', 'rejected_by_gm')
            ->withFullRelations()
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(fn($loan) => [
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
                    'id' => $loan->user->id,
                    'name' => trim($loan->user->first_name . ' ' . $loan->user->middle_name . ' ' . $loan->user->last_name),
                    'email' => $loan->user->email,
                    'member_id' => 'MEM-' . str_pad($loan->user->id, 4, '0', STR_PAD_LEFT),
                ],
            ]);

        return Inertia::render('dashboards/Gm/ApprovedLoan', [
            'approvedLoans' => $pendingCCReviewLoans,
            'disapprovedLoans' => $rejectedByGMLoans,
        ]);
    }

    public function viewDecision(Loan $loan)
    {
        $loan->loadMissing(['user.memberProfile', 'loanType', 'coMakers.user', 'amortizations', 'payments']);
        
        $pastLoans = Loan::where('user_id', $loan->user_id)
            ->where('id', '!=', $loan->id)
            ->byStatus(['approved', 'released', 'paid_off'])
            ->with('loanType')
            ->limit(10)
            ->get()
            ->map(function ($pastLoan) {
                $totalPaid = LoanPayment::where('loan_id', $pastLoan->id)->sum('amount');
                return [
                    'id' => $pastLoan->id,
                    'loan_type_name' => $pastLoan->loanType->name ?? 'N/A',
                    'principal_amount' => $pastLoan->principal_amount,
                    'total_amount_due' => $pastLoan->total_amount_due,
                    'balance' => max(0, $pastLoan->total_amount_due - $totalPaid),
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
                'id' => $loan->user->id,
                'name' => trim($loan->user->first_name . ' ' . $loan->user->middle_name . ' ' . $loan->user->last_name),
                'email' => $loan->user->email,
                'member_id' => 'MEM-' . str_pad($loan->user->id, 4, '0', STR_PAD_LEFT),
                'date_hired' => $loan->user->memberProfile?->date_hired?->format('Y-m-d'),
                'basic_salary' => $loan->user->memberProfile?->basic_salary ?? 0,
                'share_capital_balance' => $loan->user->memberProfile?->share_capital_balance ?? 0,
            ],
            'co_makers' => $loan->coMakers->map(fn($cm) => [
                'id' => $cm->user->id,
                'name' => trim($cm->user->first_name . ' ' . $cm->user->middle_name . ' ' . $cm->user->last_name),
                'email' => $cm->user->email,
                'status' => $cm->status,
            ]),
            'past_loans' => $pastLoans,
            'active_loans_count' => Loan::where('user_id', $loan->user_id)->active()->count(),
        ];

        return Inertia::render('dashboards/Gm/GmViewLoanDecision', ['loan' => $loanDetails]);
    }
}

