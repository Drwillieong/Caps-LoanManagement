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

class LoanController extends Controller
{
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
            ]);
        }

        // Check if user has a pending application awaiting co-maker confirmation
        $hasAwaitingComaker = Loan::where('user_id', $user->id)
            ->where('status', 'awaiting_comaker')
            ->exists();

        // Check if user has an active loan
        $hasActiveLoan = Loan::where('user_id', $user->id)
            ->whereIn('status', ['approved', 'released'])
            ->exists();

        // Fetch previous loans with amortizations for "Previous Loan" display
        $previousLoans = Loan::where('user_id', $user->id)
            ->whereIn('status', ['approved', 'released', 'paid_off'])
            ->with(['loanType', 'amortizations' => function ($q) {
                $q->where('status', '!=', 'paid')
                  ->orderBy('due_date', 'asc');
            }])
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
                    'balance' => max(0, $balance),
                    'next_due_date' => $nextDue?->due_date?->format('Y-m-d'),
                    'monthly_amortization' => $loan->monthly_amortization,
                    'status' => $loan->status,
                    'release_date' => $loan->release_date?->format('Y-m-d'),
                ];
            });

        return Inertia::render('dashboards/Member/ApplyLoan', [
            'memberProfile' => [
                'date_hired' => $memberProfile->date_hired,
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
                    $q->where('status', 'accepted')
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
            'hasAwaitingComaker' => $hasAwaitingComaker,
            'hasActiveLoan' => $hasActiveLoan,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'loan_type_id' => 'required|exists:loan_types,id',
            'principal_amount' => 'required|numeric|min:1000',
            'terms_months' => 'required|integer|min:1',
            'co_maker_user_id' => 'nullable|exists:users,id|different:' . auth()->id(),
        ]);

        $user = Auth::user();
        $profile = $user->memberProfile;

        /** ===============================
         *  ELIGIBILITY CHECKS
         * =============================== */

        // Check if user has pending application awaiting co-maker confirmation
        $hasAwaitingComaker = Loan::where('user_id', $user->id)
            ->where('status', 'awaiting_comaker')
            ->exists();

        if ($hasAwaitingComaker) {
            return back()->withErrors([
                'principal_amount' => 'You have a pending application awaiting co-maker confirmation. Please wait for the co-maker to respond or cancel that application before applying for a new loan.'
            ]);
        }

        // Share capital rule (x2)
        $maxLoan = $profile->share_capital_balance * 2;
        if ($validated['principal_amount'] > $maxLoan) {
            return back()->withErrors([
                'principal_amount' => 'Loan amount exceeds allowed share capital limit.'
            ]);
        }

        // Monthly payment must not exceed 50% of basic salary
        $loanType = LoanType::findOrFail($validated['loan_type_id']);
        $interest = ($validated['principal_amount'] * ($loanType->interest_rate_per_annum / 100))
            * ($validated['terms_months'] / 12);
        $total = $validated['principal_amount'] + $interest;
        $monthly = $total / $validated['terms_months'];
        
        $maxMonthlyPayment = $profile->basic_salary / 2;
        if ($monthly > $maxMonthlyPayment) {
            return back()->withErrors([
                'principal_amount' => 'Monthly payment exceeds 50% of your basic salary. Please increase the loan term or reduce the amount.'
            ]);
        }

        // No active loan rule
        $hasActiveLoan = Loan::where('user_id', $user->id)
            ->whereIn('status', ['approved', 'released'])
            ->exists();

        if ($hasActiveLoan) {
            return back()->withErrors([
                'principal_amount' => 'You already have an active loan.'
            ]);
        }

        // Co-maker restriction rule - check if co-maker is bound to any non-final loan
        if (!empty($validated['co_maker_user_id'])) {
            $coMakerHasBoundLoan = Loan::whereHas('coMakers', function ($q) use ($validated) {
                $q->where('user_id', $validated['co_maker_user_id'])
                  ->where('status', 'accepted');
            })
            ->whereNotIn('status', ['rejected', 'paid_off'])
            ->exists();

            if ($coMakerHasBoundLoan) {
                return back()->withErrors([
                    'co_maker_user_id' => 'Selected co-maker is already bound to another loan. Please wait until their loan is rejected or paid off.'
                ]);
            }
        }

        /** ===============================
         *  CREATE LOAN
         * =============================== */

        $loan = Loan::create([
            'user_id' => $user->id,
            'loan_type_id' => $loanType->id,
            'principal_amount' => $validated['principal_amount'],
            'terms_months' => $validated['terms_months'],
            'interest_amount' => round($interest, 2),
            'total_amount_due' => round($total, 2),
            'monthly_amortization' => round($monthly, 2),
            'status' => $loanType->requires_comaker
                ? 'awaiting_comaker'
                : 'pending_gm_review',
        ]);

        if (!empty($validated['co_maker_user_id'])) {
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
                    $loan->principal_amount
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

        // Share capital rule (x2)
        $maxLoan = $profile->share_capital_balance * 2;
        if ($validated['principal_amount'] > $maxLoan) {
            return back()->withErrors([
                'principal_amount' => 'Loan amount exceeds allowed share capital limit.'
            ]);
        }

        // Monthly payment must not exceed 50% of basic salary
        $loanType = LoanType::findOrFail($validated['loan_type_id']);
        $interest = ($validated['principal_amount'] * ($loanType->interest_rate_per_annum / 100))
            * ($validated['terms_months'] / 12);
        $total = $validated['principal_amount'] + $interest;
        $monthly = $total / $validated['terms_months'];
        
        $maxMonthlyPayment = $profile->basic_salary / 2;
        if ($monthly > $maxMonthlyPayment) {
            return back()->withErrors([
                'principal_amount' => 'Monthly payment exceeds 50% of your basic salary. Please increase the loan term or reduce the amount.'
            ]);
        }

        // Update loan
        $loan->update([
            'loan_type_id' => $loanType->id,
            'principal_amount' => $validated['principal_amount'],
            'terms_months' => $validated['terms_months'],
            'interest_amount' => round($interest, 2),
            'total_amount_due' => round($total, 2),
            'monthly_amortization' => round($monthly, 2),
            'status' => $loanType->requires_comaker
                ? 'awaiting_comaker'
                : 'pending_gm_review',
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
                    $loan->principal_amount
                ));
            }
        }

        return redirect()
            ->route('member.pending-application')
            ->with('success', 'Loan application updated successfully.');
    }

    public function pendingApplication()
    {
        $user = Auth::user();

        // Fetch the most recent pending loan for the user
        $loan = Loan::where('user_id', $user->id)
            ->whereIn('status', [
                'awaiting_comaker',
                'pending_gm_review',
                'approved',
                'rejected',
                'rejected_by_gm',
                'rejected_by_credit_com',
                'rejected_by_co_maker',
            ])
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
                    'status' => $loanItem->status,
                    'remarks' => $loanItem->remarks,
                    'rejected_by' => $loanItem->rejected_by,
                    'rejected_at' => $loanItem->rejected_at?->format('Y-m-d H:i:s'),
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
                'status' => $loan->status,
                'remarks' => $loan->remarks,
                'rejected_by' => $loan->rejected_by,
                'rejected_at' => $loan->rejected_at?->format('Y-m-d H:i:s'),
                'created_at' => $loan->created_at->format('Y-m-d H:i:s'),
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
                $q->where('status', 'accepted')
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
                'date_hired' => $memberProfile->date_hired,
                'basic_salary' => $memberProfile->basic_salary,
                'share_capital_balance' => $memberProfile->share_capital_balance,
            ],
            'eligibleCoMakers' => $eligibleCoMakers,
            'previousLoans' => [],
            'error' => null,
            'hasAwaitingComaker' => false,
            'hasActiveLoan' => false,
            'editingLoan' => [
                'id' => $loan->id,
                'loan_type_id' => $loan->loan_type_id,
                'principal_amount' => $loan->principal_amount,
                'terms_months' => $loan->terms_months,
                'co_maker_user_id' => $loan->coMakers->first()?->user_id ?? '',
            ],
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
                'loan.user'
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
                    'status' => $loan->status,
                    'created_at' => $loan->created_at->format('Y-m-d H:i:s'),
                    'requester' => [
                        'id' => $loanUser->id,
                        'name' => trim($loanUser->first_name . ($loanUser->middle_name ? ' ' . $loanUser->middle_name : '') . ' ' . $loanUser->last_name),
                        'email' => $loanUser->email,
                    ],
                ];
            });

        return Inertia::render('dashboards/Member/CoMaker', [
            'coMakerRequests' => $coMakerRequests,
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
        ]);

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

        // If accepted, check if loan can proceed (if co-maker was required)
        if ($status === 'accepted') {
            // Check if all required co-makers have accepted
            $requiredCoMakers = $loanType->requires_comaker ? 1 : 0;
            $acceptedCoMakers = $loan->coMakers()->where('status', 'accepted')->count();
            
            // If co-maker is accepted and no more co-makers needed, update loan status
            if ($acceptedCoMakers >= $requiredCoMakers) {
                $loan->update(['status' => 'pending_gm_review']);
            }
        } else {
            // If rejected, update loan status
            $loan->update(['status' => 'rejected_by_co_maker', 'remarks' => 'Co-maker declined the request.']);
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
                $loan->total_amount_due
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
                      ->where('status', 'accepted');
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
        ]);
    }
}
