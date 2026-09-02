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

        $schedule = $computed['schedule'];
        $dueDates = $this->dueDates($effectiveDate ?? now(), count($schedule));
        $totalPrincipalPosted = 0.0;
        $totalInterestPosted = 0.0;
        $totalAmountPosted = 0.0;

        foreach ($schedule as $index => $row) {
            $isFinal = $index === count($schedule) - 1;
            $principal = $isFinal
                ? round((float) $loan->principal_amount - $totalPrincipalPosted, 2)
                : round($row['principal'], 2);
            $interest = $isFinal
                ? round((float) $loan->interest_amount - $totalInterestPosted, 2)
                : round($row['interest'], 2);
            $amountDue = $isFinal
                ? round((float) $loan->total_amount_due - $totalAmountPosted, 2)
                : round($row['total_payment'], 2);

            LoanAmortization::create([
                'loan_id' => $loan->id,
                'installment_number' => $row['payment_number'],
                'due_date' => $dueDates[$index]->toDateString(),
                'amount_due' => $amountDue,
                'principal_amount' => $principal,
                'interest_amount' => $interest,
                'beginning_balance' => round($row['beginning_balance'], 2),
                'ending_balance' => $isFinal ? 0.0 : round($row['ending_balance'], 2),
                'status' => 'pending',
            ]);

            $totalPrincipalPosted = round($totalPrincipalPosted + $principal, 2);
            $totalInterestPosted = round($totalInterestPosted + $interest, 2);
            $totalAmountPosted = round($totalAmountPosted + $amountDue, 2);
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
