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
            
            $table->integer('installment_number'); // 1, 2, 3...
            $table->date('due_date'); // The 10th or 25th
            $table->decimal('amount_due', 10, 2);
            
            // Tracking
            $table->decimal('amount_paid', 10, 2)->default(0);
            $table->enum('status', ['pending', 'paid', 'partial', 'overdue'])->default('pending');
            
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('loan_amortizations');
    }
};

