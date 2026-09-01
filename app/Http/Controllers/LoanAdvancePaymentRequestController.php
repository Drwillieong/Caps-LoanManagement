<?php

namespace App\Http\Controllers;

use App\Http\Requests\RejectLoanAdvancePaymentRequest;
use App\Http\Requests\StoreLoanAdvancePaymentRequest;
use App\Http\Requests\SubmitLoanAdvancePaymentRequest;
use App\Http\Requests\VerifyLoanAdvancePaymentRequest;
use App\Models\Loan;
use App\Models\LoanAdvancePaymentRequest;
use App\Models\User;
use App\Services\ActivityLogService;
use App\Services\LoanAdvancePaymentService;
use App\Services\NotificationService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;

class LoanAdvancePaymentRequestController extends Controller
{
    public function store(StoreLoanAdvancePaymentRequest $request, Loan $loan, LoanAdvancePaymentService $advancePaymentService)
    {
        $advance = $advancePaymentService->createRequest(
            $loan,
            $request->user(),
            $request->validated(),
            $request->file('payment_proof')
        );

        app(ActivityLogService::class)->logActivity(
            'advance_payment_requested',
            $loan->id,
            'Requested advance payment of PHP '.number_format((float) $advance->requested_amount, 2).' for loan #'.$loan->id.'.'
        );

        User::query()
            ->where('role', 'gm')
            ->get()
            ->each(fn (User $gm) => app(NotificationService::class)->createNotification(
                $gm,
                'Advance Payment Request',
                'A new advance payment request for Loan #'.$loan->id.' requires validation.',
                'loan_status',
                $loan->id,
                Loan::class
            ));

        return back()->with('success', 'Advance payment request submitted for GM validation.');
    }

    public function submitPayment(
        SubmitLoanAdvancePaymentRequest $request,
        LoanAdvancePaymentRequest $advancePaymentRequest,
        LoanAdvancePaymentService $advancePaymentService
    ) {
        $advance = $advancePaymentService->submitPayment(
            $advancePaymentRequest,
            $request->user(),
            $request->validated(),
            $request->file('payment_proof')
        );

        app(ActivityLogService::class)->logActivity(
            'advance_payment_submitted',
            $advance->loan_id,
            'Submitted payment details for advance payment request #'.$advance->id.'.'
        );

        return back()->with('success', 'Advance payment details submitted for verification.');
    }

    public function index(Request $request, LoanAdvancePaymentService $advancePaymentService)
    {
        $this->authorize('viewAny', LoanAdvancePaymentRequest::class);

        $advanceRequests = LoanAdvancePaymentRequest::query()
            ->with(['loan.user.memberProfile', 'loan.loanType', 'loan.payments', 'requester', 'reviewer', 'verifier'])
            ->latest()
            ->get()
            ->map(function (LoanAdvancePaymentRequest $advance) use ($advancePaymentService) {
                $current = $advancePaymentService->calculate($advance->loan);

                return [
                    'id' => $advance->id,
                    'status' => $advance->status,
                    'outstanding_balance' => (float) $advance->outstanding_balance,
                    'current_outstanding_balance' => (float) $current['outstanding_balance'],
                    'regular_deduction_amount' => (float) $advance->regular_deduction_amount,
                    'requested_amount' => (float) $advance->requested_amount,
                    'installments_covered' => $advance->installments_covered,
                    'payment_method' => $advance->payment_method,
                    'expected_payment_date' => $advance->expected_payment_date?->format('Y-m-d'),
                    'payment_date' => $advance->payment_date?->format('Y-m-d'),
                    'reference_number' => $advance->reference_number,
                    'payment_proof_url' => $advance->payment_proof_path ? asset('storage/'.$advance->payment_proof_path) : null,
                    'remarks' => $advance->remarks,
                    'rejection_reason' => $advance->rejection_reason,
                    'created_at' => $advance->created_at?->format('Y-m-d H:i:s'),
                    'approved_at' => $advance->approved_at?->format('Y-m-d H:i:s'),
                    'verified_at' => $advance->verified_at?->format('Y-m-d H:i:s'),
                    'applied_at' => $advance->applied_at?->format('Y-m-d H:i:s'),
                    'loan' => [
                        'id' => $advance->loan->id,
                        'status' => $advance->loan->status,
                        'loan_type' => $advance->loan->loanType?->name ?? 'Loan',
                        'principal_amount' => (float) $advance->loan->principal_amount,
                        'total_amount_due' => (float) $advance->loan->total_amount_due,
                        'monthly_amortization' => (float) $advance->loan->monthly_amortization,
                        'release_date' => $advance->loan->release_date?->format('Y-m-d'),
                        'total_paid' => (float) $advance->loan->payments->sum('amount'),
                    ],
                    'member' => [
                        'id' => $advance->loan->user->id,
                        'name' => trim($advance->loan->user->first_name.' '.($advance->loan->user->middle_name ?? '').' '.$advance->loan->user->last_name),
                        'email' => $advance->loan->user->email,
                        'member_id' => $advance->loan->user->memberProfile?->members_id ?? 'N/A',
                        'payroll_id' => $advance->loan->user->memberProfile?->payroll_id,
                    ],
                ];
            });

        return Inertia::render('dashboards/Gm/AdvancePaymentRequests', [
            'advancePaymentRequests' => $advanceRequests,
            'stats' => [
                'pending' => $advanceRequests->where('status', LoanAdvancePaymentRequest::STATUS_PENDING_VALIDATION)->count(),
                'awaiting_payment' => $advanceRequests->whereIn('status', [
                    LoanAdvancePaymentRequest::STATUS_AWAITING_PAYMENT,
                    LoanAdvancePaymentRequest::STATUS_SCHEDULED_FOR_SALARY_DEDUCTION,
                    LoanAdvancePaymentRequest::STATUS_PAYMENT_SUBMITTED,
                ])->count(),
                'completed' => $advanceRequests->where('status', LoanAdvancePaymentRequest::STATUS_COMPLETED)->count(),
            ],
        ]);
    }

    public function approve(Request $request, LoanAdvancePaymentRequest $advancePaymentRequest, LoanAdvancePaymentService $advancePaymentService)
    {
        $this->authorize('review', $advancePaymentRequest);

        $advance = $advancePaymentService->approve($advancePaymentRequest, $request->user());

        app(ActivityLogService::class)->logActivity(
            'advance_payment_approved',
            $advance->loan_id,
            'Approved advance payment request #'.$advance->id.' for loan #'.$advance->loan_id.'.'
        );

        app(NotificationService::class)->createNotification(
            $advance->loan->user,
            'Advance Payment Approved',
            'Your advance payment request for Loan #'.$advance->loan_id.' has been approved.',
            'loan_status',
            $advance->loan_id,
            Loan::class
        );

        return back()->with('success', 'Advance payment request approved.');
    }

    public function reject(RejectLoanAdvancePaymentRequest $request, LoanAdvancePaymentRequest $advancePaymentRequest, LoanAdvancePaymentService $advancePaymentService)
    {
        $advance = $advancePaymentService->reject($advancePaymentRequest, $request->user(), $request->validated('rejection_reason'));

        app(ActivityLogService::class)->logActivity(
            'advance_payment_rejected',
            $advance->loan_id,
            'Rejected advance payment request #'.$advance->id.' for loan #'.$advance->loan_id.'.',
            $advance->rejection_reason
        );

        app(NotificationService::class)->createNotification(
            $advance->loan->user,
            'Advance Payment Rejected',
            'Your advance payment request for Loan #'.$advance->loan_id.' was rejected. Reason: '.$advance->rejection_reason,
            'loan_status',
            $advance->loan_id,
            Loan::class
        );

        return back()->with('success', 'Advance payment request rejected.');
    }

    public function verifyPayment(
        VerifyLoanAdvancePaymentRequest $request,
        LoanAdvancePaymentRequest $advancePaymentRequest,
        LoanAdvancePaymentService $advancePaymentService
    ) {
        $validated = $request->validated();
        $validated['payment_date'] = Carbon::parse($validated['payment_date']);

        $result = $advancePaymentService->verifyAndApply($advancePaymentRequest, $request->user(), $validated);
        $advance = $result['advance'];

        app(ActivityLogService::class)->logActivity(
            'advance_payment_applied',
            $advance->loan_id,
            'Verified and applied advance payment of PHP '.number_format((float) $advance->requested_amount, 2).' for loan #'.$advance->loan_id.'.'
        );

        app(NotificationService::class)->createNotification(
            $advance->loan->user,
            'Advance Payment Applied',
            'Your advance payment of PHP '.number_format((float) $advance->requested_amount, 2).' has been applied to Loan #'.$advance->loan_id.'. '.$advance->installments_covered.' installment(s) were advanced.',
            'salary_deduction',
            $advance->loan_id,
            Loan::class
        );

        return back()->with('success', 'Advance payment verified and applied to future installments.');
    }
}
