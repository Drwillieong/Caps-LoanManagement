<?php

namespace Database\Seeders;

use App\Models\MemberProfile;
use App\Models\User;
use Illuminate\Database\Seeder;
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

            'members_id' => '001',
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

            'members_id' => '002', // fixed duplicate
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

            'members_id' => '003',
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

            'members_id' => '004',
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
            'basic_salary' => 90000.00,

            'share_capital_balance' => 90000.00,

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

            'members_id' => '005',
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

        ]);

        // -----------------------------
        // Dummy Member 6
        // -----------------------------
        $user = User::create([
            'first_name' => 'Maria',
            'middle_name' => 'Santos',
            'last_name' => 'Reyes',
            'email' => 'maria.reyes06@gmail.com',
            'password' => Hash::make('admin123'),
            'role' => 'member',
            'is_active' => true,
            'status' => 'active',
        ]);

        MemberProfile::create([
            'user_id' => $user->id,
            'members_id' => '006',
            'first_name' => 'Maria',
            'middle_name' => 'Santos',
            'last_name' => 'Reyes',
            'date_of_birth' => '1995-03-14',
            'sex' => 'female',
            'civil_status' => 'married',
            'spouse_name' => 'Juan Reyes',
            'mobile_number' => '09201234567',
            'present_address' => 'Barangay Poblacion, San Pablo City, Laguna',
            'permanent_address' => 'Barangay Poblacion, San Pablo City, Laguna',
            'position' => 'Teacher I',
            'basic_salary' => 32000.00,
            'share_capital_balance' => 25000.00,
        ]);

        // -----------------------------
        // Dummy Member 7
        // -----------------------------
        $user = User::create([
            'first_name' => 'Antonio',
            'middle_name' => 'Mendoza',
            'last_name' => 'Garcia',
            'email' => 'antonio.garcia07@gmail.com',
            'password' => Hash::make('admin123'),
            'role' => 'member',
            'is_active' => true,
            'status' => 'active',
        ]);

        MemberProfile::create([
            'user_id' => $user->id,
            'members_id' => '007',
            'first_name' => 'Antonio',
            'middle_name' => 'Mendoza',
            'last_name' => 'Garcia',
            'date_of_birth' => '1988-11-22',
            'sex' => 'male',
            'civil_status' => 'married',
            'spouse_name' => 'Rosa Garcia',
            'mobile_number' => '09211234567',
            'present_address' => 'Barangay Tayuman, Los Baños, Laguna',
            'permanent_address' => 'Barangay Tayuman, Los Baños, Laguna',
            'position' => 'Administrative Aide',
            'basic_salary' => 18000.00,
            'share_capital_balance' => 12000.00,
        ]);

        // -----------------------------
        // Dummy Member 8
        // -----------------------------
        $user = User::create([
            'first_name' => 'Cristina',
            'middle_name' => 'Villanueva',
            'last_name' => 'Aquino',
            'email' => 'cristina.aquino08@gmail.com',
            'password' => Hash::make('admin123'),
            'role' => 'member',
            'is_active' => true,
            'status' => 'active',
        ]);

        MemberProfile::create([
            'user_id' => $user->id,
            'members_id' => '008',
            'first_name' => 'Cristina',
            'middle_name' => 'Villanueva',
            'last_name' => 'Aquino',
            'date_of_birth' => '1992-07-05',
            'sex' => 'female',
            'civil_status' => 'single',
            'spouse_name' => null,
            'mobile_number' => '09221234567',
            'present_address' => 'Barangay Batong Malake, Los Baños, Laguna',
            'permanent_address' => 'Barangay Batong Malake, Los Baños, Laguna',
            'position' => 'Registrar Staff',
            'basic_salary' => 28000.00,
            'share_capital_balance' => 20000.00,
        ]);

        // -----------------------------
        // Dummy Member 9
        // -----------------------------
        $user = User::create([
            'first_name' => 'Fernando',
            'middle_name' => 'Dela Cruz',
            'last_name' => 'Mercado',
            'email' => 'fernando.mercado09@gmail.com',
            'password' => Hash::make('admin123'),
            'role' => 'member',
            'is_active' => true,
            'status' => 'active',
        ]);

        MemberProfile::create([
            'user_id' => $user->id,
            'members_id' => '009',
            'first_name' => 'Fernando',
            'middle_name' => 'Dela Cruz',
            'last_name' => 'Mercado',
            'date_of_birth' => '1985-01-30',
            'sex' => 'male',
            'civil_status' => 'married',
            'spouse_name' => 'Elena Mercado',
            'mobile_number' => '09231234567',
            'present_address' => 'Barangay Maulawin, Santa Cruz, Laguna',
            'permanent_address' => 'Barangay Maulawin, Santa Cruz, Laguna',
            'position' => 'Accountant',
            'basic_salary' => 45000.00,
            'share_capital_balance' => 35000.00,
        ]);

        // -----------------------------
        // Dummy Member 10
        // -----------------------------
        $user = User::create([
            'first_name' => 'Lourdes',
            'middle_name' => 'Panganiban',
            'last_name' => 'Navarro',
            'email' => 'lourdes.navarro10@gmail.com',
            'password' => Hash::make('admin123'),
            'role' => 'member',
            'is_active' => true,
            'status' => 'active',
        ]);

        MemberProfile::create([
            'user_id' => $user->id,
            'members_id' => '010',
            'first_name' => 'Lourdes',
            'middle_name' => 'Panganiban',
            'last_name' => 'Navarro',
            'date_of_birth' => '1997-09-12',
            'sex' => 'female',
            'civil_status' => 'single',
            'spouse_name' => null,
            'mobile_number' => '09241234567',
            'present_address' => 'Barangay Santo Niño, Bay, Laguna',
            'permanent_address' => 'Barangay Santo Niño, Bay, Laguna',
            'position' => 'Cashier',
            'basic_salary' => 22000.00,
            'share_capital_balance' => 16000.00,
        ]);

        // -----------------------------
        // Dummy Member 11
        // -----------------------------
        $user = User::create([
            'first_name' => 'Rafael',
            'middle_name' => 'Bautista',
            'last_name' => 'Soriano',
            'email' => 'rafael.soriano11@gmail.com',
            'password' => Hash::make('admin123'),
            'role' => 'member',
            'is_active' => true,
            'status' => 'active',
        ]);

        MemberProfile::create([
            'user_id' => $user->id,
            'members_id' => '011',
            'first_name' => 'Rafael',
            'middle_name' => 'Bautista',
            'last_name' => 'Soriano',
            'date_of_birth' => '1990-05-25',
            'sex' => 'male',
            'civil_status' => 'married',
            'spouse_name' => 'Grace Soriano',
            'mobile_number' => '09251234567',
            'present_address' => 'Barangay San Antonio, San Pedro, Laguna',
            'permanent_address' => 'Barangay San Antonio, San Pedro, Laguna',
            'position' => 'Engineering Staff',
            'basic_salary' => 38000.00,
            'share_capital_balance' => 28000.00,
        ]);

        // -----------------------------
        // Dummy Member 12
        // -----------------------------
        $user = User::create([
            'first_name' => 'Elena',
            'middle_name' => 'Ramos',
            'last_name' => 'Vargas',
            'email' => 'elena.vargas12@gmail.com',
            'password' => Hash::make('admin123'),
            'role' => 'member',
            'is_active' => true,
            'status' => 'active',
        ]);

        MemberProfile::create([
            'user_id' => $user->id,
            'members_id' => '012',
            'first_name' => 'Elena',
            'middle_name' => 'Ramos',
            'last_name' => 'Vargas',
            'date_of_birth' => '1993-12-08',
            'sex' => 'female',
            'civil_status' => 'single',
            'spouse_name' => null,
            'mobile_number' => '09261234567',
            'present_address' => 'Barangay Landayan, San Pedro, Laguna',
            'permanent_address' => 'Barangay Landayan, San Pedro, Laguna',
            'position' => 'Medical Representative',
            'basic_salary' => 35000.00,
            'share_capital_balance' => 22000.00,
        ]);

        // -----------------------------
        // Dummy Member 13
        // -----------------------------
        $user = User::create([
            'first_name' => 'Roberto',
            'middle_name' => 'Cruz',
            'last_name' => 'Magbanua',
            'email' => 'roberto.magbanua13@gmail.com',
            'password' => Hash::make('admin123'),
            'role' => 'member',
            'is_active' => true,
            'status' => 'active',
        ]);

        MemberProfile::create([
            'user_id' => $user->id,
            'members_id' => '013',
            'first_name' => 'Roberto',
            'middle_name' => 'Cruz',
            'last_name' => 'Magbanua',
            'date_of_birth' => '1986-04-17',
            'sex' => 'male',
            'civil_status' => 'married',
            'spouse_name' => 'Theresa Magbanua',
            'mobile_number' => '09271234567',
            'present_address' => 'Barangay Mamatid, Cabuyao, Laguna',
            'permanent_address' => 'Barangay Mamatid, Cabuyao, Laguna',
            'position' => 'Production Supervisor',
            'basic_salary' => 40000.00,
            'share_capital_balance' => 30000.00,
        ]);

        // -----------------------------
        // Dummy Member 14
        // -----------------------------
        $user = User::create([
            'first_name' => 'Theresa',
            'middle_name' => 'Alvarez',
            'last_name' => 'Ferrer',
            'email' => 'theresa.ferrer14@gmail.com',
            'password' => Hash::make('admin123'),
            'role' => 'member',
            'is_active' => true,
            'status' => 'active',
        ]);

        MemberProfile::create([
            'user_id' => $user->id,
            'members_id' => '014',
            'first_name' => 'Theresa',
            'middle_name' => 'Alvarez',
            'last_name' => 'Ferrer',
            'date_of_birth' => '1991-08-29',
            'sex' => 'female',
            'civil_status' => 'single',
            'spouse_name' => null,
            'mobile_number' => '09281234567',
            'present_address' => 'Barangay Diezmo, Cabuyao, Laguna',
            'permanent_address' => 'Barangay Diezmo, Cabuyao, Laguna',
            'position' => 'Finance Officer',
            'basic_salary' => 42000.00,
            'share_capital_balance' => 27000.00,
        ]);

        // -----------------------------
        // Dummy Member 15
        // -----------------------------
        $user = User::create([
            'first_name' => 'Jose',
            'middle_name' => 'Tomas',
            'last_name' => 'Rivera',
            'email' => 'jose.rivera15@gmail.com',
            'password' => Hash::make('admin123'),
            'role' => 'member',
            'is_active' => true,
            'status' => 'active',
        ]);

        MemberProfile::create([
            'user_id' => $user->id,
            'members_id' => '015',
            'first_name' => 'Jose',
            'middle_name' => 'Tomas',
            'last_name' => 'Rivera',
            'date_of_birth' => '1983-06-11',
            'sex' => 'male',
            'civil_status' => 'married',
            'spouse_name' => 'Carmen Rivera',
            'mobile_number' => '09291234567',
            'present_address' => 'Barangay Casile, Cabuyao, Laguna',
            'permanent_address' => 'Barangay Casile, Cabuyao, Laguna',
            'position' => 'Department Head',
            'basic_salary' => 55000.00,
            'share_capital_balance' => 40000.00,
        ]);

        // Call other seeders
        $this->call(LoanTypeSeeder::class);
        $this->call(LoanSeeder::class);
    }
}
