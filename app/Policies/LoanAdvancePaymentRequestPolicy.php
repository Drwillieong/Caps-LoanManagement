<?php

namespace App\Policies;

use App\Models\Loan;
use App\Models\LoanAdvancePaymentRequest;
use App\Models\User;

class LoanAdvancePaymentRequestPolicy
{
    public function create(User $user, Loan $loan): bool
    {
        return $user->role === 'member'
            && $loan->user_id === $user->id
            && in_array($loan->status, ['approved', 'released'], true);
    }

    public function viewAny(User $user): bool
    {
        return $user->role === 'gm';
    }

    public function view(User $user, LoanAdvancePaymentRequest $advancePaymentRequest): bool
    {
        return $user->role === 'gm'
            || ($user->role === 'member' && $advancePaymentRequest->requested_by === $user->id);
    }

    public function review(User $user, LoanAdvancePaymentRequest $advancePaymentRequest): bool
    {
        return $user->role === 'gm'
            && $advancePaymentRequest->status === LoanAdvancePaymentRequest::STATUS_PENDING_VALIDATION;
    }

    public function submitPayment(User $user, LoanAdvancePaymentRequest $advancePaymentRequest): bool
    {
        return $user->role === 'member'
            && $advancePaymentRequest->requested_by === $user->id
            && $advancePaymentRequest->status === LoanAdvancePaymentRequest::STATUS_AWAITING_PAYMENT;
    }

    public function verifyPayment(User $user, LoanAdvancePaymentRequest $advancePaymentRequest): bool
    {
        return $user->role === 'gm'
            && in_array($advancePaymentRequest->status, [
                LoanAdvancePaymentRequest::STATUS_AWAITING_PAYMENT,
                LoanAdvancePaymentRequest::STATUS_PAYMENT_SUBMITTED,
                LoanAdvancePaymentRequest::STATUS_SCHEDULED_FOR_SALARY_DEDUCTION,
            ], true);
    }
}
