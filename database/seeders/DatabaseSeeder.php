<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\MemberProfile;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // HR Admin
        User::create([
            'first_name' => 'HrAdmin',
            'middle_name' => '',
            'last_name' => '',
            'email' => 'hradmin@gmail.com',
            'password' => Hash::make('admin123'),
            'role' => 'hr',
            'is_active' => true,
        ]);

         // Gm Admin
        User::create([
            'first_name' => 'Admin',
            'middle_name' => '',
            'last_name' => '',
            'email' => 'gmadmin@gmail.com',
            'password' => Hash::make('admin123'),
            'role' => 'gm',
            'is_active' => true,
        ]);

         User::create([
            'first_name' => 'Admin',
            'middle_name' => '',
            'last_name' => '',
            'email' => 'creditadmin@gmail.com',
            'password' => Hash::make('admin123'),
            'role' => 'creditcom',
            'is_active' => true,
        ]);

        // Test Member
       $user = User::create([
    'first_name' => 'Jairus',
    'middle_name' => 'Sotto',
    'last_name' => 'Pecho',
    'email' => 'jairuspecho19@gmail.com',
    'password' => Hash::make('admin123'),
    'role' => 'member',
    'is_active' => true,
]);

MemberProfile::create([
    'user_id' => $user->id,

    'employee_id' => 'EMP-001',
    'first_name' => 'Jairus',
    'middle_name' => 'Sotto',
    'last_name' => 'Pecho',

    'date_of_birth' => '2002-05-19',
    'sex' => 'male',
    'civil_status' => 'single',
    'spouse_name' => null,

    // Contact
    'mobile_number' => '09123456789',
    'present_address' => 'Majayjay, Laguna',
    'permanent_address' => 'Majayjay, Laguna',

    // Employment
    'position' => 'IT Staff',
    'date_hired' => '2024-01-15',
    'basic_salary' => 25000.00,

    // Financial
    'share_capital_balance' => 0,
    'bank_account_number' => '1234567890',
    'tin_number' => '123-456-789',
]);
        $this->call(LoanTypeSeeder::class);
    }
}