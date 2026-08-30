<?php

namespace App\Http\Controllers;

use App\Http\Requests\RejectLoanSettlementRequest;
use App\Http\Requests\StoreLoanSettlementRequest;
use App\Http\Requests\VerifyLoanSettlementPaymentRequest;
use App\Models\Loan;
use App\Models\LoanSettlementRequest;
use App\Services\ActivityLogService;
use App\Services\LoanSettlementService;
use App\Services\NotificationService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;

class LoanSettlementRequestController extends Controller
{
    public function store(StoreLoanSettlementRequest $request, Loan $loan, LoanSettlementService $settlementService)
    {
        $settlement = $settlementService->createRequest($loan, $request->user());

        app(ActivityLogService::class)->logActivity(
            'settlement_requested',
            $loan->id,
            'Requested full settlement for loan #'.$loan->id.'.'
        );

        return back()->with('success', 'Full settlement request submitted for GM validation.');
    }

    public function index(Request $request, LoanSettlementService $settlementService)
    {
        $this->authorize('viewAny', LoanSettlementRequest::class);

        $settlements = LoanSettlementRequest::query()
            ->with(['loan.user.memberProfile', 'loan.loanType', 'loan.payments', 'loan.amortizations', 'requester', 'reviewer', 'verifier'])
            ->latest()
            ->get()
            ->map(function (LoanSettlementRequest $settlement) use ($settlementService) {
                $current = $settlementService->calculate($settlement->loan);

                return [
                    'id' => $settlement->id,
                    'status' => $settlement->status,
                    'outstanding_balance' => (float) $settlement->outstanding_balance,
                    'settlement_amount' => (float) $settlement->settlement_amount,
                    'current_settlement_amount' => (float) $current['settlement_amount'],
                    'calculation_breakdown' => $settlement->calculation_breakdown ?? $current['breakdown'],
                    'eligibility_checks' => $settlement->eligibility_checks ?? $current['eligibility_checks'],
                    'rejection_reason' => $settlement->rejection_reason,
                    'payment_method' => $settlement->payment_method,
                    'reference_number' => $settlement->reference_number,
                    'payment_date' => $settlement->payment_date?->format('Y-m-d'),
                    'created_at' => $settlement->created_at?->format('Y-m-d H:i:s'),
                    'approved_at' => $settlement->approved_at?->format('Y-m-d H:i:s'),
                    'verified_at' => $settlement->verified_at?->format('Y-m-d H:i:s'),
                    'loan' => [
                        'id' => $settlement->loan->id,
                        'status' => $settlement->loan->status,
                        'loan_type' => $settlement->loan->loanType?->name ?? 'Loan',
                        'principal_amount' => (float) $settlement->loan->principal_amount,
                        'total_amount_due' => (float) $settlement->loan->total_amount_due,
                        'monthly_amortization' => (float) $settlement->loan->monthly_amortization,
                        'release_date' => $settlement->loan->release_date?->format('Y-m-d'),
                        'total_paid' => (float) $settlement->loan->payments->sum('amount'),
                    ],
                    'member' => [
                        'id' => $settlement->loan->user->id,
                        'name' => trim($settlement->loan->user->first_name.' '.($settlement->loan->user->middle_name ?? '').' '.$settlement->loan->user->last_name),
                        'email' => $settlement->loan->user->email,
                        'member_id' => $settlement->loan->user->memberProfile?->members_id ?? 'N/A',
                        'payroll_id' => $settlement->loan->user->memberProfile?->payroll_id,
                        'basic_salary' => (float) ($settlement->loan->user->memberProfile?->basic_salary ?? 0),
                    ],
                    'payments' => $settlement->loan->payments->sortByDesc('payment_date')->map(fn ($payment) => [
                        'id' => $payment->id,
                        'payment_date' => $payment->payment_date?->format('Y-m-d'),
                        'amount' => (float) $payment->amount,
                        'payment_method' => $payment->payment_method,
                        'reference_number' => $payment->reference_number,
                    ])->values(),
                ];
            });

        return Inertia::render('dashboards/Gm/SettlementRequests', [
            'settlementRequests' => $settlements,
            'stats' => [
                'pending' => $settlements->where('status', LoanSettlementRequest::STATUS_PENDING)->count(),
                'for_payment' => $settlements->where('status', LoanSettlementRequest::STATUS_FOR_PAYMENT)->count(),
                'completed' => $settlements->where('status', LoanSettlementRequest::STATUS_COMPLETED)->count(),
            ],
        ]);
    }

    public function approve(Request $request, LoanSettlementRequest $settlementRequest, LoanSettlementService $settlementService)
    {
        $this->authorize('review', $settlementRequest);

        $settlement = $settlementService->approve($settlementRequest, $request->user());

        app(ActivityLogService::class)->logActivity(
            'settlement_approved',
            $settlement->loan_id,
            'Approved full settlement request #'.$settlement->id.' for loan #'.$settlement->loan_id.'.'
        );

        app(NotificationService::class)->createNotification(
            $settlement->loan->user,
            'Full Settlement Approved',
            'Your full settlement request for Loan #'.$settlement->loan_id.' has been approved. Please proceed with payment.',
            'loan_status',
            $settlement->loan_id,
            Loan::class
        );

        return back()->with('success', 'Settlement request approved and marked for payment.');
    }

    public function reject(RejectLoanSettlementRequest $request, LoanSettlementRequest $settlementRequest, LoanSettlementService $settlementService)
    {
        $settlement = $settlementService->reject(
            $settlementRequest,
            $request->user(),
            $request->validated('rejection_reason')
        );

        app(ActivityLogService::class)->logActivity(
            'settlement_rejected',
            $settlement->loan_id,
            'Rejected full settlement request #'.$settlement->id.' for loan #'.$settlement->loan_id.'.',
            $settlement->rejection_reason
        );

        app(NotificationService::class)->createNotification(
            $settlement->loan->user,
            'Full Settlement Rejected',
            'Your full settlement request for Loan #'.$settlement->loan_id.' was rejected. Reason: '.$settlement->rejection_reason,
            'loan_status',
            $settlement->loan_id,
            Loan::class
        );

        return back()->with('success', 'Settlement request rejected.');
    }

    public function verifyPayment(
        VerifyLoanSettlementPaymentRequest $request,
        LoanSettlementRequest $settlementRequest,
        LoanSettlementService $settlementService
    ) {
        $validated = $request->validated();

        $result = $settlementService->recordVerifiedPayment(
            $settlementRequest,
            $request->user(),
            (float) $validated['amount'],
            Carbon::parse($validated['payment_date']),
            $validated['payment_method'],
            $validated['reference_number'] ?? null,
            $validated['remarks'] ?? null,
        );

        $settlement = $result['settlement'];

        app(ActivityLogService::class)->logActivity(
            'settlement_payment_verified',
            $settlement->loan_id,
            'Verified full settlement payment of PHP '.number_format((float) $settlement->settlement_amount, 2).' for loan #'.$settlement->loan_id.'.'
        );

        app(NotificationService::class)->createNotification(
            $settlement->loan->user,
            'Loan Fully Paid',
            'Your full settlement payment for Loan #'.$settlement->loan_id.' has been verified. The loan is now fully paid.',
            'loan_status',
            $settlement->loan_id,
            Loan::class
        );

        return back()->with('success', 'Settlement payment verified. Loan is fully paid when the posted balance reaches zero.');
    }
}
