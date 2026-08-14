<?php

namespace App\Http\Controllers\HrController;

use App\Http\Controllers\Controller;
use App\Models\Loan;
use App\Services\DashboardService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class HrDashboardController extends Controller
{
    public function __construct(
        protected DashboardService $dashboardService
    ) {}

    public function activeLoans(Request $request)
    {
        $loans = Loan::whereIn('status', ['released', 'active', 'approved'])
            ->with(['user:id,first_name,middle_name,last_name', 'user.memberProfile:user_id,employee_id', 'loanType:name'])
            ->orderBy('release_date', 'desc')
            ->get()
            ->map(function ($loan) {
                return [
                    'id' => $loan->id,
                    'member_id' => $loan->user->memberProfile?->employee_id ?? 'N/A',
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

        return Inertia::render('dashboards/HR/HRActiveLoan', [
            'active_loans' => $loans,
            'stats' => $stats,
        ]);
    }

    public function completedLoans(Request $request)
    {
        $loans = Loan::paidOff()
            ->with(['user:id,first_name,middle_name,last_name', 'loanType:name'])
            ->orderBy('updated_at', 'desc')
            ->get()
            ->map(function ($loan) {
                return [
                    'id' => $loan->id,
                    'member_id' => ''.str_pad($loan->user_id, 3, '0', STR_PAD_LEFT),
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

        return Inertia::render('dashboards/HR/HRCompletedLoan', [
            'completed_loans' => $loans,
            'stats' => $stats,
        ]);

    }

    /**
     * View detailed active loan information - copied/adapted from GmDashboardController
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
                'principal_payment' => $amort->principal_amount ?? ($amort->amount_due * 0.8),
                'interest_payment' => $amort->interest_amount ?? ($amort->amount_due * 0.2),
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
            'member_id' => ''.str_pad($loan->user_id, 3, '0', STR_PAD_LEFT),
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
        ]);
    }
}
