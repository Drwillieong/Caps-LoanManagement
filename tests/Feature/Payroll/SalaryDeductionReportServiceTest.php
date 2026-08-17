<?php

use App\Models\Loan;
use App\Models\LoanAmortization;
use App\Models\LoanType;
use App\Models\User;
use App\Services\Payroll\SalaryDeductionReportService;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('salary deduction export includes open schedules due through the selected cutoff', function () {
    $loanType = LoanType::create([
        'name' => 'Regular Loan',
        'interest_rate_per_annum' => 12,
        'max_term_months' => 12,
        'requires_comaker' => false,
    ]);

    $member = User::factory()->create([
        'role' => 'member',
        'is_active' => true,
    ]);

    $member->memberProfile()->update([
        'members_id' => 'EMP-001',
        'payroll_id' => 'PAY-001',
        'account_status' => 'active',
    ]);

    $loan = Loan::create([
        'user_id' => $member->id,
        'loan_type_id' => $loanType->id,
        'principal_amount' => 10000,
        'terms_months' => 12,
        'interest_amount' => 1200,
        'total_amount_due' => 11200,
        'monthly_amortization' => 933.33,
        'status' => 'released',
    ]);

    LoanAmortization::create([
        'loan_id' => $loan->id,
        'installment_number' => 1,
        'due_date' => '2026-07-10',
        'amount_due' => 500,
        'amount_paid' => 100,
        'status' => 'partial',
    ]);

    LoanAmortization::create([
        'loan_id' => $loan->id,
        'installment_number' => 2,
        'due_date' => '2026-08-10',
        'amount_due' => 500,
        'amount_paid' => 0,
        'status' => 'pending',
    ]);

    $inactiveMember = User::factory()->create([
        'role' => 'member',
        'is_active' => false,
    ]);

    $inactiveLoan = Loan::create([
        'user_id' => $inactiveMember->id,
        'loan_type_id' => $loanType->id,
        'principal_amount' => 10000,
        'terms_months' => 12,
        'interest_amount' => 1200,
        'total_amount_due' => 11200,
        'monthly_amortization' => 933.33,
        'status' => 'released',
    ]);

    LoanAmortization::create([
        'loan_id' => $inactiveLoan->id,
        'installment_number' => 1,
        'due_date' => '2026-07-10',
        'amount_due' => 500,
        'amount_paid' => 0,
        'status' => 'pending',
    ]);

    $rows = app(SalaryDeductionReportService::class)
        ->rowsForCutoff(Carbon::parse('2026-07-25'))
        ->all();

    expect($rows)->toHaveCount(1)
        ->and($rows[0]['members_id'])->toBe('EMP-001')
        ->and($rows[0]['payroll_id'])->toBe('PAY-001')
        ->and($rows[0])->not->toHaveKey('member_id')
        ->and($rows[0]['cutoff_date'])->toBe('2026-07-25')
        ->and($rows[0]['deduction_amount'])->toBe(400.0)
        ->and($rows[0]['remarks'])->toContain('due 2026-07-10');
});

test('salary deduction export falls forward to the next open schedule when no installment is due yet', function () {
    $loanType = LoanType::create([
        'name' => 'Regular Loan',
        'interest_rate_per_annum' => 12,
        'max_term_months' => 12,
        'requires_comaker' => false,
    ]);

    $member = User::factory()->create([
        'role' => 'member',
        'is_active' => true,
    ]);

    $member->memberProfile()->update([
        'members_id' => 'EMP-002',
        'payroll_id' => 'PAY-002',
        'account_status' => 'active',
    ]);

    $loan = Loan::create([
        'user_id' => $member->id,
        'loan_type_id' => $loanType->id,
        'principal_amount' => 10000,
        'terms_months' => 12,
        'interest_amount' => 1200,
        'total_amount_due' => 11200,
        'monthly_amortization' => 933.33,
        'status' => 'released',
    ]);

    LoanAmortization::create([
        'loan_id' => $loan->id,
        'installment_number' => 1,
        'due_date' => '2026-08-25',
        'amount_due' => 500,
        'amount_paid' => 0,
        'status' => 'pending',
    ]);

    LoanAmortization::create([
        'loan_id' => $loan->id,
        'installment_number' => 2,
        'due_date' => '2026-09-10',
        'amount_due' => 500,
        'amount_paid' => 0,
        'status' => 'pending',
    ]);

    $rows = app(SalaryDeductionReportService::class)
        ->rowsForCutoff(Carbon::parse('2026-07-31'))
        ->all();

    expect($rows)->toHaveCount(1)
        ->and($rows[0]['members_id'])->toBe('EMP-002')
        ->and($rows[0])->not->toHaveKey('member_id')
        ->and($rows[0]['cutoff_date'])->toBe('2026-08-25')
        ->and($rows[0]['deduction_amount'])->toBe(500.0)
        ->and($rows[0]['remarks'])->toContain('due 2026-08-25');
});
