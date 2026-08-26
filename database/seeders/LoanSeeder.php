<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Loan;
use App\Models\LoanCoMaker;
use App\Models\LoanAmortization;
use App\Models\LoanPayment;
use Carbon\Carbon;

class LoanSeeder extends Seeder
{
    public function run(): void
    {
        // ===============================
        // 1. COMPLETED LOAN (Jairus)
        // ===============================
        $loan1 = Loan::create([
            'user_id' => 4,
            'loan_type_id' => 1,
            'principal_amount' => 20000.00,
            'terms_months' => 12,
            'interest_amount' => 2000.00,
            'total_amount_due' => 22000.00,
            'monthly_amortization' => 1833.33,
            'voucher_number' => 'CV-2026-001',
            'check_number' => 'CHK-001',
            'release_date' => Carbon::now()->subMonths(14)->day(10),
            'status' => 'paid_off',
        ]);

        LoanCoMaker::create([
            'loan_id' => $loan1->id,
            'user_id' => 5,
            'status' => 'accepted',
            'responded_at' => Carbon::now()->subMonths(14)->day(5),
        ]);

        $this->createAmortizations($loan1, 12, true);
        $this->createPayments($loan1, 12);


        // ===============================
        // 2. ACTIVE LOAN (Jairus)
        // ===============================
       

        // ===============================
        // 3. REJECTED (Jairus)
        // ===============================
       Loan::create([
    'user_id' => 4,
    'loan_type_id' => 1,
    'principal_amount' => 30000.00,
    'terms_months' => 24,
    'interest_amount' => 0.00,
    'total_amount_due' => 0.00,
    'monthly_amortization' => 0.00,
    'status' => 'rejected_by_gm',
    'remarks' => 'High DSR',
    'rejected_by' => 'gm',
    'rejected_at' => Carbon::now()->subMonth(),
]);


        // ===============================
        // 4. COMPLETED (Kevin)
        // ===============================
        $loan4 = Loan::create([
            'user_id' => 5,
            'loan_type_id' => 1,
            'principal_amount' => 10000.00,
            'terms_months' => 6,
            'interest_amount' => 600.00,
            'total_amount_due' => 10600.00,
            'monthly_amortization' => 1766.67,
            'voucher_number' => 'CV-2026-003',
            'check_number' => 'CHK-003',
            'release_date' => Carbon::now()->subMonths(14)->day(25),
            'status' => 'paid_off',
        ]);

        LoanCoMaker::create([
            'loan_id' => $loan4->id,
            'user_id' => 4,
            'status' => 'accepted',
            'responded_at' => Carbon::now()->subMonths(14)->day(20),
        ]);

        $this->createAmortizations($loan4, 6, true);
        $this->createPayments($loan4, 6);


        // ===============================
        // 5. ACTIVE (Kevin)
        // ===============================
        $loan5 = Loan::create([
            'user_id' => 5,
            'loan_type_id' => 1,
            'principal_amount' => 12000.00,
            'terms_months' => 12,
            'interest_amount' => 1440.00,
            'total_amount_due' => 13440.00,
            'monthly_amortization' => 1120.00,
            'voucher_number' => 'CV-2026-004',
            'check_number' => 'CHK-004',
            'release_date' => Carbon::now()->subMonth()->day(10),
            'status' => 'released',
        ]);

        LoanCoMaker::create([
            'loan_id' => $loan5->id,
            'user_id' => 3,
            'status' => 'accepted',
            'responded_at' => Carbon::now()->subMonth()->day(5),
        ]);

        $this->createAmortizations($loan5, 12, false);
        $this->createPayments($loan5, null);


        // ===============================
        // 6. REJECTED (Kevin)
        // ===============================
       Loan::create([
    'user_id' => 5,
    'loan_type_id' => 1,
    'principal_amount' => 25000.00,
    'terms_months' => 18,
    'interest_amount' => 0.00,
    'total_amount_due' => 0.00,
    'monthly_amortization' => 0.00,
    'status' => 'rejected_by_credit_com',
    'remarks' => 'Insufficient capital',
    'rejected_by' => 'credit_com',
    'rejected_at' => Carbon::now()->subDays(5),
]);
    }


    // =========================================
    // FIXED AMORTIZATION (10 & 25 ONLY)
    // =========================================
    private function createAmortizations($loan, $terms, $fullyPaid = false)
    {
        $start = Carbon::parse($loan->release_date)->copy();
        $scheduleDates = [];

        while (count($scheduleDates) < $terms) {
            $month = $start->copy();

            // 10th
            $d10 = $month->copy()->day(10);
            if ($d10 >= $loan->release_date) {
                $scheduleDates[] = $d10;
            }

            // 25th
            $d25 = $month->copy()->day(25);
            if ($d25 >= $loan->release_date) {
                $scheduleDates[] = $d25;
            }

            $start->addMonth();
        }

        $scheduleDates = array_slice($scheduleDates, 0, $terms);

        foreach ($scheduleDates as $index => $date) {
            $isPast = $date->lte(now());

            $status = $fullyPaid
                ? 'paid'
                : ($isPast ? 'paid' : 'pending');

            LoanAmortization::create([
                'loan_id' => $loan->id,
                'installment_number' => $index + 1,
                'due_date' => $date,
                'amount_due' => $loan->monthly_amortization,
                'amount_paid' => $status === 'paid' ? $loan->monthly_amortization : 0,
                'status' => $status,
            ]);
        }
    }


    // =========================================
    // FIXED PAYMENTS (NO FUTURE PAID)
    // =========================================
    private function createPayments($loan, $limit = null)
    {
        $amortizations = LoanAmortization::where('loan_id', $loan->id)
            ->where('status', 'paid')
            ->orderBy('due_date')
            ->get();

        if ($limit) {
            $amortizations = $amortizations->take($limit);
        }

        foreach ($amortizations as $i => $amort) {
            LoanPayment::create([
                'loan_id' => $loan->id,
                'amount' => $loan->monthly_amortization,
                'payment_date' => $amort->due_date, // EXACT 10 or 25
                'reference_number' => 'PAY-' . $loan->voucher_number . '-' . str_pad($i + 1, 3, '0', STR_PAD_LEFT),
                'paid_by' => $loan->user->first_name . ' ' . $loan->user->last_name,
            ]);
        }
    }
}