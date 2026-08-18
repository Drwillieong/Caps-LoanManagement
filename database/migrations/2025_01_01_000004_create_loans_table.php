<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('loans', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained();
            $table->foreignId('loan_type_id')->constrained();
            $table->decimal('principal_amount', 12, 2);
            $table->integer('terms_months');
            $table->decimal('interest_amount', 12, 2);
            $table->decimal('total_amount_due', 12, 2);
            $table->decimal('monthly_amortization', 12, 2);
            $table->string('voucher_number')->nullable()->unique();
            $table->string('check_number')->nullable();
            $table->string('disbursement_method')->nullable();
            $table->date('release_date')->nullable();
            $table->enum('status', [
                'draft',
                'awaiting_comaker',
                'pending_gm_review',
                'endorsed_by_gm',
                'pending_cc_review',
                'approved',
                'released',
                'rejected_by_co_maker',
                'rejected_by_gm',
                'rejected_by_credit_com',
                'paid_off',
            ])->default('draft');
            $table->text('remarks')->nullable();
            $table->text('co_maker_rejection_reason')->nullable();
            $table->enum('rejected_by', ['gm', 'credit_com', 'co_maker'])->nullable();
            $table->timestamp('rejected_at')->nullable();
            $table->timestamp('notifications_read_at')->nullable();
            $table->boolean('has_edited')->default(false);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('loans');
    }
};
