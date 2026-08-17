<?php

namespace App\Http\Controllers\Member;

use App\Http\Controllers\Controller;
use App\Mail\CoMakerDecision;
use App\Mail\SendEmailCoMaker;
use App\Models\Loan;
use App\Models\LoanCoMaker;
use App\Models\LoanType;
use App\Models\MemberProfile;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Mail;
use Inertia\Inertia;
use App\Service\ApplyLoan\LoanComputationService;
use App\Service\ApplyLoan\LoanEligibilityService;
use App\Services\LoanService;

class LoanController extends Controller
{
    use \App\Traits\HasNotificationCount;
    public function create()
    {
        $user = Auth::user();

        $memberProfile = MemberProfile::where('user_id', $user->id)
            ->first();

        if (!$memberProfile) {
        return Inertia::render('dashboards/Member/ApplyLoan', [
            'memberProfile' => null,
            'loanTypes' => [],
            'eligibleCoMakers' => [],
            'previousLoans' => [],
            'error' => 'Your profile is not yet completed. Please complete your profile.',
            'rejectedAt' => null,
            'unread_notifications_count' => $this->getMemberUnreadNotificationCount(request()),
        ]);
        }

        // Check if user has ANY pending loan application
        $hasPendingLoan = Loan::where('user_id', $user->id)
            ->whereIn('status', ['awaiting_comaker', 'pending_gm_review', 'pending_cc_review'])
            ->exists();

        // Check for recent rejection lockout (3 hours)
        $recentRejection = Loan::where('user_id', $user->id)
            ->whereIn('status', ['rejected', 'rejected_by_co_maker', 'rejected_by_gm', 'rejected_by_credit_com'])
            ->where('rejected_at', '>=', now()->subHours(3))
            ->orderBy('rejected_at', 'desc')
            ->first();

        $rejectedAt = $recentRejection?->rejected_at?->format('c');

        // Check new eligibility rules using service helpers
        $loanService = new LoanService();
        $hasActiveLoan = !$loanService->canApplyForNewLoan($user);
        $activeLoansTotalMonthly = $loanService->getActiveLoansTotalMonthlyPayment($user);

        // Fetch previous loans with amortizations for "Previous Loan" display
        $previousLoans = Loan::where('user_id', $user->id)
            ->whereIn('status', ['approved', 'released', 'paid_off'])
            ->with(['loanType', 'amortizations' => function ($q) {
                $q->where('status', '!=', 'paid')
                  ->orderBy('due_date', 'asc');
            }])
            ->withCount([
                'amortizations as total_amortizations',
                'amortizations as paid_amortizations' => function ($q) {
                    $q->where('status', 'paid');
                }
            ])
            ->get()
            ->map(function ($loan) {
                // Calculate total paid from amortizations
                $totalPaid = $loan->amortizations()
                    ->where('status', 'paid')
                    ->sum('amount_paid');
                
                // Calculate remaining balance
                $balance = $loan->total_amount_due - $totalPaid;
                
                // Get next due date from unpaid amortizations
                $nextDue = $loan->amortizations()
                    ->where('status', '!=', 'paid')
                    ->orderBy('due_date', 'asc')
                    ->first();
                
                return [
                    'id' => $loan->id,
                    'loan_type_name' => $loan->loanType->name ?? 'N/A',
                    'principal_amount' => $loan->principal_amount,
                    'total_amount_due' => $loan->total_amount_due,
                    'percent_paid' => $loan->total_amortizations > 0 ? round(($loan->paid_amortizations / $loan->total_amortizations) * 100, 1) : 0,
                    'balance' => max(0, $balance),
                    'next_due_date' => $nextDue?->due_date?->format('Y-m-d'),
                    'monthly_amortization' => $loan->monthly_amortization,
                    'status' => $loan->status,
                    'release_date' => $loan->release_date?->format('Y-m-d'),
                ];
            });

        return Inertia::render('dashboards/Member/ApplyLoan', [
            'memberProfile' => [
                'basic_salary' => $memberProfile->basic_salary,
                'share_capital_balance' => $memberProfile->share_capital_balance,
            ],

            'loanTypes' => LoanType::select(
                'id',
                'name',
                'interest_rate_per_annum',
                'max_term_months',
                'requires_comaker'
            )->get(),

            'eligibleCoMakers' => User::where('role', 'member')
                ->where('id', '!=', $user->id)
                ->whereDoesntHave('coMakerLoans', function ($q) {
                    $q->whereIn('status', ['accepted', 'pending'])
                      ->whereHas('loan', function ($q2) {
                          $q2->whereNotIn('status', ['rejected', 'paid_off']);
                      });
                })
                ->select('id', 'first_name', 'middle_name', 'last_name', 'email')
                ->get()
                ->map(function ($user) {
                    return [
                        'id' => $user->id,
                        'name' => trim($user->first_name . ($user->middle_name ? ' ' . $user->middle_name : '') . ' ' . $user->last_name),
                        'email' => $user->email,
                    ];
                }),

            'previousLoans' => $previousLoans,
            'activeLoansTotalMonthly' => $activeLoansTotalMonthly,
            'hasPendingLoan' => $hasPendingLoan,
            'hasAwaitingComaker' => false, // Legacy - deprecated
            'hasActiveLoan' => $hasActiveLoan,
            'rejectedAt' => $rejectedAt,
            'unread_notifications_count' => $this->getMemberUnreadNotificationCount(request()),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'loan_type_id' => 'required|exists:loan_types,id',
            'principal_amount' => 'required|numeric|min:1000',
            'terms_months' => 'required|integer|min:1',
            'co_maker_user_id' => 'nullable|exists:users,id|different:' . auth()->id(),
            'disbursement_method' => 'required|in:cash,bank_transfer',
        ]);

        $user = Auth::user();
        $profile = $user->memberProfile;

        /** ===============================
         *  ELIGIBILITY CHECKS
         * =============================== */

        // Check if user has pending loan application
        $hasPendingLoan = Loan::where('user_id', $user->id)
            ->whereIn('status', ['awaiting_comaker', 'pending_gm_review', 'pending_cc_review'])
            ->exists();

        if ($hasPendingLoan) {
            return back()->withErrors([
                'principal_amount' => 'You have a pending loan application. Please wait for it to be processed before applying for a new loan.'
            ]);
        }

        // Check for 3-hour reapplication lockout after rejection
        $recentRejection = Loan::where('user_id', $user->id)
            ->whereIn('status', ['rejected', 'rejected_by_co_maker', 'rejected_by_gm', 'rejected_by_credit_com'])
            ->where('rejected_at', '>=', now()->subHours(3))
            ->orderBy('rejected_at', 'desc')
            ->first();

        if ($recentRejection) {
            $lockoutEnd = $recentRejection->rejected_at->addHours(3);
            return back()->withErrors([
                'principal_amount' => "You cannot submit a new loan application yet. Please wait until {$lockoutEnd->format('h:i A, F j, Y')}."
            ]);
        }

        // Comprehensive eligibility checks
        $eligibilityService = new LoanEligibilityService();
        $eligibilityService->check(
            $user,
            $validated['principal_amount'],
            $validated['co_maker_user_id'],
            $validated['loan_type_id'],
            $validated['terms_months']
        );

        $loanType = LoanType::findOrFail($validated['loan_type_id']); // Needed for create

        $computationService = new LoanComputationService();
        $computed = $computationService->compute(
            $validated['principal_amount'],
            $validated['terms_months'],
            $loanType->interest_rate_per_annum
        );

        /** ===============================
         *  CREATE LOAN
         * =============================== */

        // Idempotency: block an identical pending application submitted within
        // the last 10 seconds (covers double-clicks / spam beyond the throttle).
        $duplicatePending = Loan::where('user_id', $user->id)
            ->where('loan_type_id', $validated['loan_type_id'])
            ->where('principal_amount', $validated['principal_amount'])
            ->where('terms_months', $validated['terms_months'])
            ->where('disbursement_method', $validated['disbursement_method'])
            ->whereIn('status', ['awaiting_comaker', 'pending_gm_review', 'pending_cc_review'])
            ->where('created_at', '>=', now()->subSeconds(10))
            ->exists();

        if ($duplicatePending) {
            return back()->withErrors([
                'principal_amount' => 'A similar loan application was just submitted. Please wait a moment before trying again.'
            ])->withInput();
        }

         $loan = Loan::create([
              'user_id' => $user->id,
              'loan_type_id' => $validated['loan_type_id'],
             'principal_amount' => $validated['principal_amount'],
             'terms_months' => $validated['terms_months'],
             'interest_amount' => $computed['interest'],
             'total_amount_due' => $computed['total'],
             'monthly_amortization' => $computed['monthly'],
             'disbursement_method' => $validated['disbursement_method'],
             'status' => $loanType->requires_comaker
                 ? 'awaiting_comaker'
                 : 'pending_gm_review',
         ]);

        if (!empty($validated['co_maker_user_id'])) {
            LoanCoMaker::create([
                'loan_id' => $loan->id,
                'user_id' => $validated['co_maker_user_id'],
            ]);

            $notificationService = app(\App\Services\NotificationService::class);
            $coMaker = User::find($validated['co_maker_user_id']);
            $borrower = $user;
            $loanTypeName = $loanType->name;

            $notificationService->createNotification(
                $coMaker,
                'Co-Maker Request',
                $borrower->first_name . ' ' . $borrower->last_name . ' selected you as co-maker for ' . $loanTypeName . ' loan of ₱' . number_format($loan->principal_amount) . '. Please review.',
                'comaker_request',
                $loan->id,
                Loan::class
            );

            // Send email notification to co-maker
            if ($coMaker && $coMaker->email) {
                Mail::to($coMaker->email)->send(new SendEmailCoMaker(
                    trim($coMaker->first_name . ($coMaker->middle_name ? ' ' . $coMaker->middle_name : '') . ' ' . $coMaker->last_name),
                    trim($borrower->first_name . ($borrower->middle_name ? ' ' . $borrower->middle_name : '') . ' ' . $borrower->last_name),
                    $loanTypeName,
                    $loan->principal_amount,
                    $borrower,
                    $loan
                ));
            }
        }

        return redirect()
            ->route('member.pending-application')
            ->with('success', 'Loan application submitted successfully.');
    }

    public function update(Request $request, $loanId)
    {
        $validated = $request->validate([
            'loan_type_id' => 'required|exists:loan_types,id',
            'principal_amount' => 'required|numeric|min:1000',
            'terms_months' => 'required|integer|min:1',
            'co_maker_user_id' => 'nullable|exists:users,id|different:' . auth()->id(),
            'disbursement_method' => 'required|in:cash,bank_transfer',
        ]);

        $user = Auth::user();
        $loan = Loan::where('user_id', $user->id)
            ->where('id', $loanId)
            ->firstOrFail();

        // Only allow editing if not yet approved/released
        if (in_array($loan->status, ['approved', 'released', 'paid_off'])) {
            return back()->withErrors([
                'error' => 'This loan application cannot be edited as it has already been approved.'
            ]);
        }

        $profile = $user->memberProfile;

        $loanType = LoanType::findOrFail($validated['loan_type_id']);

        $eligibilityService = new LoanEligibilityService();
        $eligibilityService->check(
            $user,
            $validated['principal_amount'],
            $validated['co_maker_user_id'],
            $validated['loan_type_id'],
            $validated['terms_months'],
            $loan->id
        );

        $computed = app(LoanComputationService::class)->compute(
            $validated['principal_amount'],
            $validated['terms_months'],
            $loanType->interest_rate_per_annum
        );

 // Update loan
        $loan->update([
            'loan_type_id' => $loanType->id,
            'principal_amount' => $validated['principal_amount'],
            'terms_months' => $validated['terms_months'],
            'interest_amount' => $computed['interest'],
            'total_amount_due' => $computed['total'],
            'monthly_amortization' => $computed['monthly'],
            'disbursement_method' => $validated['disbursement_method'],
            'status' => $loanType->requires_comaker
                ? 'awaiting_comaker'
                : 'pending_gm_review',
            'has_edited' => true,
        ]);

        // Update co-maker
        if (!empty($validated['co_maker_user_id'])) {
            // Remove existing co-makers
            LoanCoMaker::where('loan_id', $loan->id)->delete();
            
            // Add new co-maker
            LoanCoMaker::create([
                'loan_id' => $loan->id,
                'user_id' => $validated['co_maker_user_id'],
            ]);

            // Send email notification to co-maker
            $coMaker = User::find($validated['co_maker_user_id']);
            $borrower = $user;
            $loanTypeName = $loanType->name;

            if ($coMaker && $coMaker->email) {
                Mail::to($coMaker->email)->send(new SendEmailCoMaker(
                    trim($coMaker->first_name . ($coMaker->middle_name ? ' ' . $coMaker->middle_name : '') . ' ' . $coMaker->last_name),
                    trim($borrower->first_name . ($borrower->middle_name ? ' ' . $borrower->middle_name : '') . ' ' . $borrower->last_name),
                    $loanTypeName,
                    $loan->principal_amount,
                    $borrower,
                    $loan
                ));
            }
        }

        return redirect()
            ->route('member.pending-application')
            ->with('success', 'Loan application updated successfully.');
    }

    public function preview(Request $request)
    {
        $validated = $request->validate([
            'loan_type_id' => 'required|exists:loan_types,id',
            'principal_amount' => 'required|numeric|min:1',
            'terms_months' => 'required|integer|min:1',
        ]);

        $loanType = LoanType::findOrFail($validated['loan_type_id']);
        $computed = app(LoanComputationService::class)->compute(
            (float) $validated['principal_amount'],
            (int) $validated['terms_months'],
            (float) $loanType->interest_rate_per_annum
        );

        return response()->json([
            'principal' => round((float) $validated['principal_amount'], 2),
            'annual_interest_rate' => (float) $loanType->interest_rate_per_annum,
            'interest' => $computed['interest'],
            'total' => $computed['total'],
            'monthly' => $computed['monthly'],
            'payment_per_schedule' => $computed['payment_per_schedule'],
            'payments_per_year' => $computed['payments_per_year'],
            'number_of_payments' => $computed['number_of_payments'],
        ]);
    }

    public function pendingApplication()
    {
        $user = Auth::user();

        // Fetch the most recent in-progress (pending) loan for the user.
        // Exclude terminal states (approved/released/paid_off). Rejected loans are
        // still shown while inside the 3-hour reapplication cool-down so the member
        // can see the rejection reason and the lockout countdown instead of a stale
        // "Awaiting Co-Maker" card.
        $loan = Loan::where('user_id', $user->id)
            ->whereNotIn('status', [
                'approved',
                'released',
                'paid_off',
            ])
            ->where(function ($query) {
                $query->whereNotIn('status', [
                    'rejected',
                    'rejected_by_gm',
                    'rejected_by_credit_com',
                    'rejected_by_co_maker',
                ])->orWhere('rejected_at', '>=', now()->subHours(3));
            })
            ->with(['loanType', 'coMakers.user'])
            ->orderBy('created_at', 'desc')
            ->first();

        // Fetch all loan history
        $loanHistory = Loan::where('user_id', $user->id)
            ->with(['loanType', 'coMakers.user'])
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($loanItem) {
                 return [
                     'id' => $loanItem->id,
                     'loan_type_name' => $loanItem->loanType->name ?? 'N/A',
                     'principal_amount' => $loanItem->principal_amount,
                     'terms_months' => $loanItem->terms_months,
                     'interest_amount' => $loanItem->interest_amount,
                     'total_amount_due' => $loanItem->total_amount_due,
                     'monthly_amortization' => $loanItem->monthly_amortization,
                     'disbursement_method' => $loanItem->disbursement_method,
                     'status' => $loanItem->status,
                     'remarks' => $loanItem->remarks,
                     'rejected_by' => $loanItem->rejected_by,
                     'rejected_at' => $loanItem->rejected_at?->format('c'),
                     'co_maker_rejection_reason' => $loanItem->co_maker_rejection_reason,
                     'created_at' => $loanItem->created_at->format('Y-m-d H:i:s'),
                     'co_makers' => $loanItem->coMakers->map(function ($coMaker) {
                         return [
                             'id' => $coMaker->user->id,
                             'name' => trim($coMaker->user->first_name . ($coMaker->user->middle_name ? ' ' . $coMaker->user->middle_name : '') . ' ' . $coMaker->user->last_name),
                             'email' => $coMaker->user->email,
                             'status' => $coMaker->status,
                         ];
                     }),
                 ];
            });

        if (!$loan) {
        return Inertia::render('dashboards/Member/PendingApplication', [
            'loan' => null,
            'hasPendingLoan' => false,
            'loanHistory' => $loanHistory,
            'unread_notifications_count' => $this->getMemberUnreadNotificationCount(request()),
        ]);
        }

 return Inertia::render('dashboards/Member/PendingApplication', [
             'loan' => [
                 'id' => $loan->id,
                 'loan_type_name' => $loan->loanType->name ?? 'N/A',
                 'principal_amount' => $loan->principal_amount,
                 'terms_months' => $loan->terms_months,
                 'interest_amount' => $loan->interest_amount,
                 'total_amount_due' => $loan->total_amount_due,
                 'monthly_amortization' => $loan->monthly_amortization,
                 'disbursement_method' => $loan->disbursement_method,
                 'status' => $loan->status,
                 'remarks' => $loan->remarks,
                 'rejected_by' => $loan->rejected_by,
                 'rejected_at' => $loan->rejected_at?->format('c'),
                 'co_maker_rejection_reason' => $loan->co_maker_rejection_reason,
                 'created_at' => $loan->created_at->format('Y-m-d H:i:s'),
                 'has_edited' => $loan->has_edited,
                 'co_makers' => $loan->coMakers->map(function ($coMaker) {
                     return [
                         'id' => $coMaker->user->id,
                         'name' => trim($coMaker->user->first_name . ($coMaker->user->middle_name ? ' ' . $coMaker->user->middle_name : '') . ' ' . $coMaker->user->last_name),
                         'email' => $coMaker->user->email,
                         'status' => $coMaker->status,
                     ];
                 }),
             ],
            'hasPendingLoan' => true,
            'loanHistory' => $loanHistory,
            'unread_notifications_count' => $this->getMemberUnreadNotificationCount(request()),
        ]);
    }

    public function edit($loanId)
    {
        $user = Auth::user();

        $loan = Loan::where('user_id', $user->id)
            ->where('id', $loanId)
            ->with(['loanType', 'coMakers'])
            ->firstOrFail();

        // Only allow editing if not yet approved/released
        if (in_array($loan->status, ['approved', 'released', 'paid_off'])) {
            return redirect()
                ->route('member.pending-application')
                ->with('error', 'This loan application cannot be edited as it has already been approved.');
        }

        $memberProfile = MemberProfile::where('user_id', $user->id)->first();

        $loanTypes = LoanType::select(
            'id',
            'name',
            'interest_rate_per_annum',
            'max_term_months',
            'requires_comaker'
        )->get();

        $eligibleCoMakers = User::where('role', 'member')
            ->where('id', '!=', $user->id)
            ->whereDoesntHave('coMakerLoans', function ($q) {
                $q->whereIn('status', ['accepted', 'pending'])
                  ->whereHas('loan', function ($q2) {
                      $q2->whereNotIn('status', ['rejected', 'paid_off']);
                  });
            })
            ->select('id', 'first_name', 'middle_name', 'last_name', 'email')
            ->get()
            ->map(function ($user) {
                return [
                    'id' => $user->id,
                    'name' => trim($user->first_name . ($user->middle_name ? ' ' . $user->middle_name : '') . ' ' . $user->last_name),
                    'email' => $user->email,
                ];
            });

        return Inertia::render('dashboards/Member/ApplyLoan', [
            'loanTypes' => $loanTypes,
            'memberProfile' => [
                'basic_salary' => $memberProfile->basic_salary,
                'share_capital_balance' => $memberProfile->share_capital_balance,
            ],
            'eligibleCoMakers' => $eligibleCoMakers,
            'previousLoans' => [],
            'error' => null,
            'hasPendingLoan' => false,
            'hasAwaitingComaker' => false, // Legacy
            'hasActiveLoan' => false,
            'editingLoan' => [
                'id' => $loan->id,
                'loan_type_id' => $loan->loan_type_id,
                'principal_amount' => $loan->principal_amount,
                'terms_months' => $loan->terms_months,
                'co_maker_user_id' => $loan->coMakers->first()?->user_id ?? '',
                'disbursement_method' => $loan->disbursement_method,
            ],
            'unread_notifications_count' => $this->getMemberUnreadNotificationCount(request()),
        ]);
    }

    /**
     * Get pending co-maker requests for the current user
     */
    public function comakerRequests()
    {
        $user = Auth::user();

        // Get loans where current user is selected as co-maker and status is pending
        // Also filter to only show loans that are still awaiting co-maker confirmation
        $coMakerRequests = LoanCoMaker::where('user_id', $user->id)
            ->where('status', 'pending')
            ->whereHas('loan', function ($query) {
                $query->where('status', 'awaiting_comaker');
            })
                ->with([
                    'loan.loanType',
                    'loan.user.memberProfile'
                ])
            ->get()
            ->map(function ($coMaker) {
                $loan = $coMaker->loan;
                $loanUser = $loan->user;
                
                return [
                    'id' => $coMaker->id,
                    'loan_id' => $loan->id,
                    'loan_type_name' => $loan->loanType->name ?? 'N/A',
                    'principal_amount' => $loan->principal_amount,
                    'terms_months' => $loan->terms_months,
                    'interest_amount' => $loan->interest_amount,
                    'total_amount_due' => $loan->total_amount_due,
                    'monthly_amortization' => $loan->monthly_amortization,
                    'disbursement_method' => $loan->disbursement_method,
                    'status' => $loan->status,
                    'created_at' => $loan->created_at->format('Y-m-d H:i:s'),
                    'expires_at' => $coMaker->expires_at
                        ? \Carbon\Carbon::parse($coMaker->expires_at)->format('Y-m-d H:i:s')
                        : null,
                    'requester' => [
                        'id' => $loanUser->id,
                        'name' => trim($loanUser->first_name . ($loanUser->middle_name ? ' ' . $loanUser->middle_name : '') . ' ' . $loanUser->last_name),
                        'email' => $loanUser->email,
                        'employee_id' => $loanUser->memberProfile?->employee_id ?? 'N/A',
                        'position' => $loanUser->memberProfile?->position ?? 'N/A',
                        'mobile_number' => $loanUser->memberProfile?->mobile_number ?? 'N/A',
                    ],
                ];
            });

        return Inertia::render('dashboards/Member/CoMaker', [
            'coMakerRequests' => $coMakerRequests,
            'unread_notifications_count' => $this->getMemberUnreadNotificationCount(request()),
        ]);
    }

    /**
     * Respond to a co-maker request (accept or reject)
     */
    public function respondToCoMakerRequest(Request $request)
    {
        $validated = $request->validate([
            'loan_id' => 'required|exists:loans,id',
            'action' => 'required|in:accept,reject',
            'rejection_reason' => 'nullable|string|max:2000',
        ]);

        if ($validated['action'] === 'reject' && empty($validated['rejection_reason'])) {
            return back()->withErrors([
                'rejection_reason' => 'Please provide a reason for declining the co-maker request.',
            ])->withInput();
        }

        $user = Auth::user();

        // Find the co-maker record
        $coMaker = LoanCoMaker::where('loan_id', $validated['loan_id'])
            ->where('user_id', $user->id)
            ->where('status', 'pending')
            ->first();

        if (!$coMaker) {
            return back()->withErrors(['loan_id' => 'Co-maker request not found or already responded.']);
        }

        // Get loan and borrower details before updating
        $loan = $coMaker->loan;
        $borrower = $loan->user;
        $loanType = $loan->loanType;

        // Co-maker name
        $coMakerName = trim($user->first_name . ($user->middle_name ? ' ' . $user->middle_name : '') . ' ' . $user->last_name);
        
        // Borrower name and email
        $borrowerName = trim($borrower->first_name . ($borrower->middle_name ? ' ' . $borrower->middle_name : '') . ' ' . $borrower->last_name);
        $borrowerEmail = $borrower->email;

        // Update the co-maker status - use 'accepted' to match the enum in migration
        $status = $validated['action'] === 'accept' ? 'accepted' : 'rejected';
        $coMaker->update([
            'status' => $status,
            'responded_at' => now(),
        ]);

        $notificationService = app(\App\Services\NotificationService::class);

        if ($status === 'accepted') {
            $notificationService->createNotification(
                $borrower,
                'Co-Maker Request Accepted',
                'Your co-maker ' . $coMakerName . ' has accepted your loan application. Now pending GM review.',
                'comaker_request',
                $loan->id,
                Loan::class
            );
            // If accepted, check if loan can proceed (if co-maker was required)
            $requiredCoMakers = $loanType->requires_comaker ? 1 : 0;
            $acceptedCoMakers = $loan->coMakers()->whereIn('status', ['accepted', 'pending'])->count();
            
            // If co-maker is accepted and no more co-makers needed, update loan status
            if ($acceptedCoMakers >= $requiredCoMakers) {
                $loan->update(['status' => 'pending_gm_review']);
            }
        } else {
            $notificationService->createNotification(
                $borrower,
                'Co-Maker Request Rejected',
                'Your co-maker ' . $coMakerName . ' has rejected your loan application.',
                'comaker_request',
                $loan->id,
                Loan::class
            );
            // If rejected, update loan status
            $loan->update([
                'status' => 'rejected_by_co_maker',
                'remarks' => 'Co-maker declined the request.',
                'rejected_by' => 'co_maker',
                'rejected_at' => now(),
                'co_maker_rejection_reason' => $validated['rejection_reason'],
            ]);
        }

        // Send email notification to the borrower
        try {
            Mail::to($borrowerEmail)->send(new CoMakerDecision(
                $borrowerName,
                $borrowerEmail,
                $coMakerName,
                $status,
                $loanType->name ?? 'N/A',
                $loan->principal_amount,
                $loan->created_at->format('F d, Y'),
                $loan->terms_months,
                $loan->interest_amount,
                $loan->monthly_amortization,
                $loan->total_amount_due,
                $validated['rejection_reason'] ?? null
            ));
        } catch (\Exception $e) {
            // Log error but don't fail the request
            \Log::error('Failed to send co-maker decision email: ' . $e->getMessage());
        }

        $message = $validated['action'] === 'accept' 
            ? 'You have accepted the co-maker request.' 
            : 'You have declined the co-maker request.';

        return redirect()
            ->route('member.co-maker')
            ->with('success', $message);
    }

    /**
     * Get count of pending co-maker requests for dashboard display
     */
    public function comakerRequestCount()
    {
        $user = Auth::user();

        $count = LoanCoMaker::where('user_id', $user->id)
            ->where('status', 'pending')
            ->whereHas('loan', function ($query) {
                $query->where('status', 'awaiting_comaker');
            })
            ->count();

        return response()->json(['count' => $count]);
    }

    /**
     * Show Choose Comaker page with eligible members
     * A member is available as co-maker only if they are NOT bound to any loan
     * (i.e., no loan with status: awaiting_comaker, pending_gm_review, pending_cc_review, approved, released)
     * Once loan is rejected or paid_off, they become available again
     */
    public function chooseComaker()
    {
        $user = Auth::user();

        // Get all members except the current user
        // Include their member profile for additional info
        $members = User::where('role', 'member')
            ->where('id', '!=', $user->id)
            ->with('memberProfile')
            ->select('id', 'first_name', 'middle_name', 'last_name', 'email', 'created_at')
            ->get()
            ->map(function ($member) {
                // Check if member is bound to any loan that is NOT rejected and NOT paid_off
                // These are the statuses where a member is considered "bound" as co-maker:
                // - awaiting_comaker: loan is pending co-maker confirmation
                // - pending_gm_review: loan is pending GM approval
                // - pending_cc_review: loan is pending Credit Coordinator approval
                // - approved: loan is approved but not yet released
                // - released: loan is active and being paid
                $isBoundToLoan = Loan::whereHas('coMakers', function ($q) use ($member) {
                    $q->where('user_id', $member->id)
                      ->whereIn('status', ['accepted', 'pending']);
                })
                ->whereNotIn('status', ['rejected', 'paid_off'])
                ->exists();

                return [
                    'id' => $member->id,
                    'name' => trim($member->first_name . ($member->middle_name ? ' ' . $member->middle_name : '') . ' ' . $member->last_name),
                    'email' => $member->email,
                    'member_id' => 'MEM-' . str_pad($member->id, 4, '0', STR_PAD_LEFT),
                    'status' => $isBoundToLoan ? 'unavailable' : 'available',
                    'share_capital' => $member->memberProfile?->share_capital_balance ?? 0,
                    'date_joined' => $member->created_at->format('Y-m-d'),
                ];
            });

        return Inertia::render('dashboards/Member/ChooseComaker', [
            'members' => $members,
            'unread_notifications_count' => $this->getMemberUnreadNotificationCount(request()),
        ]);
    }
}
