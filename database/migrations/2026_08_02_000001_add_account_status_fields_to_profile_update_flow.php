<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('member_profiles', function (Blueprint $table) {
            if (! Schema::hasColumn('member_profiles', 'account_status')) {
                $table->string('account_status')->default('active')->after('profile_picture');
            }
        });

        Schema::table('profile_update_requests', function (Blueprint $table) {
            if (! Schema::hasColumn('profile_update_requests', 'request_type')) {
                $table->string('request_type')->default('profile_update')->after('member_id');
            }

            if (! Schema::hasColumn('profile_update_requests', 'proposed_status')) {
                $table->string('proposed_status')->nullable()->after('request_type');
            }

            if (! Schema::hasColumn('profile_update_requests', 'reason')) {
                $table->text('reason')->nullable()->after('proposed_status');
            }
        });
    }

    public function down(): void
    {
        Schema::table('profile_update_requests', function (Blueprint $table) {
            foreach (['reason', 'proposed_status', 'request_type'] as $column) {
                if (Schema::hasColumn('profile_update_requests', $column)) {
                    $table->dropColumn($column);
                }
            }
        });

        Schema::table('member_profiles', function (Blueprint $table) {
            if (Schema::hasColumn('member_profiles', 'account_status')) {
                $table->dropColumn('account_status');
            }
        });
    }
};
