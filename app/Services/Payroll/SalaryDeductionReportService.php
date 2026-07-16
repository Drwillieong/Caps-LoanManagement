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
            'employee_id',
            'payroll_id',
            'member_id',
            'employee_name',
            'cutoff_date',
            'deduction_amount',
            'remarks',
        ];
    }

    /**
     * Export only the unpaid amortization installment for the selected billing period.
     *
     * Schedules in this system are generated on the 10th and 25th. A selected cutoff
     * from the 1st-10th maps to the 10th; any later cutoff maps to the 25th.
     */
    public function rowsForCutoff(Carbon $cutoffDate): LazyCollection
    {
        $billingDate = $this->billingDateForCutoff($cutoffDate)->toDateString();

        $query = LoanAmortization::query()
            ->whereDate('due_date', $billingDate)
            ->whereIn('status', LoanPaymentPostingService::OPEN_AMORTIZATION_STATUSES)
            ->whereHas('loan', function ($q) {
                $q->whereIn('status', ['approved', 'released'])
                    ->whereHas('user', fn ($uq) => $uq->where('is_active', true));
            })
            ->with([
                'loan.user.memberProfile',
                'loan.loanType',
            ])
            ->orderBy('loan_id')
            ->orderBy('due_date')
            ->orderBy('installment_number');

        return $query
            ->lazy(1000)
            ->map(function (LoanAmortization $amortization) use ($billingDate) {
                if (! $amortization->loan?->user?->memberProfile) {
                    return null;
                }

                return $this->mapRow($amortization, $billingDate);
            })
            ->filter()
            ->values();
    }

    private function mapRow(LoanAmortization $amortization, string $billingDate): ?array
    {
        $user = $amortization->loan->user;
        $profile = $user->memberProfile;
        $deductionAmount = $this->remainingForAmortization($amortization);

        if ($deductionAmount <= 0) {
            return null;
        }

        $employeeId = (string) ($profile->employee_id ?? '');
        $payrollId = (string) ($profile->payroll_id ?? '');
        $memberId = (string) ($profile->user_id ?? $user->id);
        $employeeName = trim(($profile->first_name ?? $user->first_name).' '.($profile->middle_name ?? $user->middle_name ?? '').' '.($profile->last_name ?? $user->last_name));
        $remarks = sprintf(
            'Salary deduction installment #%s due %s',
            $amortization->installment_number,
            $amortization->due_date?->toDateString() ?? $billingDate,
        );

        return [
            'employee_id' => $employeeId,
            'payroll_id' => $payrollId,
            'member_id' => $memberId,
            'employee_name' => $employeeName,
            'cutoff_date' => $billingDate,
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

        return $billingDate->day(25);
    }

    private function remainingForAmortization(LoanAmortization $amortization): float
    {
        return max(0, round((float) $amortization->amount_due - (float) $amortization->amount_paid, 2));
    }

    /**
     * Aggregate rows by upload dedupe key to prevent duplicates in the exported file.
     * Key rules come from PayrollDeductionService::dedupeKey():
     * - prefer employee_id
     * - else payroll_id
     * - else member_id
     */
    public function dedupeKey(array $row): ?string
    {
        foreach (['employee_id', 'payroll_id', 'member_id'] as $identifier) {
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
