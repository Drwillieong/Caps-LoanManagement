<?php

namespace App\Services;

use App\Models\Loan;
use App\Models\LoanSettlementRequest;
use App\Models\User;
use App\Services\Payroll\LoanPaymentPostingService;
use Carbon\CarbonInterface;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class LoanSettlementService
{
    public function __construct(
        protected LoanPaymentPostingService $postingService,
    ) {}

    public function calculate(Loan $loan): array
    {
        $loan->loadMissing(['payments', 'amortizations']);

        $totalPaid = (float) $loan->payments->sum('amount');
        $outstandingBalance = max(0, round((float) $loan->total_amount_due - $totalPaid, 2));
        $openSchedules = $loan->amortizations->whereIn('status', LoanPaymentPostingService::OPEN_AMORTIZATION_STATUSES);
        $openScheduleBalance = $openSchedules->sum(fn ($schedule) => max(0, (float) $schedule->amount_due - (float) $schedule->amount_paid));
        $hasPendingRequest = LoanSettlementRequest::query()
            ->where('loan_id', $loan->id)
            ->where('status', LoanSettlementRequest::STATUS_PENDING)
            ->exists();

        return [
            'outstanding_balance' => $outstandingBalance,
            'settlement_amount' => $outstandingBalance,
            'breakdown' => [
                'principal_balance' => null,
                'applicable_interest' => null,
                'penalties_or_charges' => 0.0,
                'discounts' => 0.0,
                'scheduled_balance' => round((float) $openScheduleBalance, 2),
                'total_paid' => round($totalPaid, 2),
                'calculation_basis' => 'Existing LMS balance: total amount due minus posted loan payments. Early-settlement interest/discount rules are not yet configured.',
            ],
            'eligibility_checks' => [
                ['label' => 'Loan is active', 'passed' => in_array($loan->status, ['approved', 'released'], true)],
                ['label' => 'Outstanding balance remains', 'passed' => $outstandingBalance > 0],
                ['label' => 'No duplicate pending settlement request', 'passed' => ! $hasPendingRequest],
            ],
            'is_eligible' => in_array($loan->status, ['approved', 'released'], true)
                && $outstandingBalance > 0
                && ! $hasPendingRequest,
        ];
    }

    public function createRequest(Loan $loan, User $member): LoanSettlementRequest
    {
        return DB::transaction(function () use ($loan, $member) {
            $lockedLoan = Loan::query()
                ->with(['payments', 'amortizations'])
                ->whereKey($loan->id)
                ->lockForUpdate()
                ->firstOrFail();

            $calculation = $this->calculate($lockedLoan);

            if (! $calculation['is_eligible']) {
                throw ValidationException::withMessages([
                    'loan_id' => 'This loan is not eligible for full settlement request.',
                ]);
            }

            return LoanSettlementRequest::create([
                'loan_id' => $lockedLoan->id,
                'requested_by' => $member->id,
                'outstanding_balance' => $calculation['outstanding_balance'],
                'settlement_amount' => $calculation['settlement_amount'],
                'calculation_breakdown' => $calculation['breakdown'],
                'eligibility_checks' => $calculation['eligibility_checks'],
                'status' => LoanSettlementRequest::STATUS_PENDING,
            ]);
        }, 3);
    }

    public function approve(LoanSettlementRequest $request, User $gm): LoanSettlementRequest
    {
        return DB::transaction(function () use ($request, $gm) {
            $settlement = LoanSettlementRequest::query()->whereKey($request->id)->lockForUpdate()->firstOrFail();

            if ($settlement->status !== LoanSettlementRequest::STATUS_PENDING) {
                throw ValidationException::withMessages(['status' => 'Only pending settlement requests can be approved.']);
            }

            $settlement->update([
                'status' => LoanSettlementRequest::STATUS_FOR_PAYMENT,
                'reviewed_by' => $gm->id,
                'approved_at' => now(),
            ]);

            return $settlement->fresh(['loan.user']);
        }, 3);
    }

    public function reject(LoanSettlementRequest $request, User $gm, string $reason): LoanSettlementRequest
    {
        return DB::transaction(function () use ($request, $gm, $reason) {
            $settlement = LoanSettlementRequest::query()->whereKey($request->id)->lockForUpdate()->firstOrFail();

            if ($settlement->status !== LoanSettlementRequest::STATUS_PENDING) {
                throw ValidationException::withMessages(['status' => 'Only pending settlement requests can be rejected.']);
            }

            $settlement->update([
                'status' => LoanSettlementRequest::STATUS_REJECTED,
                'reviewed_by' => $gm->id,
                'rejection_reason' => $reason,
                'rejected_at' => now(),
            ]);

            return $settlement->fresh(['loan.user']);
        }, 3);
    }

    public function recordVerifiedPayment(
        LoanSettlementRequest $request,
        User $gm,
        float $amount,
        CarbonInterface $paymentDate,
        string $paymentMethod,
        ?string $referenceNumber,
        ?string $remarks,
    ): array {
        return DB::transaction(function () use ($request, $gm, $amount, $paymentDate, $paymentMethod, $referenceNumber, $remarks) {
            $settlement = LoanSettlementRequest::query()
                ->with('loan.user')
                ->whereKey($request->id)
                ->lockForUpdate()
                ->firstOrFail();

            if (! in_array($settlement->status, [LoanSettlementRequest::STATUS_APPROVED, LoanSettlementRequest::STATUS_FOR_PAYMENT], true)) {
                throw ValidationException::withMessages(['status' => 'This settlement request is not ready for payment verification.']);
            }

            $current = $this->calculate($settlement->loan);
            $requiredAmount = (float) $current['settlement_amount'];

            if (round($amount, 2) + 0.005 < $requiredAmount) {
                throw ValidationException::withMessages([
                    'amount' => 'The verified payment must cover the full current settlement amount of PHP '.number_format($requiredAmount, 2).'.',
                ]);
            }

            $result = $this->postingService->applyManualPayment(
                $settlement->loan,
                $requiredAmount,
                $paymentDate,
                $gm,
                [
                    'payment_method' => $paymentMethod,
                    'reference_number' => $referenceNumber,
                    'remarks' => $remarks ?? 'Full loan settlement payment verified by GM.',
                    'paid_by' => trim($settlement->loan->user->first_name.' '.$settlement->loan->user->last_name),
                ],
            );

            if ((float) $result['applied_amount'] + 0.005 < $requiredAmount) {
                throw ValidationException::withMessages(['amount' => 'The posted payment did not fully settle the loan.']);
            }

            $settlement->update([
                'status' => LoanSettlementRequest::STATUS_COMPLETED,
                'outstanding_balance' => $current['outstanding_balance'],
                'settlement_amount' => $requiredAmount,
                'calculation_breakdown' => $current['breakdown'],
                'eligibility_checks' => $current['eligibility_checks'],
                'verified_by' => $gm->id,
                'payment_method' => $paymentMethod,
                'reference_number' => $referenceNumber,
                'payment_date' => $paymentDate->toDateString(),
                'verified_at' => now(),
            ]);

            return ['settlement' => $settlement->fresh(['loan.user']), 'posting' => $result];
        }, 3);
    }
}
