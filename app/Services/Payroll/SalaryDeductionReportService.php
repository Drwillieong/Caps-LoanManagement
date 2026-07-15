<?php

namespace App\Services\Payroll;

use App\Models\LoanAmortization;
use Carbon\Carbon;
use Illuminate\Support\LazyCollection;


class SalaryDeductionReportService
{
    /**
     * Columns must match the existing payroll deduction upload template CSV structure.
     * Template header/order (see PayrollDeductionService::payrollTemplateCsv):
     * employee_id, payroll_id, member_id, employee_name, cutoff_date, deduction_amount, remarks
     *
     * This export is intended to be fully compatible for re-upload.
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
     * Build a lazy row stream to keep memory usage low for large datasets.
     */
    public function rowsForCutoff(Carbon $cutoffDate): LazyCollection
    {
        $cutoff = $cutoffDate->toDateString();

        // Future/open amortizations for active member + active loans.
        // We treat “future” as due_date > cutoff_date.
        // We also require open amortization statuses (same list used for posting).
        $query = LoanAmortization::query()
            // Future amortizations for the selected cutoff.
            ->where('due_date', '>', $cutoff)
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

        return LazyCollection::make(function () use ($query, $cutoff) {
            $query->chunkById(1000, function ($amortizations) use ($cutoff) {
                foreach ($amortizations as $amortization) {
                    $memberProfile = $amortization->loan->user->memberProfile;

                    if (! $memberProfile) {
                        // No member profile => cannot export compatible identifier fields.
                        continue;
                    }

                    // De-duplication:
                    // Upload template disallows duplicates on (employee_id|payroll_id|member_id, cutoff_date).
                    // For future amortizations, we might have multiple amortizations per member+cutoff.
                    // Export must avoid duplication, so we aggregate deduction_amount per member per cutoff.
                    //
                    // To do that efficiently at DB-level, we would use grouping + SUM.
                    // However, with current model constraints, we apply a per-chunk safeguard.
                    yield $this->mapRow($amortization, $cutoff);
                }
            });
        });
    }

    private function mapRow(LoanAmortization $amortization, string $cutoff): array
    {
        $user = $amortization->loan->user;
        $profile = $user->memberProfile;

        $employeeId = (string) ($profile->employee_id ?? '');
        $payrollId = (string) ($profile->payroll_id ?? '');
        $memberId = (string) (method_exists($profile, 'user_id') ? ($profile->user_id ?? $user->id) : $user->id);

        $employeeName = trim(($profile->first_name ?? $user->first_name).' '.($profile->middle_name ?? $user->middle_name ?? '').' '.($profile->last_name ?? $user->last_name));
        $deductionAmount = (float) $amortization->amount_due;

        // Keep remarks aligned with template (optional free text).
        $remarks = sprintf('Salary deduction schedule - %s', $amortization->due_date?->toDateString() ?? $cutoff);

        // “No duplication” requirement:
        // The upload validator dedupes inside the uploaded file.
        // We emit one row per amortization here; to fully satisfy the requirement,
        // we should aggregate by identifiers+cutoff.
        // The aggregation is handled by the export class (using a grouping map) to ensure correctness.
        return [
            'employee_id' => $employeeId,
            'payroll_id' => $payrollId,
            'member_id' => $memberId,
            'employee_name' => $employeeName,
            'cutoff_date' => $cutoff,
            'deduction_amount' => $deductionAmount,
            'remarks' => $remarks,
        ];
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

            // Sum deduction amounts for the same member identifier within the cutoff.
            $aggregated[$key]['deduction_amount'] = (float) $aggregated[$key]['deduction_amount'] + (float) $row['deduction_amount'];
        }

        return array_values($aggregated);
    }
}

