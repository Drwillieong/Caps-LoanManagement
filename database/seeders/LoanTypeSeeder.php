<?php

namespace Database\Seeders;

use App\Models\LoanType;
use Illuminate\Database\Seeder;

class LoanTypeSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        LoanType::create([
            'name' => 'Cash Loan',
            'interest_rate_per_annum' => 12.00,
            'max_term_months' => 24,
            'requires_comaker' => true,
        ]);

        LoanType::create([
            'name' => 'Rice Loan',
            'interest_rate_per_annum' => 0.00,
            'max_term_months' => 3,
            'requires_comaker' => false,
        ]);

        LoanType::create([
            'name' => 'Appliance Loan',
            'interest_rate_per_annum' => 15.00,
            'max_term_months' => 12,
            'requires_comaker' => true,
        ]);

        LoanType::create([
            'name' => 'Motor Loan',
            'interest_rate_per_annum' => 12.00,
            'max_term_months' => 36,
            'requires_comaker' => true,
        ]);
    }
}

