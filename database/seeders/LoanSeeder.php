<?php

namespace Database\Seeders;

use App\Models\Loan;
use App\Models\LoanAmortization;
use App\Models\LoanCoMaker;
use App\Models\LoanPayment;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

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

        // ===============================
        // 7. ACTIVE RELEASED (Jairus)
        // ===============================
        $loan7 = Loan::create([
            'user_id' => 4,
            'loan_type_id' => 1,
            'principal_amount' => 15000.00,
            'terms_months' => 6,
            'interest_amount' => 1200.00,
            'total_amount_due' => 16200.00,
            'monthly_amortization' => 2700.00,
            'voucher_number' => 'CV-2026-005',
            'check_number' => 'CHK-005',
            'release_date' => Carbon::now()->subMonths(2)->day(15),
            'status' => 'released',
        ]);

        LoanCoMaker::create([
            'loan_id' => $loan7->id,
            'user_id' => 5,
            'status' => 'accepted',
            'responded_at' => Carbon::now()->subMonths(2)->day(10),
        ]);

        $this->createAmortizations($loan7, 6, false);
        $this->createPayments($loan7, null);

        // ===============================
        // 8. PENDING GM REVIEW (Kevin)
        // ===============================
        Loan::create([
            'user_id' => 5,
            'loan_type_id' => 1,
            'principal_amount' => 30000.00,
            'terms_months' => 24,
            'interest_amount' => 3600.00,
            'total_amount_due' => 33600.00,
            'monthly_amortization' => 1400.00,
            'status' => 'pending_gm_review',
            'remarks' => 'For GM approval',
        ]);

        // ===============================
        // 9. PENDING CC REVIEW (Jairus)
        // ===============================
        Loan::create([
            'user_id' => 4,
            'loan_type_id' => 1,
            'principal_amount' => 20000.00,
            'terms_months' => 12,
            'interest_amount' => 2400.00,
            'total_amount_due' => 22400.00,
            'monthly_amortization' => 1866.67,
            'status' => 'pending_cc_review',
            'remarks' => 'Endorsed by GM',
        ]);

        // ===============================
        // 10. ENDORSED BY GM (Kevin)
        // ===============================
        Loan::create([
            'user_id' => 5,
            'loan_type_id' => 1,
            'principal_amount' => 18000.00,
            'terms_months' => 12,
            'interest_amount' => 2160.00,
            'total_amount_due' => 20160.00,
            'monthly_amortization' => 1680.00,
            'status' => 'endorsed_by_gm',
            'remarks' => 'GM approved, pending CC',
        ]);

        // ===============================
        // 11. AWAITING COMAKER (Jairus)
        // ===============================
        Loan::create([
            'user_id' => 4,
            'loan_type_id' => 1,
            'principal_amount' => 25000.00,
            'terms_months' => 18,
            'interest_amount' => 3000.00,
            'total_amount_due' => 28000.00,
            'monthly_amortization' => 1555.56,
            'status' => 'awaiting_comaker',
            'remarks' => 'Waiting for co-maker response',
        ]);

        // ===============================
        // 12. APPROVED (Kevin)
        // ===============================
        Loan::create([
            'user_id' => 5,
            'loan_type_id' => 1,
            'principal_amount' => 22000.00,
            'terms_months' => 12,
            'interest_amount' => 2640.00,
            'total_amount_due' => 24640.00,
            'monthly_amortization' => 2053.33,
            'status' => 'approved',
            'remarks' => 'Approved by CC, awaiting release',
        ]);

        // ===============================
        // 13. REJECTED BY CO-MAKER (Jairus)
        // ===============================
        Loan::create([
            'user_id' => 4,
            'loan_type_id' => 1,
            'principal_amount' => 12000.00,
            'terms_months' => 6,
            'interest_amount' => 720.00,
            'total_amount_due' => 12720.00,
            'monthly_amortization' => 2120.00,
            'status' => 'rejected_by_co_maker',
            'remarks' => 'Co-maker declined request',
            'co_maker_rejection_reason' => 'Already a co-maker for another loan',
            'rejected_by' => 'co_maker',
            'rejected_at' => Carbon::now()->subDays(10),
        ]);

        // ===============================
        // 14. DRAFT (Kevin)
        // ===============================
        Loan::create([
            'user_id' => 5,
            'loan_type_id' => 1,
            'principal_amount' => 10000.00,
            'terms_months' => 6,
            'interest_amount' => 600.00,
            'total_amount_due' => 10600.00,
            'monthly_amortization' => 1766.67,
            'status' => 'draft',
            'remarks' => 'Application not yet submitted',
        ]);

        // ===============================
        // 15. ACTIVE RELEASED (Maria - user 6)
        // ===============================
        $loan15 = Loan::create([
            'user_id' => 6,
            'loan_type_id' => 1,
            'principal_amount' => 25000.00,
            'terms_months' => 12,
            'interest_amount' => 3000.00,
            'total_amount_due' => 28000.00,
            'monthly_amortization' => 2333.33,
            'voucher_number' => 'CV-2026-006',
            'check_number' => 'CHK-006',
            'release_date' => Carbon::now()->subMonth()->day(20),
            'status' => 'released',
        ]);

        LoanCoMaker::create([
            'loan_id' => $loan15->id,
            'user_id' => 7,
            'status' => 'accepted',
            'responded_at' => Carbon::now()->subMonth()->day(15),
        ]);

        $this->createAmortizations($loan15, 12, false);
        $this->createPayments($loan15, null);

        // ===============================
        // 16. PENDING GM REVIEW (Antonio - user 7)
        // ===============================
        Loan::create([
            'user_id' => 7,
            'loan_type_id' => 1,
            'principal_amount' => 15000.00,
            'terms_months' => 6,
            'interest_amount' => 900.00,
            'total_amount_due' => 15900.00,
            'monthly_amortization' => 2650.00,
            'status' => 'pending_gm_review',
            'remarks' => 'First time applicant',
        ]);

        // ===============================
        // 17. PAID OFF (Cristina - user 8)
        // ===============================
        $loan17 = Loan::create([
            'user_id' => 8,
            'loan_type_id' => 1,
            'principal_amount' => 10000.00,
            'terms_months' => 6,
            'interest_amount' => 600.00,
            'total_amount_due' => 10600.00,
            'monthly_amortization' => 1766.67,
            'voucher_number' => 'CV-2026-007',
            'check_number' => 'CHK-007',
            'release_date' => Carbon::now()->subMonths(10)->day(5),
            'status' => 'paid_off',
        ]);

        LoanCoMaker::create([
            'loan_id' => $loan17->id,
            'user_id' => 9,
            'status' => 'accepted',
            'responded_at' => Carbon::now()->subMonths(10)->day(1),
        ]);

        $this->createAmortizations($loan17, 6, true);
        $this->createPayments($loan17, 6);

        // ===============================
        // 18. RELEASED ACTIVE (Fernando - user 9)
        // ===============================
        $loan18 = Loan::create([
            'user_id' => 9,
            'loan_type_id' => 1,
            'principal_amount' => 35000.00,
            'terms_months' => 24,
            'interest_amount' => 8400.00,
            'total_amount_due' => 43400.00,
            'monthly_amortization' => 1808.33,
            'voucher_number' => 'CV-2026-008',
            'check_number' => 'CHK-008',
            'release_date' => Carbon::now()->subMonths(3)->day(10),
            'status' => 'released',
        ]);

        LoanCoMaker::create([
            'loan_id' => $loan18->id,
            'user_id' => 10,
            'status' => 'accepted',
            'responded_at' => Carbon::now()->subMonths(3)->day(5),
        ]);

        $this->createAmortizations($loan18, 24, false);
        $this->createPayments($loan18, null);

        // ===============================
        // 19. PENDING CC REVIEW (Lourdes - user 10)
        // ===============================
        Loan::create([
            'user_id' => 10,
            'loan_type_id' => 1,
            'principal_amount' => 20000.00,
            'terms_months' => 12,
            'interest_amount' => 2400.00,
            'total_amount_due' => 22400.00,
            'monthly_amortization' => 1866.67,
            'status' => 'pending_cc_review',
            'remarks' => 'GM endorsed',
        ]);

        // ===============================
        // 20. APPROVED (Rafael - user 11)
        // ===============================
        Loan::create([
            'user_id' => 11,
            'loan_type_id' => 1,
            'principal_amount' => 28000.00,
            'terms_months' => 18,
            'interest_amount' => 5040.00,
            'total_amount_due' => 33040.00,
            'monthly_amortization' => 1835.56,
            'status' => 'approved',
            'remarks' => 'CC approved, awaiting release date',
        ]);

        // ===============================
        // 21. RELEASED ACTIVE (Elena - user 12)
        // ===============================
        $loan21 = Loan::create([
            'user_id' => 12,
            'loan_type_id' => 1,
            'principal_amount' => 18000.00,
            'terms_months' => 6,
            'interest_amount' => 1080.00,
            'total_amount_due' => 19080.00,
            'monthly_amortization' => 3180.00,
            'voucher_number' => 'CV-2026-009',
            'check_number' => 'CHK-009',
            'release_date' => Carbon::now()->subWeeks(2)->day(10),
            'status' => 'released',
        ]);

        LoanCoMaker::create([
            'loan_id' => $loan21->id,
            'user_id' => 13,
            'status' => 'accepted',
            'responded_at' => Carbon::now()->subWeeks(2)->day(5),
        ]);

        $this->createAmortizations($loan21, 6, false);
        $this->createPayments($loan21, null);

        // ===============================
        // 22. PAID OFF (Roberto - user 13)
        // ===============================
        $loan22 = Loan::create([
            'user_id' => 13,
            'loan_type_id' => 1,
            'principal_amount' => 12000.00,
            'terms_months' => 6,
            'interest_amount' => 720.00,
            'total_amount_due' => 12720.00,
            'monthly_amortization' => 2120.00,
            'voucher_number' => 'CV-2026-010',
            'check_number' => 'CHK-010',
            'release_date' => Carbon::now()->subMonths(8)->day(15),
            'status' => 'paid_off',
        ]);

        LoanCoMaker::create([
            'loan_id' => $loan22->id,
            'user_id' => 14,
            'status' => 'accepted',
            'responded_at' => Carbon::now()->subMonths(8)->day(10),
        ]);

        $this->createAmortizations($loan22, 6, true);
        $this->createPayments($loan22, 6);

        // ===============================
        // 23. REJECTED BY GM (Theresa - user 14)
        // ===============================
        Loan::create([
            'user_id' => 14,
            'loan_type_id' => 1,
            'principal_amount' => 30000.00,
            'terms_months' => 24,
            'interest_amount' => 3600.00,
            'total_amount_due' => 33600.00,
            'monthly_amortization' => 1400.00,
            'status' => 'rejected_by_gm',
            'remarks' => 'High debt-to-income ratio',
            'rejected_by' => 'gm',
            'rejected_at' => Carbon::now()->subDays(7),
        ]);

        // ===============================
        // 24. AWAITING COMAKER (Jose - user 15)
        // ===============================
        Loan::create([
            'user_id' => 15,
            'loan_type_id' => 1,
            'principal_amount' => 20000.00,
            'terms_months' => 12,
            'interest_amount' => 2400.00,
            'total_amount_due' => 22400.00,
            'monthly_amortization' => 1866.67,
            'status' => 'awaiting_comaker',
            'remarks' => 'Co-maker invited but not yet responded',
        ]);

        // ===============================
        // 25. PENDING GM REVIEW (Maria - user 6)
        // ===============================
        Loan::create([
            'user_id' => 6,
            'loan_type_id' => 1,
            'principal_amount' => 18000.00,
            'terms_months' => 12,
            'interest_amount' => 2160.00,
            'total_amount_due' => 20160.00,
            'monthly_amortization' => 1680.00,
            'status' => 'pending_gm_review',
            'remarks' => 'For GM evaluation',
        ]);

        // ===============================
        // 26. REJECTED BY CREDIT COM (Antonio - user 7)
        // ===============================
        Loan::create([
            'user_id' => 7,
            'loan_type_id' => 1,
            'principal_amount' => 25000.00,
            'terms_months' => 18,
            'interest_amount' => 3000.00,
            'total_amount_due' => 28000.00,
            'monthly_amortization' => 1555.56,
            'status' => 'rejected_by_credit_com',
            'remarks' => 'Insufficient share capital',
            'rejected_by' => 'credit_com',
            'rejected_at' => Carbon::now()->subDays(3),
        ]);

        // ===============================
        // 27. DRAFT (Cristina - user 8)
        // ===============================
        Loan::create([
            'user_id' => 8,
            'loan_type_id' => 1,
            'principal_amount' => 15000.00,
            'terms_months' => 6,
            'interest_amount' => 900.00,
            'total_amount_due' => 15900.00,
            'monthly_amortization' => 2650.00,
            'status' => 'draft',
            'remarks' => 'Saved as draft',
        ]);

        // ===============================
        // 28. ACTIVE RELEASED (Fernando - user 9)
        // ===============================
        $loan28 = Loan::create([
            'user_id' => 9,
            'loan_type_id' => 1,
            'principal_amount' => 20000.00,
            'terms_months' => 12,
            'interest_amount' => 2400.00,
            'total_amount_due' => 22400.00,
            'monthly_amortization' => 1866.67,
            'voucher_number' => 'CV-2026-011',
            'check_number' => 'CHK-011',
            'release_date' => Carbon::now()->subMonths(4)->day(10),
            'status' => 'released',
        ]);

        LoanCoMaker::create([
            'loan_id' => $loan28->id,
            'user_id' => 6,
            'status' => 'accepted',
            'responded_at' => Carbon::now()->subMonths(4)->day(5),
        ]);

        $this->createAmortizations($loan28, 12, false);
        $this->createPayments($loan28, null);
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
                'reference_number' => 'PAY-'.$loan->voucher_number.'-'.str_pad($i + 1, 3, '0', STR_PAD_LEFT),
                'paid_by' => $loan->user->first_name.' '.$loan->user->last_name,
            ]);
        }
    }
}
