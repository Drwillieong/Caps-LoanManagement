<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
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

        // Test Member
        User::create([
            'first_name' => 'Jairus',
            'middle_name' => 'Sotto',
            'last_name' => 'Pecho',
            'email' => 'jairuspecho19@gmail.com',
            'password' => Hash::make('password'),
            'role' => 'member',
            'is_active' => true,
        ]);

          User::create([
            'first_name' => 'Kevin',
            'middle_name' => 'Corpuz',
            'last_name' => '',
            'email' => 'kevincorpuz321@gmail.com',
            'password' => Hash::make('password'),
            'role' => 'member',
            'is_active' => true,
        ]);

        $this->call(LoanTypeSeeder::class);
    }
}