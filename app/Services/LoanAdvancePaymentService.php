<?php

namespace App\Services;

use App\Models\Loan;
use App\Models\LoanAdvancePaymentRequest;
use App\Models\User;
use App\Services\Payroll\LoanPaymentPostingService;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class LoanAdvancePaymentService
{
    public function __construct(
        protected LoanPaymentPostingService $postingService,
    ) {}

    public function calculate(Loan $loan, ?int $ignoreAdvancePaymentRequestId = null): array
    {
        $loan->loadMissing(['payments', 'amortizations', 'advancePaymentRequests']);

        $openSchedules = $loan->amortizations
            ->whereIn('status', LoanPaymentPostingService::OPEN_AMORTIZATION_STATUSES)
            ->sortBy([['due_date', 'asc'], ['installment_number', 'asc']])
            ->values();
        $regularDeduction = (float) ($openSchedules->first()?->amount_due ?? ($loan->monthly_amortization / 2));
        $outstandingBalance = $this->outstandingBalance($loan);
        $advanceableAmount = round((float) $openSchedules->sum(fn ($schedule) => max(0, (float) $schedule->amount_due - (float) $schedule->amount_paid)), 2);
        $hasBlockingRequest = LoanAdvancePaymentRequest::query()
            ->where('loan_id', $loan->id)
            ->whereIn('status', LoanAdvancePaymentRequest::BLOCKING_STATUSES)
            ->when($ignoreAdvancePaymentRequestId, fn ($query) => $query->whereKeyNot($ignoreAdvancePaymentRequestId))
            ->exists();

        return [
            'outstanding_balance' => $outstandingBalance,
            'regular_deduction_amount' => round($regularDeduction, 2),
            'next_due_date' => $openSchedules->first()?->due_date?->toDateString(),
            'remaining_installments' => $openSchedules->count(),
            'maximum_advance_amount' => min($outstandingBalance, $advanceableAmount),
            'is_eligible' => in_array($loan->status, ['approved', 'released'], true)
                && $outstandingBalance > 0
                && $regularDeduction > 0
                && $openSchedules->isNotEmpty()
                && ! $hasBlockingRequest,
            'eligibility_checks' => [
                ['label' => 'Loan is active', 'passed' => in_array($loan->status, ['approved', 'released'], true)],
                ['label' => 'Outstanding balance remains', 'passed' => $outstandingBalance > 0],
                ['label' => 'Open scheduled installments remain', 'passed' => $openSchedules->isNotEmpty()],
                ['label' => 'No active advance payment request', 'passed' => ! $hasBlockingRequest],
            ],
        ];
    }

    public function createRequest(Loan $loan, User $member, array $data, ?UploadedFile $proof = null): LoanAdvancePaymentRequest
    {
        return DB::transaction(function () use ($loan, $member, $data, $proof) {
            $lockedLoan = Loan::query()
                ->with(['payments', 'amortizations', 'advancePaymentRequests'])
                ->whereKey($loan->id)
                ->lockForUpdate()
                ->firstOrFail();

            if ($lockedLoan->user_id !== $member->id) {
                throw ValidationException::withMessages(['loan_id' => 'You can only request advance payment for your own loan.']);
            }

            $calculation = $this->calculate($lockedLoan);
            $amount = round((float) $data['requested_amount'], 2);
            $installments = $this->validateRequestedAmount($amount, $calculation);
            $proofPath = $proof?->store('advance-payment-proofs', 'public');

            return LoanAdvancePaymentRequest::create([
                'loan_id' => $lockedLoan->id,
                'requested_by' => $member->id,
                'outstanding_balance' => $calculation['outstanding_balance'],
                'regular_deduction_amount' => $calculation['regular_deduction_amount'],
                'requested_amount' => $amount,
                'installments_covered' => $installments,
                'payment_method' => $data['payment_method'],
                'expected_payment_date' => $data['expected_payment_date'] ?? null,
                'reference_number' => $data['reference_number'] ?? null,
                'payment_proof_path' => $proofPath,
                'remarks' => $data['remarks'] ?? null,
                'status' => LoanAdvancePaymentRequest::STATUS_PENDING_VALIDATION,
                'calculation_snapshot' => $calculation,
            ]);
        }, 3);
    }

    public function approve(LoanAdvancePaymentRequest $request, User $gm): LoanAdvancePaymentRequest
    {
        return DB::transaction(function () use ($request, $gm) {
            $advance = LoanAdvancePaymentRequest::query()->whereKey($request->id)->lockForUpdate()->firstOrFail();

            if ($advance->status !== LoanAdvancePaymentRequest::STATUS_PENDING_VALIDATION) {
                throw ValidationException::withMessages(['status' => 'Only pending advance payment requests can be approved.']);
            }

            $advance->update([
                'status' => $advance->payment_method === LoanAdvancePaymentRequest::PAYMENT_METHOD_SALARY_DEDUCTION
                    ? LoanAdvancePaymentRequest::STATUS_SCHEDULED_FOR_SALARY_DEDUCTION
                    : LoanAdvancePaymentRequest::STATUS_AWAITING_PAYMENT,
                'reviewed_by' => $gm->id,
                'approved_at' => now(),
            ]);

            return $advance->fresh(['loan.user']);
        }, 3);
    }

    public function reject(LoanAdvancePaymentRequest $request, User $gm, string $reason): LoanAdvancePaymentRequest
    {
        return DB::transaction(function () use ($request, $gm, $reason) {
            $advance = LoanAdvancePaymentRequest::query()->whereKey($request->id)->lockForUpdate()->firstOrFail();

            if ($advance->status !== LoanAdvancePaymentRequest::STATUS_PENDING_VALIDATION) {
                throw ValidationException::withMessages(['status' => 'Only pending advance payment requests can be rejected.']);
            }

            $advance->update([
                'status' => LoanAdvancePaymentRequest::STATUS_REJECTED,
                'reviewed_by' => $gm->id,
                'rejection_reason' => $reason,
                'rejected_at' => now(),
            ]);

            return $advance->fresh(['loan.user']);
        }, 3);
    }

    public function submitPayment(LoanAdvancePaymentRequest $request, User $member, array $data, ?UploadedFile $proof = null): LoanAdvancePaymentRequest
    {
        return DB::transaction(function () use ($request, $member, $data, $proof) {
            $advance = LoanAdvancePaymentRequest::query()->whereKey($request->id)->lockForUpdate()->firstOrFail();

            if ($advance->requested_by !== $member->id) {
                throw ValidationException::withMessages(['request' => 'You can only update your own advance payment request.']);
            }

            if (! in_array($advance->status, [LoanAdvancePaymentRequest::STATUS_AWAITING_PAYMENT], true)) {
                throw ValidationException::withMessages(['status' => 'This advance payment request is not awaiting member payment.']);
            }

            $advance->update([
                'payment_date' => $data['payment_date'],
                'reference_number' => $data['reference_number'] ?? $advance->reference_number,
                'payment_proof_path' => $proof?->store('advance-payment-proofs', 'public') ?? $advance->payment_proof_path,
                'remarks' => $data['remarks'] ?? $advance->remarks,
                'status' => LoanAdvancePaymentRequest::STATUS_PAYMENT_SUBMITTED,
                'payment_submitted_at' => now(),
            ]);

            return $advance->fresh(['loan.user']);
        }, 3);
    }

    public function verifyAndApply(LoanAdvancePaymentRequest $request, User $verifier, array $data): array
    {
        return DB::transaction(function () use ($request, $verifier, $data) {
            $advance = LoanAdvancePaymentRequest::query()
                ->with('loan.user')
                ->whereKey($request->id)
                ->lockForUpdate()
                ->firstOrFail();

            if ($advance->applied_at) {
                throw ValidationException::withMessages(['status' => 'This advance payment was already applied.']);
            }

            if (! in_array($advance->status, [
                LoanAdvancePaymentRequest::STATUS_AWAITING_PAYMENT,
                LoanAdvancePaymentRequest::STATUS_PAYMENT_SUBMITTED,
                LoanAdvancePaymentRequest::STATUS_SCHEDULED_FOR_SALARY_DEDUCTION,
            ], true)) {
                throw ValidationException::withMessages(['status' => 'This advance payment is not ready for verification.']);
            }

            $amount = round((float) $data['amount'], 2);
            if (abs($amount - (float) $advance->requested_amount) > 0.005) {
                throw ValidationException::withMessages(['amount' => 'The verified amount must match the approved advance payment amount.']);
            }

            $current = $this->calculate($advance->loan, $advance->id);
            $this->validateRequestedAmount($amount, $current);

            $advance->update([
                'status' => LoanAdvancePaymentRequest::STATUS_PAYMENT_VERIFIED,
                'verified_by' => $verifier->id,
                'payment_date' => $data['payment_date'],
                'reference_number' => $data['reference_number'] ?? $advance->reference_number,
                'remarks' => $data['remarks'] ?? $advance->remarks,
                'verified_at' => now(),
            ]);

            $posting = $this->postingService->applyManualPayment(
                $advance->loan,
                $amount,
                $data['payment_date'],
                $verifier,
                [
                    'payment_method' => $advance->payment_method,
                    'reference_number' => $advance->reference_number,
                    'remarks' => $advance->remarks ?? 'Advance payment verified and applied.',
                    'paid_by' => trim($advance->loan->user->first_name.' '.$advance->loan->user->last_name),
                    'transaction_type' => 'advance_payment',
                    'deduction_status' => 'manual_payment',
                ],
            );

            if (round((float) $posting['applied_amount'], 2) + 0.005 < $amount) {
                throw ValidationException::withMessages(['amount' => 'The advance payment could not be fully applied to open installments.']);
            }

            $advance->update([
                'status' => LoanAdvancePaymentRequest::STATUS_COMPLETED,
                'applied_at' => now(),
            ]);

            return ['advance' => $advance->fresh(['loan.user']), 'posting' => $posting];
        }, 3);
    }

    private function validateRequestedAmount(float $amount, array $calculation): int
    {
        $regularDeduction = (float) $calculation['regular_deduction_amount'];

        if (! $calculation['is_eligible']) {
            throw ValidationException::withMessages(['loan_id' => 'This loan is not eligible for advance payment request.']);
        }

        if ($amount + 0.005 < $regularDeduction) {
            throw ValidationException::withMessages(['requested_amount' => 'The advance payment must cover at least one regular deduction.']);
        }

        if ($amount - 0.005 > (float) $calculation['maximum_advance_amount']) {
            throw ValidationException::withMessages(['requested_amount' => 'The advance payment cannot exceed the remaining open installment balance.']);
        }

        $installments = $regularDeduction > 0 ? $amount / $regularDeduction : 0;
        if (abs($installments - round($installments)) > 0.005) {
            throw ValidationException::withMessages(['requested_amount' => 'The advance payment must be a multiple of the regular deduction amount.']);
        }

        return (int) round($installments);
    }

    private function outstandingBalance(Loan $loan): float
    {
        return max(0, round((float) $loan->total_amount_due - (float) $loan->payments->sum('amount'), 2));
    }
}
