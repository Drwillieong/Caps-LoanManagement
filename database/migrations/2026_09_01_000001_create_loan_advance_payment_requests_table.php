<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('loan_advance_payment_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('loan_id')->constrained()->cascadeOnDelete();
            $table->foreignId('requested_by')->constrained('users')->cascadeOnDelete();
            $table->foreignId('reviewed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('verified_by')->nullable()->constrained('users')->nullOnDelete();
            $table->decimal('outstanding_balance', 12, 2);
            $table->decimal('regular_deduction_amount', 12, 2);
            $table->decimal('requested_amount', 12, 2);
            $table->unsignedInteger('installments_covered');
            $table->string('payment_method');
            $table->date('expected_payment_date')->nullable();
            $table->date('payment_date')->nullable();
            $table->string('reference_number')->nullable();
            $table->string('payment_proof_path')->nullable();
            $table->text('remarks')->nullable();
            $table->enum('status', [
                'pending_validation',
                'approved',
                'rejected',
                'awaiting_payment',
                'scheduled_for_salary_deduction',
                'payment_submitted',
                'payment_verified',
                'payment_applied',
                'completed',
                'cancelled',
                'expired',
            ])->default('pending_validation');
            $table->text('rejection_reason')->nullable();
            $table->json('calculation_snapshot')->nullable();
            $table->timestamp('approved_at')->nullable();
            $table->timestamp('rejected_at')->nullable();
            $table->timestamp('payment_submitted_at')->nullable();
            $table->timestamp('verified_at')->nullable();
            $table->timestamp('applied_at')->nullable();
            $table->timestamps();

            $table->index(['loan_id', 'status']);
            $table->index(['status', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('loan_advance_payment_requests');
    }
};
