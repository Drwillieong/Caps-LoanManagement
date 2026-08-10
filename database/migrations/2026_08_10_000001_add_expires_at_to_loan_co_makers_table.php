<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('loan_co_makers', function (Blueprint $table) {
            // Absolute deadline for the co-maker to respond.
            // Populated as created_at + 48h when the request is created.
            $table->timestamp('expires_at')->nullable()->after('responded_at');
        });
    }

    public function down(): void
    {
        Schema::table('loan_co_makers', function (Blueprint $table) {
            $table->dropColumn('expires_at');
        });
    }
};
