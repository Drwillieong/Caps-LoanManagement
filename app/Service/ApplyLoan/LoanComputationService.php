<?php

namespace App\Services\Loan;

class LoanComputationService
{
    public function compute(float $principal, int $months, float $interestRate)
    {
        $interest = ($principal * ($interestRate / 100)) * ($months / 12);
        $total = $principal + $interest;
        $monthly = $total / $months;

        return [
            'interest' => round($interest, 2),
            'total' => round($total, 2),
            'monthly' => round($monthly, 2),
        ];
    }
}