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
            
            $table->decimal('amount', 10, 2);
            $table->date('payment_date');
            $table->string('reference_number')->nullable(); // OR No. or Payroll Ref
            $table->string('paid_by'); // Usually the member, but maybe a representative
            
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('loan_payments');
    }
};

