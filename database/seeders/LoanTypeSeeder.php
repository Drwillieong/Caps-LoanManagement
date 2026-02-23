<?php

namespace Database\Seeders;

use App\Models\LoanType;
use Illuminate\Database\Seeder;

class LoanTypeSeeder extends Seeder
{   
    /**`
     * Run the database seeds.
     */
    public function run(): void
    {
        LoanType::create([
            'name' => 'COOP Cash Loan',
            'interest_rate_per_annum' => 12.00,
            'max_term_months' => 24,
            'requires_comaker' => true,
        ]);

       /* LoanType::create([
            'name' => 'COOP Cellphone',
            'interest_rate_per_annum' => 15.00,
            'max_term_months' => 12,
            'requires_comaker' => true,
        ]);

        LoanType::create([
            'name' => 'COOP Appliances',
            'interest_rate_per_annum' => 15.00,
            'max_term_months' => 12,
            'requires_comaker' => true,
        ]);

        LoanType::create([
            'name' => 'COOP Rice',
            'interest_rate_per_annum' => 0.00,
            'max_term_months' => 3,
            'requires_comaker' => false,
        ]);

        LoanType::create([
            'name' => 'COOP Tiangge',
            'interest_rate_per_annum' => 15.00,
            'max_term_months' => 12,
            'requires_comaker' => true,
        ]);

        LoanType::create([
            'name' => 'COOP Tiangge (J.CO)',
            'interest_rate_per_annum' => 15.00,
            'max_term_months' => 12,
            'requires_comaker' => true,
        ]);

        LoanType::create([
            'name' => 'COOP Tiangge (HAM)',
            'interest_rate_per_annum' => 15.00,
            'max_term_months' => 12,
            'requires_comaker' => true,
        ]); */
    }
}
