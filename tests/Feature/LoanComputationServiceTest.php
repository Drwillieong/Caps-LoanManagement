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
    $computed = app(LoanComputationService::class)->compute(40000, 12, 12);
    $first = $computed['schedule'][0];

    expect($computed['periodic_rate'])->toBe(0.005)
        ->and($computed['payment_per_schedule'])->toBe(1772.82)
        ->and($computed['payment_per_schedule_raw'])->toBeFloat()
        ->and(round($computed['payment_per_schedule_raw'], 12))->toBe(1772.824410110312)
        ->and($computed['monthly'])->toBe(3545.65)
        ->and($computed['interest'])->toBe(2547.79)
        ->and($computed['total'])->toBe(42547.79)
        ->and($computed['payments_per_year'])->toBe(24)
        ->and($computed['number_of_payments'])->toBe(24)
        ->and($first['interest'])->toBe(200.0)
        ->and(round($first['principal'], 12))->toBe(1572.824410110312)
        ->and(round($first['ending_balance'], 12))->toBe(38427.175589889688);
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

test('six month loan uses twelve semi-monthly payment periods', function () {
    $computed = app(LoanComputationService::class)->compute(40000, 6, 12);

    expect($computed['number_of_payments'])->toBe(12)
        ->and($computed['payments_per_year'])->toBe(24)
        ->and($computed['schedule'])->toHaveCount(12)
        ->and($computed['payment_per_schedule'])->toBe(3442.66)
        ->and((float) $computed['schedule'][11]['ending_balance'])->toBe(0.0);
});

test('loan computation handles different principal and rate', function () {
    $principalVariant = app(LoanComputationService::class)->compute(75000, 12, 12);
    $rateVariant = app(LoanComputationService::class)->compute(40000, 12, 10);

    expect($principalVariant['payment_per_schedule'])->toBe(3324.05)
        ->and($principalVariant['total'])->toBe(79777.10)
        ->and($rateVariant['payment_per_schedule'])->toBe(1754.86)
        ->and($rateVariant['total'])->toBe(42116.53);
});

test('extra payment reduces balance and shortens the schedule without overpaying', function () {
    $regular = app(LoanComputationService::class)->compute(40000, 12, 12);
    $withExtra = app(LoanComputationService::class)->compute(40000, 12, 12, 24, 500);

    expect(count($withExtra['schedule']))->toBeLessThan(count($regular['schedule']))
        ->and($withExtra['interest'])->toBeLessThan($regular['interest'])
        ->and((float) $withExtra['schedule'][count($withExtra['schedule']) - 1]['ending_balance'])->toBe(0.0)
        ->and($withExtra['total'])->toBeLessThan($regular['total']);
});

test('final payment is capped at remaining balance', function () {
    $computed = app(LoanComputationService::class)->compute(1000, 12, 12, 24, 1000);
    $last = $computed['schedule'][count($computed['schedule']) - 1];

    expect($last['ending_balance'])->toBe(0.0)
        ->and($last['principal'])->toBeLessThanOrEqual($last['beginning_balance'])
        ->and($last['total_payment'])->toBeLessThanOrEqual($last['scheduled_payment'] + $last['extra_payment'] + $last['interest']);
});

test('invalid loan computation inputs return zeroed calculation', function (float $principal, int $months, float $rate, float $extra) {
    $computed = app(LoanComputationService::class)->compute($principal, $months, $rate, 24, $extra);

    expect($computed['payment_per_schedule'])->toBe(0.0)
        ->and($computed['number_of_payments'])->toBe(0)
        ->and($computed['schedule'])->toBe([]);
})->with([
    [0, 12, 12, 0],
    [-1, 12, 12, 0],
    [40000, 0, 12, 0],
    [40000, -1, 12, 0],
    [40000, 12, -1, 0],
    [40000, 12, 12, -1],
]);
