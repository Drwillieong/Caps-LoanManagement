<?php

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('member_profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            
            // Identity (Form Page 2)
            $table->string('employee_id')->unique(); // Vital for payroll tracking
            $table->string('first_name');
            $table->string('middle_name')->nullable();
            $table->string('last_name');
            $table->date('date_of_birth');
            $table->enum('sex', ['male', 'female']);
            $table->enum('civil_status', ['single', 'married', 'widowed', 'separated']);
            $table->string('spouse_name')->nullable();
            
            // Contact & Address
            $table->string('mobile_number');
            $table->text('present_address');
            $table->text('permanent_address')->nullable();
            
            // Eligibility Data (Crucial for your Analysis Feature)
            $table->string('position');
            $table->date('date_hired'); // Used to calc Tenure
            $table->decimal('basic_salary', 10, 2); // Used to calc Net Pay Capacity
            
            // Financials
            $table->decimal('share_capital_balance', 12, 2)->default(0); // Updates via contribution
            $table->string('bank_account_number')->nullable(); // RCBC Account for transfers
            $table->string('tin_number')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('member_profiles');
    }
};
