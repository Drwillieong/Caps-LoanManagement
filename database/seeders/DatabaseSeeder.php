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
            'first_name' => 'Secretary Admin',
            'middle_name' => '',
            'last_name' => '',
            'email' => 'hradmin@gmail.com',
            'password' => Hash::make('admin123'),
            'role' => 'hr',
            'is_active' => true,
             'status' => 'active',
        ]);

        // GM Admin
        User::create([
            'first_name' => 'General Maneger Admin',
            'middle_name' => '',
            'last_name' => '',
            'email' => 'gmadmin@gmail.com',
            'password' => Hash::make('admin123'),
            'role' => 'gm',
            'is_active' => true,
             'status' => 'active',
              'status' => 'active',
        ]);

        // Credit Committee Admin
        User::create([
            'first_name' => 'Credit Committee Admin',
            'middle_name' => '',
            'last_name' => '',
            'email' => 'creditadmin@gmail.com',
            'password' => Hash::make('admin123'),
            'role' => 'creditcom',
            'is_active' => true,
             'status' => 'active',
        ]);

        // -----------------------------
        // Test Member 1
        // -----------------------------
        $user = User::create([
            'first_name' => 'Jairus',
            'middle_name' => 'Sotto',
            'last_name' => 'Pecho',
            'email' => 'jairuspecho19@gmail.com',
            'password' => Hash::make('admin123'),
            'role' => 'member',
            'is_active' => true,
             'status' => 'active',
        ]);

        MemberProfile::create([
            'user_id' => $user->id,

            'employee_id' => '001',
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
            'basic_salary' => 25000.00,

            // Financial
            'share_capital_balance' => 20000.00,
            'bank_account_number' => '1234567890',
            'tin_number' => '123-456-789',
        ]);

        // -----------------------------
        // Test Member 2
        // -----------------------------
        $user = User::create([
            'first_name' => 'Kevin ',
            'middle_name' => 'Corpuz',
            'last_name' => 'Bolado',
            'email' => 'kevincorpuz321@gmail.com',
            'password' => Hash::make('admin123'),
            'role' => 'member',
            'is_active' => true,
             'status' => 'active',
        ]);

        MemberProfile::create([
            'user_id' => $user->id,

            'employee_id' => '002', // fixed duplicate
            'first_name' => 'Kevin ',
            'middle_name' => 'Corpuz',
            'last_name' => 'Bolado',

            'date_of_birth' => '2002-12-01',
            'sex' => 'female',
            'civil_status' => 'single',
            'spouse_name' => null,

            // Contact
            'mobile_number' => '09123456789',
            'present_address' => 'Majayjay, Laguna',
            'permanent_address' => 'Majayjay, Laguna',

            // Employment
            'position' => 'IT Staff',
            'basic_salary' => 20000.00,

            // Financial
            'share_capital_balance' => 15000.00,
            'bank_account_number' => '1234567890',
            'tin_number' => '123-456-789',
        ]);
        // -----------------------------
// Test Member 3
// -----------------------------
$user = User::create([
    'first_name' => 'Kayhleen',
    'middle_name' => '',
    'last_name' => 'Minor',
    'email' => 'nyak123457@gmail.com',
    'password' => Hash::make('admin123'),
    'role' => 'member',
    'is_active' => true,
     'status' => 'active',
]);

MemberProfile::create([
    'user_id' => $user->id,

    'employee_id' => '003',
    'first_name' => 'Kayhleen',
    'middle_name' => '',
    'last_name' => 'Minor',

    'date_of_birth' => '1998-08-12',
    'sex' => 'male',
    'civil_status' => 'single',
    'spouse_name' => null,

    'mobile_number' => '09171234567',
    'present_address' => 'Barangay Real, Calamba City, Laguna',
    'permanent_address' => 'Barangay Real, Calamba City, Laguna',

    'position' => 'Accounting Staff',
    'basic_salary' => 24000.00,

    'share_capital_balance' => 18000.00,
    'bank_account_number' => '1000000003',
    'tin_number' => '111-222-333',
]);

// -----------------------------
// Test Member 4
// -----------------------------
$user = User::create([
    'first_name' => 'Jackie',
    'middle_name' => '',
    'last_name' => 'Gallora',
    'email' => 'jackiewxyz0412@gmail.com',
    'password' => Hash::make('admin123'),
    'role' => 'member',
    'is_active' => true,
     'status' => 'active',
]);

MemberProfile::create([
    'user_id' => $user->id,

    'employee_id' => '004',
    'first_name' => 'Jackie',
    'middle_name' => '',
    'last_name' => 'Gallora',

    'date_of_birth' => '1999-04-25',
    'sex' => 'female',
    'civil_status' => 'single',
    'spouse_name' => null,

    'mobile_number' => '09181234567',
    'present_address' => 'Barangay Parian, Calamba City, Laguna',
    'permanent_address' => 'Barangay Parian, Calamba City, Laguna',

    'position' => 'HR Assistant',
    'basic_salary' => 23000.00,

    'share_capital_balance' => 21000.00,
    'bank_account_number' => '1000000004',
    'tin_number' => '222-333-444',
]);

// -----------------------------
// Test Member 5
// -----------------------------
$user = User::create([
    'first_name' => 'John Vincent',
    'middle_name' => 'Cruz',
    'last_name' => 'Saberdo',
    'email' => 'johnvincentsaberdo@gmail.com',
    'password' => Hash::make('admin123'),
    'role' => 'member',
    'is_active' => true,
     'status' => 'active',
]);

MemberProfile::create([
    'user_id' => $user->id,

    'employee_id' => '005',
    'first_name' => 'John Vincent',
    'middle_name' => 'Almogera',
    'last_name' => 'Saberdo',

    'date_of_birth' => '2000-02-18',
    'sex' => 'male',
    'civil_status' => 'single',
    'spouse_name' => null,

    'mobile_number' => '09191234567',
    'present_address' => 'Barangay Canlubang, Calamba City, Laguna',
    'permanent_address' => 'Barangay Canlubang, Calamba City, Laguna',

    'position' => 'Operations Staff',
    'basic_salary' => 26000.00,

    'share_capital_balance' => 17000.00,
    'bank_account_number' => '1000000005',
    'tin_number' => '333-444-555',
]);

        // Call other seeders
        $this->call(LoanTypeSeeder::class);
       $this->call(LoanSeeder::class); 
    }
}