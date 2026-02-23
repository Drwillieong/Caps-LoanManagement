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
            $table->foreignId('user_id')->constrained(); // The Borrower
            $table->foreignId('loan_type_id')->constrained();
            
            // Application Details
            $table->decimal('principal_amount', 12, 2);
            $table->integer('terms_months'); // e.g., 12 months
            
            // System Calculated Logic (Snapshots)
            $table->decimal('interest_amount', 12, 2); // Calculated at approval
            $table->decimal('total_amount_due', 12, 2); // Principal + Interest
            $table->decimal('monthly_amortization', 12, 2);
            
            // Voucher Details (For the PDF Generation)
            $table->string('voucher_number')->nullable()->unique(); // "CV-2026-001"
            $table->string('check_number')->nullable();
            $table->date('release_date')->nullable();
            
            // Approval Flow Status
            $table->enum('status', [
                'draft',                  // Initial draft
                'awaiting_comaker',       // Waiting for co-maker confirmation
                'pending_gm_review',      // Pending GM review
                'endorsed_by_gm',         // Endorsed by GM
                'approved',               // Approved by Board/GM
                'released',               // Money given (Active)
                'rejected',               // Failed eligibility
                'paid_off'                // Fully paid
            ])->default('draft');

            $table->text('remarks')->nullable(); // For rejection reasons
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('loans');
    }
};

