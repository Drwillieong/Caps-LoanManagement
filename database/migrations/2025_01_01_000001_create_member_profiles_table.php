<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('member_profiles', function (Blueprint $table) {
            $table->string('members_id')->primary();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('payroll_id')->nullable()->unique();

            $table->string('first_name');
            $table->string('middle_name')->nullable();
            $table->string('last_name');
            $table->string('place_of_birth')->nullable();
            $table->date('date_of_birth');
            $table->enum('sex', ['male', 'female']);
            $table->enum('civil_status', ['single', 'married', 'widowed', 'separated']);
            $table->string('educational_attainment')->nullable();
            $table->string('spouse_name')->nullable();

            $table->string('mobile_number');
            $table->string('permanent_mobile_number', 20)->nullable();
            $table->text('present_address');
            $table->string('present_zip_code', 20)->nullable();
            $table->text('permanent_address')->nullable();
            $table->string('permanent_zip_code', 20)->nullable();

            $table->string('position');
            $table->decimal('basic_salary', 10, 2);
            $table->enum('income_type', ['monthly', 'daily', 'yearly'])->default('monthly');
            $table->decimal('net_income', 10, 2)->nullable();
            $table->decimal('share_capital_balance', 12, 2)->default(0);
            $table->string('other_source_of_income')->nullable();
            $table->string('facebook_account_name')->nullable();

            $table->string('spouse_occupation')->nullable();
            $table->decimal('spouse_gross_income', 10, 2)->nullable();
            $table->enum('spouse_income_type', ['monthly', 'daily', 'yearly'])->default('monthly');
            $table->decimal('spouse_net_income', 10, 2)->nullable();
            $table->string('legal_beneficiary_1_name')->nullable();
            $table->text('real_properties_owned')->nullable();

            $table->string('bank_account_number')->nullable();
            $table->string('tin_number')->nullable();
            $table->string('profile_picture')->nullable();
            $table->string('account_status')->default('active');

            $table->timestamps();

            $table->index('user_id');
            $table->index('account_status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('member_profiles');
    }
};
