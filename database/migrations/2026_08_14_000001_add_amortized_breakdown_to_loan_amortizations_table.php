<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('loan_amortizations', function (Blueprint $table) {
            $table->decimal('principal_amount', 12, 2)->nullable()->after('amount_due');
            $table->decimal('interest_amount', 12, 2)->nullable()->after('principal_amount');
            $table->decimal('beginning_balance', 12, 2)->nullable()->after('interest_amount');
            $table->decimal('ending_balance', 12, 2)->nullable()->after('beginning_balance');
        });
    }

    public function down(): void
    {
        Schema::table('loan_amortizations', function (Blueprint $table) {
            $table->dropColumn([
                'principal_amount',
                'interest_amount',
                'beginning_balance',
                'ending_balance',
            ]);
        });
    }
};
