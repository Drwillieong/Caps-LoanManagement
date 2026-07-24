<?php

namespace App\Services\Payroll;

use App\Models\DeductionRecord;
use App\Models\Loan;
use App\Models\LoanAmortization;
use App\Models\LoanPayment;
use App\Models\LoanTransaction;
use App\Models\MemberProfile;
use App\Models\User;
use Carbon\CarbonInterface;
use Illuminate\Support\Collection;

class LoanPaymentPostingService
{
    public const OPEN_AMORTIZATION_STATUSES = [
        'pending',
        'partial',
        'overdue',
        'missed',
        'deferred',
    ];

    public function applyMemberPayrollDeduction(
        MemberProfile $memberProfile,
        float $amount,
        CarbonInterface $cutoffDate,
        User $processedBy,
        array $context = [],
    ): array {
        $openSchedules = $this->openSchedulesForMember($memberProfile, $cutoffDate, $amount);

        if ($openSchedules->isEmpty()) {
            return [
                'status' => 'skipped',
                'expected_amount' => 0.0,
                'applied_amount' => 0.0,
                'unapplied_amount' => $amount,
                'records' => [],
                'message' => 'No open amortization schedule found for this cutoff.',
            ];
        }

        if ($amount <= 0) {
            $record = $this->markMissed($openSchedules->first(), $cutoffDate, $processedBy, $context);

            return [
                'status' => 'missed',
                'expected_amount' => $record->expected_amount,
                'applied_amount' => 0.0,
                'unapplied_amount' => 0.0,
                'records' => [$record],
                'message' => 'No payroll deduction was posted for this cutoff.',
            ];
        }

        $remaining = $amount;
        $records = [];
        $expectedAmount = 0.0;
        $appliedAmount = 0.0;
        $hadPartial = false;

        foreach ($openSchedules as $amortization) {
            if ($remaining <= 0) {
                break;
            }

            $expectedRemaining = $this->remainingForAmortization($amortization);

            if ($expectedRemaining <= 0) {
                continue;
            }

            $expectedAmount += $expectedRemaining;
            $applied = min($remaining, $expectedRemaining);
            $posted = $this->postPaymentToAmortization(
                $amortization,
                $applied,
                $cutoffDate,
                $processedBy,
                [
                    ...$context,
                    'payment_method' => 'salary_deduction',
                    'transaction_type' => 'salary_deduction',
                    'deduction_status' => $applied < $expectedRemaining ? 'partial' : 'paid',
                ],
            );

            $records[] = $posted['deduction_record'];
            $appliedAmount += $applied;
            $remaining -= $applied;

            if ($applied < $expectedRemaining) {
                $hadPartial = true;
                break;
            }
        }

        return [
            'status' => $hadPartial ? 'partial' : 'paid',
            'expected_amount' => $expectedAmount,
            'applied_amount' => $appliedAmount,
            'unapplied_amount' => max(0, $remaining),
            'records' => $records,
            'message' => $hadPartial
                ? 'Payroll deduction partially covered the expected amortization.'
                : 'Payroll deduction was applied successfully.',
        ];
    }

    public function applyManualPayment(
        Loan $loan,
        float $amount,
        CarbonInterface $paymentDate,
        User $processedBy,
        array $context = [],
    ): array {
        $openSchedules = LoanAmortization::query()
            ->where('loan_id', $loan->id)
            ->whereIn('status', self::OPEN_AMORTIZATION_STATUSES)
            ->orderBy('due_date')
            ->orderBy('installment_number')
            ->lockForUpdate()
            ->get();

        if ($openSchedules->isEmpty()) {
            return [
                'status' => 'skipped',
                'expected_amount' => 0.0,
                'applied_amount' => 0.0,
                'unapplied_amount' => $amount,
                'records' => [],
                'message' => 'No open amortization schedule found for this loan.',
            ];
        }

        $remaining = $amount;
        $records = [];
        $expectedAmount = 0.0;
        $appliedAmount = 0.0;

        foreach ($openSchedules as $amortization) {
            if ($remaining <= 0) {
                break;
            }

            $expectedRemaining = $this->remainingForAmortization($amortization);

            if ($expectedRemaining <= 0) {
                continue;
            }

            $expectedAmount += $expectedRemaining;
            $applied = min($remaining, $expectedRemaining);
            $posted = $this->postPaymentToAmortization(
                $amortization,
                $applied,
                $paymentDate,
                $processedBy,
                [
                    ...$context,
                    'payment_method' => $context['payment_method'] ?? 'cash',
                    'transaction_type' => 'manual_payment',
                    'deduction_status' => 'manual_payment',
                ],
            );

            $records[] = $posted['deduction_record'];
            $appliedAmount += $applied;
            $remaining -= $applied;
        }

        return [
            'status' => 'manual_payment',
            'expected_amount' => $expectedAmount,
            'applied_amount' => $appliedAmount,
            'unapplied_amount' => max(0, $remaining),
            'records' => $records,
            'message' => 'Manual payment was recorded.',
        ];
    }

    public function markMissed(
        LoanAmortization $amortization,
        CarbonInterface $cutoffDate,
        User $processedBy,
        array $context = [],
    ): DeductionRecord {
        $amortization = LoanAmortization::query()
            ->whereKey($amortization->id)
            ->lockForUpdate()
            ->firstOrFail();

        $loan = Loan::query()->whereKey($amortization->loan_id)->lockForUpdate()->firstOrFail();
        $expectedRemaining = $this->remainingForAmortization($amortization);
        $balanceAfter = $this->loanBalance($loan);

        if ((float) $amortization->amount_paid <= 0) {
            $amortization->update(['status' => 'missed']);
        }

        $record = DeductionRecord::create([
            'loan_id' => $loan->id,
            'loan_amortization_id' => $amortization->id,
            'payroll_upload_id' => $context['payroll_upload_id'] ?? null,
            'payroll_upload_row_id' => $context['payroll_upload_row_id'] ?? null,
            'member_profile_id' => $context['member_profile_id'] ?? $loan->user?->memberProfile?->id,
            'processed_by' => $processedBy->id,
            'cutoff_date' => $cutoffDate->toDateString(),
            'expected_amount' => $expectedRemaining,
            'deducted_amount' => 0,
            'status' => 'missed',
            'payment_method' => 'salary_deduction',
            'balance_after' => $balanceAfter,
            'reference_number' => $context['reference_number'] ?? null,
            'remarks' => $context['remarks'] ?? 'No payroll deduction received for this cutoff.',
            'processed_at' => now(),
        ]);

        LoanTransaction::create([
            'loan_id' => $loan->id,
            'loan_amortization_id' => $amortization->id,
            'payroll_upload_id' => $context['payroll_upload_id'] ?? null,
            'payroll_upload_row_id' => $context['payroll_upload_row_id'] ?? null,
            'processed_by' => $processedBy->id,
            'transaction_type' => 'missed_deduction',
            'amount' => 0,
            'transaction_date' => $cutoffDate->toDateString(),
            'balance_after' => $balanceAfter,
            'reference_number' => $context['reference_number'] ?? null,
            'remarks' => $record->remarks,
            'meta' => [
                'expected_amount' => $expectedRemaining,
                'source' => 'payroll_upload',
            ],
        ]);

        return $record;
    }

    public function loanBalance(Loan $loan): float
    {
        $totalPaid = (float) LoanPayment::query()
            ->where('loan_id', $loan->id)
            ->sum('amount');

        return max(0, round((float) $loan->total_amount_due - $totalPaid, 2));
    }

    private function openSchedulesForMember(MemberProfile $memberProfile, CarbonInterface $cutoffDate, float $amount): Collection
    {
        $query = LoanAmortization::query()
            ->whereIn('status', self::OPEN_AMORTIZATION_STATUSES)
            ->whereHas('loan', function ($query) use ($memberProfile) {
                $query->where('user_id', $memberProfile->user_id)
                    ->whereIn('status', ['approved', 'released']);
            })
            ->orderBy('due_date')
            ->orderBy('installment_number')
            ->lockForUpdate();

        $dueSchedules = (clone $query)
            ->whereDate('due_date', '<=', $cutoffDate->toDateString())
            ->get();

        if ($dueSchedules->isNotEmpty() || $amount <= 0) {
            return $dueSchedules;
        }

        return $query->get();
    }

    private function postPaymentToAmortization(
        LoanAmortization $amortization,
        float $amount,
        CarbonInterface $paymentDate,
        User $processedBy,
        array $context,
    ): array {
        $loan = Loan::query()->whereKey($amortization->loan_id)->lockForUpdate()->firstOrFail();
        $expectedRemaining = $this->remainingForAmortization($amortization);
        $newPaidAmount = round((float) $amortization->amount_paid + $amount, 2);
        $isFullyPaid = $newPaidAmount + 0.005 >= (float) $amortization->amount_due;
        $paymentMethod = $context['payment_method'] ?? 'salary_deduction';
        $paidBy = $context['paid_by'] ?? trim($loan->user->first_name.' '.$loan->user->last_name);
        $referenceNumber = $context['reference_number'] ?? null;
        $remarks = $context['remarks'] ?? null;

        LoanPayment::create([
            'loan_id' => $loan->id,
            'loan_amortization_id' => $amortization->id,
            'payroll_upload_id' => $context['payroll_upload_id'] ?? null,
            'amount' => $amount,
            'payment_method' => $paymentMethod,
            'payment_date' => $paymentDate->toDateString(),
            'reference_number' => $referenceNumber,
            'paid_by' => $paidBy,
            'processed_by' => $processedBy->id,
            'remarks' => $remarks,
        ]);

        $amortization->update([
            'amount_paid' => min((float) $amortization->amount_due, $newPaidAmount),
            'status' => $isFullyPaid ? 'paid' : 'partial',
        ]);

        $balanceAfter = $this->loanBalance($loan);

        if ($balanceAfter <= 0) {
            $loan->update(['status' => 'paid_off']);
        }

        $deductionStatus = $context['deduction_status'] ?? ($isFullyPaid ? 'paid' : 'partial');

        $record = DeductionRecord::create([
            'loan_id' => $loan->id,
            'loan_amortization_id' => $amortization->id,
            'payroll_upload_id' => $context['payroll_upload_id'] ?? null,
            'payroll_upload_row_id' => $context['payroll_upload_row_id'] ?? null,
            'member_profile_id' => $context['member_profile_id'] ?? $loan->user?->memberProfile?->id,
            'processed_by' => $processedBy->id,
            'cutoff_date' => ($context['cutoff_date'] ?? $paymentDate)->toDateString(),
            'expected_amount' => $expectedRemaining,
            'deducted_amount' => $amount,
            'status' => $deductionStatus,
            'payment_method' => $paymentMethod,
            'balance_after' => $balanceAfter,
            'reference_number' => $referenceNumber,
            'remarks' => $remarks,
            'processed_at' => now(),
        ]);

        LoanTransaction::create([
            'loan_id' => $loan->id,
            'loan_amortization_id' => $amortization->id,
            'payroll_upload_id' => $context['payroll_upload_id'] ?? null,
            'payroll_upload_row_id' => $context['payroll_upload_row_id'] ?? null,
            'processed_by' => $processedBy->id,
            'transaction_type' => $context['transaction_type'] ?? $paymentMethod,
            'amount' => $amount,
            'transaction_date' => $paymentDate->toDateString(),
            'balance_after' => $balanceAfter,
            'reference_number' => $referenceNumber,
            'remarks' => $remarks,
            'meta' => [
                'payment_method' => $paymentMethod,
                'deduction_status' => $deductionStatus,
                'expected_amount' => $expectedRemaining,
            ],
        ]);

        return [
            'deduction_record' => $record,
            'balance_after' => $balanceAfter,
        ];
    }

    private function remainingForAmortization(LoanAmortization $amortization): float
    {
        return max(0, round((float) $amortization->amount_due - (float) $amortization->amount_paid, 2));
    }
}
