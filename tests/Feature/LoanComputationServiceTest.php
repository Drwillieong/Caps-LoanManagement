<?php

use App\Models\Loan;
use App\Models\LoanType;
use App\Models\User;
use App\Service\ApplyLoan\LoanAmortizationScheduleService;
use App\Service\ApplyLoan\LoanComputationService;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('loan computation follows the workbook pmt based amortized calculation', function () {
    $computed = app(LoanComputationService::class)->compute(125000, 12, 12);

    expect($computed['payment_per_schedule'])->toBe(5540.08)
        ->and($computed['monthly'])->toBe(11080.15)
        ->and($computed['interest'])->toBe(7961.83)
        ->and($computed['total'])->toBe(132961.83)
        ->and($computed['payments_per_year'])->toBe(24)
        ->and($computed['number_of_payments'])->toBe(24);
});

test('amortization schedule stores principal and interest breakdown and reconciles to total due', function () {
    $loanType = LoanType::create([
        'name' => 'COOP Cash Loan',
        'interest_rate_per_annum' => 12,
        'max_term_months' => 24,
        'requires_comaker' => true,
    ]);

    $member = User::factory()->create([
        'role' => 'member',
        'is_active' => true,
    ]);

    $computed = app(LoanComputationService::class)->compute(125000, 12, 12);

    $loan = Loan::create([
        'user_id' => $member->id,
        'loan_type_id' => $loanType->id,
        'principal_amount' => 125000,
        'terms_months' => 12,
        'interest_amount' => $computed['interest'],
        'total_amount_due' => $computed['total'],
        'monthly_amortization' => $computed['monthly'],
        'status' => 'approved',
    ]);

    app(LoanAmortizationScheduleService::class)->generate($loan, Carbon::parse('2026-08-14'));

    $loan->load('amortizations');

    expect($loan->amortizations)->toHaveCount(24)
        ->and($loan->amortizations->first()->due_date->toDateString())->toBe('2026-09-10')
        ->and($loan->amortizations->get(1)->due_date->toDateString())->toBe('2026-09-25')
        ->and(round((float) $loan->amortizations->sum('amount_due'), 2))->toBe(132961.83)
        ->and(round((float) $loan->amortizations->sum('principal_amount'), 2))->toBe(125000.0)
        ->and(round((float) $loan->amortizations->sum('interest_amount'), 2))->toBe(7961.83)
        ->and((float) $loan->amortizations->last()->ending_balance)->toBe(0.0);
});
