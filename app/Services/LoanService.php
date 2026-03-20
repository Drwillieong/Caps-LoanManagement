<?php

namespace App\Services;

use App\Models\Loan;
use App\Models\User;
use Illuminate\Support\Facades\Auth;

class LoanService
{
    /**
     * Get loan progress data for a specific loan
     */
    public function getLoanProgress(Loan $loan): array
    {
        $totalAmortizations = $loan->amortizations->count();
        $paidAmortizations = $loan->amortizations->where('status', 'paid')->count();
        
        $nextDueAmortization = $loan->amortizations
            ->where('status', 'unpaid')
            ->sortBy('due_date')
            ->first();

        $paymentStatus = 'paid';
        if ($nextDueAmortization) {
            $daysUntilDue = now()->startOfDay()->diffInDays($nextDueAmortization->due_date, false);
            $paymentStatus = $daysUntilDue <= 7 ? 'due_soon' : 'upcoming';
        }

        return [
            'loan_id' => $loan->id,
            'loan_type' => $loan->loanType->name ?? 'Loan',
            'total_amount' => $loan->total_amount_due,
            'remaining_balance' => $this->calculateBalance($loan),
            'total_months' => $loan->terms_months,
            'paid_months' => $paidAmortizations,
            'next_due_date' => $nextDueAmortization?->due_date?->format('Y-m-d'),
            'next_due_amount' => $nextDueAmortization?->amount_due ?? 0,
            'payment_status' => $paymentStatus,
        ];
    }

    /**
     * Calculate remaining balance for a loan
     */
    public function calculateBalance(Loan $loan): float
    {
        $totalPaid = $loan->payments->sum('amount');
        return max(0, (float) $loan->total_amount_due - $totalPaid);
    }

}

