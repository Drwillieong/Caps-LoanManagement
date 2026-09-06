<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('loan_types', function (Blueprint $table) {
            $table->id();
            $table->string('name'); // e.g., "Cash Loan", "Rice Loan"
            $table->decimal('interest_rate_per_annum', 5, 2); // e.g., 12.00
            $table->integer('max_term_months'); // e.g., 24
            $table->boolean('requires_comaker')->default(false);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('loan_types');
    }
};
