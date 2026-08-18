<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('loan_amortizations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('loan_id')->constrained()->cascadeOnDelete();
            $table->integer('installment_number');
            $table->date('due_date');
            $table->decimal('amount_due', 10, 2);
            $table->decimal('principal_amount', 12, 2)->nullable();
            $table->decimal('interest_amount', 12, 2)->nullable();
            $table->decimal('beginning_balance', 12, 2)->nullable();
            $table->decimal('ending_balance', 12, 2)->nullable();
            $table->decimal('amount_paid', 10, 2)->default(0);
            $table->enum('status', ['pending', 'paid', 'partial', 'overdue', 'missed', 'deferred', 'manual_payment'])->default('pending');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('loan_amortizations');
    }
};
