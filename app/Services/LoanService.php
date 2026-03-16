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

    /**
     * Get loan notifications for user
     */
    public function getLoanNotifications(User $user)
    {
        return Loan::where('user_id', $user->id)
            ->byStatus([
                'rejected_by_co_maker',
                'pending_gm_review',
                'rejected_by_gm',
                'pending_cc_review',
                'rejected_by_credit_com',
                'approved',
                'released',
            ])
            ->with('loanType')
            ->orderBy('updated_at', 'desc')
            ->limit(10)
            ->get()
            ->map(fn($loan) => [
                'id' => $loan->id,
                'loan_type' => $loan->loanType->name ?? 'N/A',
                'date' => $loan->updated_at->format('Y-m-d'),
                'from' => $this->getNotificationFrom($loan->status),
                'description' => $this->getNotificationDescription($loan->status),
                'comment' => $loan->remarks ?? $this->getDefaultComment($loan->status),
                'status' => $loan->status,
            ]);
    }

    protected function getNotificationFrom(string $status): string
    {
        return match($status) {
            'rejected_by_co_maker', 'pending_gm_review' => 'Co-Maker',
            'rejected_by_gm', 'pending_cc_review' => 'General Manager',
            'rejected_by_credit_com', 'approved' => 'Credit Coordinator',
            'released' => 'System',
            default => 'System',
        };
    }

    protected function getNotificationDescription(string $status): string
    {
        return match($status) {
            'rejected_by_co_maker' => 'Co-Maker Declined',
            'pending_gm_review' => 'Co-Maker Accepted',
            'rejected_by_gm' => 'Loan Rejected',
            'pending_cc_review' => 'Loan Approved',
            'rejected_by_credit_com' => 'Loan Rejected',
            'approved' => 'Loan Approved',
            'released' => 'Loan Released',
            default => 'Updated',
        };
    }

    protected function getDefaultComment(string $status): string
    {
        return match($status) {
            'rejected_by_co_maker' => 'Your co-maker has declined to support your loan application.',
            'pending_gm_review' => 'Your co-maker has accepted. Pending GM review.',
            'rejected_by_gm' => 'Your loan application has been rejected by GM.',
            'pending_cc_review' => 'Approved by GM. Pending Credit Coordinator review.',
            'rejected_by_credit_com' => 'Rejected by Credit Coordinator.',
            'approved' => 'Congratulations! Your loan has been approved.',
            'released' => 'Loan released successfully.',
            default => 'No comments.',
        };
    }
}

