<?php

namespace App\Policies;

use App\Models\Loan;
use App\Models\LoanSettlementRequest;
use App\Models\User;

class LoanSettlementRequestPolicy
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

    public function view(User $user, LoanSettlementRequest $settlementRequest): bool
    {
        return $user->role === 'gm'
            || ($user->role === 'member' && $settlementRequest->requested_by === $user->id);
    }

    public function review(User $user, LoanSettlementRequest $settlementRequest): bool
    {
        return $user->role === 'gm'
            && $settlementRequest->status === LoanSettlementRequest::STATUS_PENDING;
    }

    public function verifyPayment(User $user, LoanSettlementRequest $settlementRequest): bool
    {
        return $user->role === 'gm'
            && in_array($settlementRequest->status, [
                LoanSettlementRequest::STATUS_APPROVED,
                LoanSettlementRequest::STATUS_FOR_PAYMENT,
            ], true);
    }
}
