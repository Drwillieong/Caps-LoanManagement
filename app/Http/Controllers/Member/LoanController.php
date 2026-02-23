<?php

namespace App\Http\Controllers\Member;

use App\Http\Controllers\Controller;
use App\Models\Loan;
use App\Models\LoanCoMaker;
use App\Models\LoanType;
use App\Models\MemberProfile;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
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
            )
            ->whereNot('name', 'like', '%Tiangge%')
            ->whereNot('name', 'like', '%Rice%')
            ->get(),

            'eligibleCoMakers' => User::where('role', 'member')
                ->where('id', '!=', $user->id)
                ->whereDoesntHave('coMakerLoans.loan', function ($q) {
                    $q->whereIn('status', ['approved', 'released']);
                })
                ->select('id', 'name', 'email')
                ->get(),

            'previousLoans' => $previousLoans,
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

        // Share capital rule (x2)
        $maxLoan = $profile->share_capital_balance * 2;
        if ($validated['principal_amount'] > $maxLoan) {
            return back()->withErrors([
                'principal_amount' => 'Loan amount exceeds allowed share capital limit.'
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

        // Co-maker restriction rule
        if (!empty($validated['co_maker_user_id'])) {
            $coMakerHasActiveLoan = Loan::whereIn('status', ['approved', 'released'])
                ->whereHas('coMakers', function ($q) use ($validated) {
                    $q->where('user_id', $validated['co_maker_user_id']);
                })
                ->exists();

            if ($coMakerHasActiveLoan) {
                return back()->withErrors([
                    'co_maker_user_id' => 'Selected co-maker is already assigned to another active loan.'
                ]);
            }
        }

        /** ===============================
         *  COMPUTATION
         * =============================== */

        $loanType = LoanType::findOrFail($validated['loan_type_id']);

        $interest = ($validated['principal_amount'] * ($loanType->interest_rate_per_annum / 100))
            * ($validated['terms_months'] / 12);

        $total = $validated['principal_amount'] + $interest;
        $monthly = $total / $validated['terms_months'];

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
        }

        return redirect()
            ->route('dashboard')
            ->with('success', 'Loan application submitted successfully.');
    }
}
