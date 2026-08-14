<?php

namespace App\Service\ApplyLoan;

class LoanComputationService
{
    public const PAYMENTS_PER_YEAR = 24;

    public function compute(float $principal, int $months, float $interestRate, int $paymentsPerYear = self::PAYMENTS_PER_YEAR): array
    {
        if ($principal <= 0 || $months <= 0 || $paymentsPerYear <= 0) {
            return [
                'interest' => 0.0,
                'total' => round($principal, 2),
                'monthly' => 0.0,
                'payment_per_schedule' => 0.0,
                'payments_per_year' => $paymentsPerYear,
                'number_of_payments' => 0,
            ];
        }

        $numberOfPayments = (int) round(($months / 12) * $paymentsPerYear);
        $annualRate = $interestRate / 100;
        $periodicRate = $annualRate / $paymentsPerYear;

        if ($periodicRate <= 0) {
            $scheduledPayment = $principal / $numberOfPayments;
            $total = $principal;
        } else {
            $scheduledPayment = $this->payment($periodicRate, $numberOfPayments, $principal);
            $total = $scheduledPayment * $numberOfPayments;
        }

        $interest = max(0, $total - $principal);
        $monthly = $scheduledPayment * ($paymentsPerYear / 12);

        return [
            'interest' => round($interest, 2),
            'total' => round($total, 2),
            'monthly' => round($monthly, 2),
            'payment_per_schedule' => round($scheduledPayment, 2),
            'payments_per_year' => $paymentsPerYear,
            'number_of_payments' => $numberOfPayments,
        ];
    }

    private function payment(float $periodicRate, int $numberOfPayments, float $principal): float
    {
        return ($periodicRate * $principal) / (1 - ((1 + $periodicRate) ** -$numberOfPayments));
    }
}
