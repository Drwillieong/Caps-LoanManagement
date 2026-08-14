<?php

namespace App\Service\ApplyLoan;

use App\Models\Loan;
use App\Models\LoanAmortization;
use Carbon\CarbonInterface;

class LoanAmortizationScheduleService
{
    public const CUTOFF_DAYS = [10, 25];

    public function __construct(
        private readonly LoanComputationService $computationService = new LoanComputationService()
    ) {}

    public function generate(Loan $loan, ?CarbonInterface $effectiveDate = null, bool $replaceExisting = false): void
    {
        if ($loan->amortizations()->exists()) {
            if (! $replaceExisting) {
                return;
            }

            $loan->amortizations()->delete();
        }

        $loan->loadMissing('loanType');

        $computed = $this->computationService->compute(
            (float) $loan->principal_amount,
            (int) $loan->terms_months,
            (float) ($loan->loanType?->interest_rate_per_annum ?? 0),
        );

        $periodicRate = ((float) ($loan->loanType?->interest_rate_per_annum ?? 0) / 100) / $computed['payments_per_year'];
        $scheduledPayment = (float) $computed['payment_per_schedule'];
        $balance = (float) $loan->principal_amount;
        $totalPrincipalPosted = 0.0;
        $totalInterestPosted = 0.0;
        $dueDates = $this->dueDates($effectiveDate ?? now(), (int) $computed['number_of_payments']);

        foreach ($dueDates as $index => $dueDate) {
            $installmentNumber = $index + 1;
            $beginningBalance = round($balance, 2);
            $isFinal = $installmentNumber === count($dueDates);

            if ($periodicRate > 0) {
                $interest = round($beginningBalance * $periodicRate, 2);
            } else {
                $interest = 0.0;
            }

            $principal = round($scheduledPayment - $interest, 2);

            if ($isFinal) {
                $principal = round((float) $loan->principal_amount - $totalPrincipalPosted, 2);
                $interest = round((float) $loan->interest_amount - $totalInterestPosted, 2);
                $amountDue = round($principal + $interest, 2);
                $endingBalance = 0.0;
            } else {
                $principal = min($principal, $beginningBalance);
                $amountDue = round($principal + $interest, 2);
                $endingBalance = round($beginningBalance - $principal, 2);
            }

            LoanAmortization::create([
                'loan_id' => $loan->id,
                'installment_number' => $installmentNumber,
                'due_date' => $dueDate->toDateString(),
                'amount_due' => $amountDue,
                'principal_amount' => $principal,
                'interest_amount' => $interest,
                'beginning_balance' => $beginningBalance,
                'ending_balance' => $endingBalance,
                'status' => 'pending',
            ]);

            $totalPrincipalPosted = round($totalPrincipalPosted + $principal, 2);
            $totalInterestPosted = round($totalInterestPosted + $interest, 2);
            $balance = $endingBalance;
        }
    }

    /**
     * Preserve the existing product behavior: installments start on the 10th
     * and 25th of the month after approval/release.
     */
    public function dueDates(CarbonInterface $effectiveDate, int $numberOfPayments): array
    {
        $month = $effectiveDate->copy()->addMonth()->startOfMonth();
        $dates = [];

        while (count($dates) < $numberOfPayments) {
            foreach (self::CUTOFF_DAYS as $day) {
                if (count($dates) >= $numberOfPayments) {
                    break;
                }

                $dates[] = $month->copy()->day($day);
            }

            $month->addMonth();
        }

        return $dates;
    }
}
