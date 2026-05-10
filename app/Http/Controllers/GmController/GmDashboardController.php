<?php

namespace App\Http\Controllers\GmController;

use App\Http\Controllers\Controller;
use App\Http\Controllers\GmController\GmController as BaseGmController;
use App\Models\Loan;
use App\Models\LoanPayment;
use App\Services\LoanService;
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
                    'member_id' => 'MEM-'.str_pad($loan->user_id, 4, '0', STR_PAD_LEFT),
                    'member_name' => trim($loan->user->first_name.' '.($loan->user->middle_name ?? '').' '.$loan->user->last_name),
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
            'stats' => $stats,
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
                    'member_id' => 'MEM-'.str_pad($loan->user_id, 4, '0', STR_PAD_LEFT),
                    'member_name' => trim($loan->user->first_name.' '.($loan->user->middle_name ?? '').' '.$loan->user->last_name),
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
            'stats' => $stats,
        ]);
    }

    public function approvedLoans()
    {
        $pendingCCReviewLoans = Loan::byStatus(['pending_cc_review', 'approved'])
            ->withFullRelations()
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(fn ($loan) => [
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
                    'name' => trim($loan->user->first_name.' '.$loan->user->middle_name.' '.$loan->user->last_name),
                    'email' => $loan->user->email,
                    'member_id' => 'MEM-'.str_pad($loan->user->id, 4, '0', STR_PAD_LEFT),
                ],
            ]);

        $rejectedByGMLoans = Loan::where('status', 'rejected_by_gm')
            ->withFullRelations()
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(fn ($loan) => [
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
                    'name' => trim($loan->user->first_name.' '.$loan->user->middle_name.' '.$loan->user->last_name),
                    'email' => $loan->user->email,
                    'member_id' => 'MEM-'.str_pad($loan->user->id, 4, '0', STR_PAD_LEFT),
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
                'name' => trim($loan->user->first_name.' '.$loan->user->middle_name.' '.$loan->user->last_name),
                'email' => $loan->user->email,
                'member_id' => 'MEM-'.str_pad($loan->user->id, 4, '0', STR_PAD_LEFT),
                'date_hired' => $loan->user->memberProfile?->date_hired?->format('Y-m-d'),
                'basic_salary' => $loan->user->memberProfile?->basic_salary ?? 0,
                'share_capital_balance' => $loan->user->memberProfile?->share_capital_balance ?? 0,
            ],
            'co_makers' => $loan->coMakers->map(fn ($cm) => [
                'id' => $cm->user->id,
                'name' => trim($cm->user->first_name.' '.$cm->user->middle_name.' '.$cm->user->last_name),
                'email' => $cm->user->email,
                'status' => $cm->status,
            ]),
            'past_loans' => $pastLoans,
            'active_loans_count' => Loan::where('user_id', $loan->user_id)->active()->count(),
        ];

        return Inertia::render('dashboards/Gm/GmViewLoanDecision', ['loan' => $loanDetails]);
    }

    /**
     * View detailed active loan information
     */
    public function viewActiveLoan(Loan $loan)
    {
        $loan->loadMissing([
            'user.memberProfile',
            'loanType',
            'coMakers.user.memberProfile',
            'amortizations' => fn ($q) => $q->orderBy('due_date'),
            'payments' => fn ($q) => $q->orderBy('created_at', 'desc'),
            'transactions.processor' => fn ($q) => $q->select('id', 'first_name', 'last_name'),
        ]);

        // Calculate totals
        $totalPaid = $loan->payments->sum('amount');
        $remainingBalance = max(0, $loan->total_amount_due - $totalPaid);
        $interestRate = ($loan->interest_amount / $loan->principal_amount) * 100;

        // Transform amortization schedule
        $amortizationSchedule = $loan->amortizations->map(function ($amort) {
            return [
                'period' => $amort->installment_number,
                'due_date' => $amort->due_date->format('Y-m-d'),
                'principal_payment' => $amort->amount_due * 0.8, // Approx split
                'interest_payment' => $amort->amount_due * 0.2, // Approx split
                'total_payment' => $amort->amount_due,
                'status' => $amort->status,
            ];
        });

        // Transform payments
        $payments = $loan->payments->map(function ($payment) {
            return [
                'id' => $payment->id,
                'date' => $payment->created_at->format('Y-m-d'),
                'amount' => $payment->amount,
                'method' => $payment->payment_method ?? 'Cash',
                'reference' => $payment->reference_number ?? 'N/A',
            ];
        });

        $transactions = $loan->transactions->sortByDesc('transaction_date')->map(function ($transaction) {
            return [
                'id' => $transaction->id,
                'date' => $transaction->transaction_date->format('Y-m-d'),
                'type' => $transaction->transaction_type,
                'amount' => $transaction->amount,
                'remarks' => $transaction->remarks,
                'balance_after' => $transaction->balance_after,
                'processed_by' => $transaction->processor
                    ? trim($transaction->processor->first_name.' '.$transaction->processor->last_name)
                    : 'System',
            ];
        })->values();

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
        ]);
    }
}
