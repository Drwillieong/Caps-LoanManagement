<?php

namespace App\Services\Payroll;

use App\Models\LoanAmortization;
use Carbon\Carbon;
use Illuminate\Support\LazyCollection;

class SalaryDeductionReportService
{
    /**
     * Columns must match the existing payroll deduction upload template CSV structure.
     */
    public function headingRow(): array
    {
        return [
            'members_id',
            'payroll_id',
            'employee_name',
            'cutoff_date',
            'deduction_amount',
            'remarks',
        ];
    }

    /**
     * Export unpaid amortization installments payable through the selected cutoff.
     *
     * Schedules are generated on the 10th and 25th. A selected cutoff from the
     * 1st-10th maps to the 10th, the 11th-25th maps to the 25th, and dates after
     * the 25th map to the next month's 10th. We include open schedules due on or
     * before that payroll date so prior missed/partial deductions are not hidden,
     * while later future installments remain excluded.
     */
    public function rowsForCutoff(Carbon $cutoffDate): LazyCollection
    {
        $billingDate = $this->billingDateForCutoff($cutoffDate)->toDateString();
        $query = $this->baseOpenAmortizationQuery()
            ->whereDate('due_date', '<=', $billingDate);
        $limitToNextSchedulePerLoan = false;

        if (! $query->exists()) {
            $query = $this->baseOpenAmortizationQuery();
            $limitToNextSchedulePerLoan = true;
        }

        $rows = $query->lazy(1000);

        if ($limitToNextSchedulePerLoan) {
            $rows = $rows->unique('loan_id');
        }

        return $rows
            ->map(function (LoanAmortization $amortization) use ($billingDate) {
                if (! $amortization->loan?->user?->memberProfile) {
                    return null;
                }

                $rowCutoffDate = $amortization->due_date?->gt(Carbon::parse($billingDate))
                    ? $amortization->due_date->toDateString()
                    : $billingDate;

                return $this->mapRow($amortization, $rowCutoffDate);
            })
            ->filter()
            ->values();
    }

    private function baseOpenAmortizationQuery()
    {
        return LoanAmortization::query()
            ->whereIn('status', LoanPaymentPostingService::OPEN_AMORTIZATION_STATUSES)
            ->whereHas('loan', function ($q) {
                $q->whereIn('status', ['approved', 'released'])
                    ->whereHas('user', function ($uq) {
                        $uq->where('is_active', true)
                            ->whereHas('memberProfile', function ($profileQuery) {
                                $profileQuery->where(function ($statusQuery) {
                                    $statusQuery
                                        ->where('account_status', 'active')
                                        ->orWhereNull('account_status');
                                });
                            });
                    });
            })
            ->with([
                'loan.user.memberProfile',
                'loan.loanType',
            ])
            ->orderBy('loan_id')
            ->orderBy('due_date')
            ->orderBy('installment_number');
    }

    private function mapRow(LoanAmortization $amortization, string $cutoffDate): ?array
    {
        // Safety net: never pull installments after the row cutoff or aggregate loan balance.
        if (! $amortization->due_date || $amortization->due_date->gt(Carbon::parse($cutoffDate))) {
            return null;
        }

        $user = $amortization->loan->user;
        $profile = $user->memberProfile;

        // Isolate THIS installment's outstanding amount only. Do NOT sum the
        // parent loan's remaining/principal balance here.
        $deductionAmount = $this->remainingForAmortization($amortization);

        if ($deductionAmount <= 0) {
            return null;
        }

        $membersId = (string) ($profile->members_id ?? '');
        $payrollId = (string) ($profile->payroll_id ?? '');
        $employeeName = trim(($profile->first_name ?? $user->first_name).' '.($profile->middle_name ?? $user->middle_name ?? '').' '.($profile->last_name ?? $user->last_name));
        $remarks = sprintf(
            'Salary deduction installment #%s due %s',
            $amortization->installment_number,
            $amortization->due_date?->toDateString() ?? $billingDate,
        );

        return [
            'members_id' => $membersId,
            'payroll_id' => $payrollId,
            'employee_name' => $employeeName,
            'cutoff_date' => $cutoffDate,
            'deduction_amount' => $deductionAmount,
            'remarks' => $remarks,
        ];
    }

    private function billingDateForCutoff(Carbon $cutoffDate): Carbon
    {
        $billingDate = $cutoffDate->copy();

        if ($billingDate->day <= 10) {
            return $billingDate->day(10);
        }

        if ($billingDate->day <= 25) {
            return $billingDate->day(25);
        }

        return $billingDate->addMonthNoOverflow()->day(10);
    }

    /**
     * Outstanding amount for THIS specific installment only.
     *
     * It is the difference between the installment's own `amount_due` and the
     * amount already paid against it. It deliberately does NOT touch the parent
     * loan's total principal, remaining balance, or any other installments.
     */
    private function remainingForAmortization(LoanAmortization $amortization): float
    {
        return max(0, round((float) $amortization->amount_due - (float) $amortization->amount_paid, 2));
    }

    /**
     * Aggregate rows by upload dedupe key to prevent duplicates in the exported file.
     * Key rules come from PayrollDeductionService::dedupeKey():
     * - prefer members_id
     * - else payroll_id
     */
    public function dedupeKey(array $row): ?string
    {
        foreach (['members_id', 'payroll_id'] as $identifier) {
            if (filled($row[$identifier] ?? null)) {
                return $identifier.':'.strtolower((string) $row[$identifier]).':'.(string) $row['cutoff_date'];
            }
        }

        return null;
    }

    public function aggregateRows(iterable $rows): array
    {
        $aggregated = [];

        foreach ($rows as $row) {
            $key = $this->dedupeKey($row);
            if (! $key) {
                continue;
            }

            if (! isset($aggregated[$key])) {
                $aggregated[$key] = $row;
                $aggregated[$key]['deduction_amount'] = (float) $row['deduction_amount'];

                continue;
            }

            $aggregated[$key]['deduction_amount'] = (float) $aggregated[$key]['deduction_amount'] + (float) $row['deduction_amount'];
            $aggregated[$key]['remarks'] = trim($aggregated[$key]['remarks'].'; '.$row['remarks']);
        }

        return array_values($aggregated);
    }
}
