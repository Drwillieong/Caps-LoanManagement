<?php

namespace App\Service\ApplyLoan;

class LoanComputationService
{
    public const PAYMENTS_PER_YEAR = 24;

    public const PAYMENTS_PER_MONTH = 2;

    public function compute(
        float $principal,
        int $months,
        float $interestRate,
        int $paymentsPerYear = self::PAYMENTS_PER_YEAR,
        float $extraPayment = 0.0,
    ): array {
        if ($principal <= 0 || $months <= 0 || $paymentsPerYear <= 0 || $interestRate < 0 || $extraPayment < 0) {
            return [
                'interest' => 0.0,
                'total' => round($principal, 2),
                'monthly' => 0.0,
                'payment_per_schedule' => 0.0,
                'periodic_rate' => 0.0,
                'payments_per_year' => $paymentsPerYear,
                'number_of_payments' => 0,
                'schedule' => [],
            ];
        }

        $numberOfPayments = $this->numberOfPayments($months);
        $annualRate = $interestRate / 100;
        $periodicRate = $annualRate / $numberOfPayments;

        $scheduledPayment = $periodicRate <= 0
            ? $principal / $numberOfPayments
            : $this->payment($periodicRate, $numberOfPayments, $principal);

        $schedule = $this->schedule($principal, $periodicRate, $numberOfPayments, $scheduledPayment, $extraPayment);
        $interest = array_sum(array_column($schedule, 'interest'));
        $total = array_sum(array_column($schedule, 'total_payment'));
        $monthly = $scheduledPayment * self::PAYMENTS_PER_MONTH;

        return [
            'interest' => round($interest, 2),
            'total' => round($total, 2),
            'monthly' => round($monthly, 2),
            'payment_per_schedule' => round($scheduledPayment, 2),
            'payment_per_schedule_raw' => $scheduledPayment,
            'periodic_rate' => $periodicRate,
            'payments_per_year' => $numberOfPayments,
            'number_of_payments' => $numberOfPayments,
            'schedule' => $schedule,
        ];
    }

    private function numberOfPayments(int $months): int
    {
        return $months * self::PAYMENTS_PER_MONTH;
    }

    private function payment(float $periodicRate, int $numberOfPayments, float $principal): float
    {
        return ($periodicRate * $principal) / (1 - ((1 + $periodicRate) ** -$numberOfPayments));
    }

    private function schedule(
        float $principal,
        float $periodicRate,
        int $numberOfPayments,
        float $scheduledPayment,
        float $extraPayment,
    ): array {
        $balance = $principal;
        $cumulativeInterest = 0.0;
        $rows = [];

        for ($paymentNumber = 1; $paymentNumber <= $numberOfPayments && $balance > 0.0000001; $paymentNumber++) {
            $beginningBalance = $balance;
            $interest = $periodicRate > 0 ? $beginningBalance * $periodicRate : 0.0;
            $appliedExtraPayment = ($scheduledPayment + $extraPayment) < $beginningBalance
                ? $extraPayment
                : max(0.0, $beginningBalance - $scheduledPayment);
            $totalPayment = min($beginningBalance, $scheduledPayment + $appliedExtraPayment);
            $principalPayment = max(0.0, $totalPayment - $interest);
            $endingBalance = ($scheduledPayment + $appliedExtraPayment) < $beginningBalance
                ? $beginningBalance - $principalPayment
                : 0.0;
            $cumulativeInterest += $interest;

            $rows[] = [
                'payment_number' => $paymentNumber,
                'beginning_balance' => $beginningBalance,
                'scheduled_payment' => $scheduledPayment,
                'extra_payment' => $appliedExtraPayment,
                'total_payment' => $totalPayment,
                'principal' => $principalPayment,
                'interest' => $interest,
                'ending_balance' => $endingBalance,
                'cumulative_interest' => $cumulativeInterest,
            ];

            $balance = $endingBalance;
        }

        return $rows;
    }
}
