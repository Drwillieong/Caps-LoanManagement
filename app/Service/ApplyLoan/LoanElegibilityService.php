<?php

namespace App\Services\Loan;

use App\Models\Loan;
use App\Models\User;

class LoanEligibilityService
{
    public function check(User $borrower, float $amount, ?int $coMakerId): void
    {
        $profile = $borrower->memberProfile;

        if (!$profile) {
            abort(422, 'Your profile is not yet completed.');
        }

        // Share capital rule (x2)
        $maxLoan = $profile->share_capital_balance * 2;

        if ($amount > $maxLoan) {
            abort(422, 'Requested amount exceeds allowed loan based on share capital.');
        }

        // Existing active loan
        $hasActiveLoan = Loan::where('user_id', $borrower->id)
            ->whereIn('status', ['approved', 'released'])
            ->exists();

        if ($hasActiveLoan) {
            abort(422, 'You already have an active loan.');
        }

        // Co-maker validation
        if ($coMakerId) {
            $this->validateCoMaker($coMakerId);
        }
    }

    protected function validateCoMaker(int $coMakerId): void
    {
        $isAlreadyCoMaker = Loan::whereIn('status', ['approved', 'released'])
            ->whereHas('coMakers', function ($q) use ($coMakerId) {
                $q->where('user_id', $coMakerId);
            })
            ->exists();

        if ($isAlreadyCoMaker) {
            abort(422, 'Selected co-maker is already assigned to another active loan.');
        }
    }
}