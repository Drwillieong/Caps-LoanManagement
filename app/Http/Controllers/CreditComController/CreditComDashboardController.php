<?php

namespace App\Http\Controllers\CreditComController;

use App\Http\Controllers\Controller;
use App\Http\Controllers\CreditComController\CreditComController as BaseCreditComController;
use App\Models\Loan;
use App\Services\LoanService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CreditComDashboardController extends Controller
{
    public function __construct(
        protected LoanService $loanService,
        protected BaseCreditComController $creditComController
    ) {}

    public function approvedHistory()
    {
        $approvedLoans = Loan::where('status', 'approved')
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

        $disapprovedLoans = Loan::where('status', 'rejected_by_credit_com')
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

        return Inertia::render('dashboards/CreditCom/CrComApprovedHistory', [
            'approvedLoans' => $approvedLoans,
            'disapprovedLoans' => $disapprovedLoans,
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
                $totalPaid = \App\Models\LoanPayment::where('loan_id', $pastLoan->id)->sum('amount');
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

        return Inertia::render('dashboards/CreditCom/ViewLoanDecision', ['loan' => $loanDetails]);
    }
}

