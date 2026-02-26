<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
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

        // Test Member
        User::create([
            'first_name' => 'Test',
            'middle_name' => 'User',
            'last_name' => 'User',
            'email' => 'test@example.com',
            'password' => Hash::make('password'),
            'role' => 'member',
            'is_active' => true,
        ]);
    }
}