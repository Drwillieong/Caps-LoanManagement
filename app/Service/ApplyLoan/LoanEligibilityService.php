<?php

namespace App\Service\ApplyLoan;

use App\Models\Loan;
use App\Models\User;
use App\Models\LoanType;
use App\Services\LoanService;

class LoanEligibilityService
{
    public function check(User $borrower, float $amount, ?int $coMakerId, int $loanTypeId, int $termsMonths): void
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

        // Monthly payment must not exceed 50% of basic salary
        $loanType = LoanType::find($loanTypeId);
        if ($loanType) {
            $computationService = new LoanComputationService();
            $computed = $computationService->compute(
                $amount,
                $termsMonths,
                $loanType->interest_rate_per_annum
            );
            
            $maxMonthlyPayment = $profile->basic_salary / 2;
            
            if ($computed['monthly'] > $maxMonthlyPayment) {
                abort(422, 'Monthly payment exceeds 50% of your basic salary. Please increase the loan term or reduce the amount.');
            }
        }

        // Check existing loans are all >=75% paid
        $loanService = new LoanService();
        if (!$loanService->canApplyForNewLoan($borrower)) {
            abort(422, 'Cannot apply: One or more active loans must be at least 75% paid.');
        }

        // Combined monthly payment (existing + new) must not exceed 50% salary
        $existingMonthly = $loanService->getActiveLoansTotalMonthlyPayment($borrower);
        $combinedMonthly = $existingMonthly + $computed['monthly'];
        $maxMonthlyPayment = $profile->basic_salary / 2;
        
        if ($combinedMonthly > $maxMonthlyPayment) {
            abort(422, 'Combined monthly payments (₱' . number_format($combinedMonthly, 2) . ') exceed 50% of salary (₱' . number_format($maxMonthlyPayment, 2) . '). Please adjust amount or term.');
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