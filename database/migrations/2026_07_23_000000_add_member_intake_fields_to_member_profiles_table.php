<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('member_profiles', function (Blueprint $table) {
            if (! Schema::hasColumn('member_profiles', 'place_of_birth')) {
                $table->string('place_of_birth')->nullable();
            }

            if (! Schema::hasColumn('member_profiles', 'educational_attainment')) {
                $table->string('educational_attainment')->nullable();
            }

            if (! Schema::hasColumn('member_profiles', 'permanent_zip_code')) {
                $table->string('permanent_zip_code', 20)->nullable();
            }

            if (! Schema::hasColumn('member_profiles', 'permanent_mobile_number')) {
                $table->string('permanent_mobile_number', 20)->nullable();
            }

            if (! Schema::hasColumn('member_profiles', 'present_zip_code')) {
                $table->string('present_zip_code', 20)->nullable();
            }

            if (! Schema::hasColumn('member_profiles', 'income_type')) {
                $table->enum('income_type', ['monthly', 'daily', 'yearly'])->default('monthly');
            }

            if (! Schema::hasColumn('member_profiles', 'net_income')) {
                $table->decimal('net_income', 10, 2)->nullable();
            }

            if (! Schema::hasColumn('member_profiles', 'other_source_of_income')) {
                $table->string('other_source_of_income')->nullable();
            }

            if (! Schema::hasColumn('member_profiles', 'facebook_account_name')) {
                $table->string('facebook_account_name')->nullable();
            }

            if (! Schema::hasColumn('member_profiles', 'spouse_occupation')) {
                $table->string('spouse_occupation')->nullable();
            }

            if (! Schema::hasColumn('member_profiles', 'spouse_gross_income')) {
                $table->decimal('spouse_gross_income', 10, 2)->nullable();
            }

            if (! Schema::hasColumn('member_profiles', 'spouse_income_type')) {
                $table->enum('spouse_income_type', ['monthly', 'daily', 'yearly'])->default('monthly');
            }

            if (! Schema::hasColumn('member_profiles', 'spouse_net_income')) {
                $table->decimal('spouse_net_income', 10, 2)->nullable();
            }

            if (! Schema::hasColumn('member_profiles', 'legal_beneficiary_1_name')) {
                $table->string('legal_beneficiary_1_name')->nullable();
            }

            if (! Schema::hasColumn('member_profiles', 'real_properties_owned')) {
                $table->text('real_properties_owned')->nullable();
            }
        });
    }

    public function down(): void
    {
        $columns = [
            'place_of_birth',
            'educational_attainment',
            'permanent_zip_code',
            'permanent_mobile_number',
            'present_zip_code',
            'income_type',
            'net_income',
            'other_source_of_income',
            'facebook_account_name',
            'spouse_occupation',
            'spouse_gross_income',
            'spouse_income_type',
            'spouse_net_income',
            'legal_beneficiary_1_name',
            'real_properties_owned',
        ];

        $existingColumns = array_values(array_filter(
            $columns,
            fn (string $column) => Schema::hasColumn('member_profiles', $column),
        ));

        if ($existingColumns !== []) {
            Schema::table('member_profiles', function (Blueprint $table) use ($existingColumns) {
                $table->dropColumn($existingColumns);
            });
        }
    }
};
