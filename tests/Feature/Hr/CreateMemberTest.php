<?php

use App\Mail\NewMemberWelcomeMail;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;

uses(RefreshDatabase::class);

function validCreateMemberPayload(array $overrides = []): array
{
    return array_merge([
        'first_name' => 'Maria',
        'middle_name' => 'Santos',
        'last_name' => 'Reyes',
        'email' => 'maria.reyes@gmail.com',
        'role' => 'member',
        'payroll_id' => 'PAY-1001',
        'place_of_birth' => 'Calamba City, Laguna',
        'date_of_birth' => '1992-05-10',
        'civil_status' => 'single',
        'sex' => 'female',
        'educational_attainment' => 'College',
        'permanent_address' => 'Barangay Real, Calamba City, Laguna',
        'permanent_zip_code' => '4027',
        'permanent_mobile_number' => '09170000001',
        'present_address' => 'Barangay Real, Calamba City, Laguna',
        'present_zip_code' => '4027',
        'mobile_number' => '09170000002',
        'position' => 'Accounting Staff',
        'date_hired' => '2024-01-15',
        'basic_salary' => 25000,
        'income_type' => 'monthly',
        'net_income' => 22000,
        'share_capital_balance' => 15000,
        'other_source_of_income' => 'Online selling',
        'facebook_account_name' => 'Maria Reyes',
        'spouse_occupation' => '',
        'spouse_gross_income' => '',
        'spouse_income_type' => 'monthly',
        'spouse_net_income' => '',
        'legal_beneficiary_1_name' => 'Juan Reyes',
        'real_properties_owned' => 'Residential lot',
    ], $overrides);
}

test('hr can create a member with a generated temporary password and welcome email', function () {
    Mail::fake();

    $hr = User::factory()->create(['role' => 'hr']);

    $this
        ->actingAs($hr)
        ->post(route('users.store'), validCreateMemberPayload())
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('users'));

    $member = User::where('email', 'maria.reyes@gmail.com')->firstOrFail();

    expect($member->role)->toBe('member');
    expect($member->memberProfile)
        ->employee_id->toBe('001')
        ->basic_salary->toBe('25000.00')
        ->share_capital_balance->toBe('15000.00')
        ->place_of_birth->toBe('Calamba City, Laguna')
        ->legal_beneficiary_1_name->toBe('Juan Reyes');

    Mail::assertSent(NewMemberWelcomeMail::class, function (NewMemberWelcomeMail $mail) use ($member) {
        return $mail->hasTo($member->email)
            && $mail->user->is($member)
            && strlen($mail->temporaryPassword) >= 14
            && Hash::check($mail->temporaryPassword, $member->password);
    });
});

test('member creation rejects low salary and share capital values', function () {
    Mail::fake();

    $hr = User::factory()->create(['role' => 'hr']);

    $this
        ->actingAs($hr)
        ->post(route('users.store'), validCreateMemberPayload([
            'basic_salary' => 9999,
            'share_capital_balance' => 9999,
        ]))
        ->assertSessionHasErrors(['basic_salary', 'share_capital_balance']);

    expect(User::where('email', 'maria.reyes@gmail.com')->exists())->toBeFalse();
    Mail::assertNothingSent();
});
