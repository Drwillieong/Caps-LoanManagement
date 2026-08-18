<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('loan_payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('loan_id')->constrained();
            $table->foreignId('loan_amortization_id')->nullable()->constrained('loan_amortizations')->nullOnDelete();
            $table->foreignId('payroll_upload_id')->nullable()->constrained('payroll_uploads')->nullOnDelete();
            $table->decimal('amount', 10, 2);
            $table->string('payment_method')->default('salary_deduction');
            $table->date('payment_date');
            $table->string('reference_number')->nullable();
            $table->string('paid_by');
            $table->foreignId('processed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->text('remarks')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('loan_payments');
    }
};
