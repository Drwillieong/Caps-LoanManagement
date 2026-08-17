<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $driver = Schema::getConnection()->getDriverName();

        if ($driver === 'mysql') {
            // 1. beneficiaries
            Schema::table('beneficiaries', function (Blueprint $table) {
                $table->dropForeign(['member_profile_id']);
            });

            DB::statement('ALTER TABLE beneficiaries ADD COLUMN temp_members_id VARCHAR(255) NULL AFTER member_profile_id');
            DB::statement('UPDATE beneficiaries b INNER JOIN member_profiles mp ON b.member_profile_id = mp.id SET b.temp_members_id = mp.members_id');

            Schema::table('beneficiaries', function (Blueprint $table) {
                $table->dropColumn('member_profile_id');
            });

            DB::statement('ALTER TABLE beneficiaries CHANGE temp_members_id member_profile_id VARCHAR(255) NULL');

            Schema::table('beneficiaries', function (Blueprint $table) {
                $table->foreign('member_profile_id', 'beneficiaries_member_profile_id_foreign')
                    ->references('members_id')->on('member_profiles')
                    ->cascadeOnDelete();
            });

            // 2. deduction_records
            Schema::table('deduction_records', function (Blueprint $table) {
                $table->dropForeign(['member_profile_id']);
            });

            DB::statement('ALTER TABLE deduction_records ADD COLUMN temp_members_id VARCHAR(255) NULL AFTER member_profile_id');
            DB::statement('UPDATE deduction_records dr INNER JOIN member_profiles mp ON dr.member_profile_id = mp.id SET dr.temp_members_id = mp.members_id WHERE dr.member_profile_id IS NOT NULL');

            Schema::table('deduction_records', function (Blueprint $table) {
                $table->dropColumn('member_profile_id');
            });

            DB::statement('ALTER TABLE deduction_records CHANGE temp_members_id member_profile_id VARCHAR(255) NULL');

            Schema::table('deduction_records', function (Blueprint $table) {
                $table->foreign('member_profile_id', 'deduction_records_member_profile_id_foreign')
                    ->references('members_id')->on('member_profiles')
                    ->nullOnDelete();
            });

            // 3. payroll_upload_rows
            Schema::table('payroll_upload_rows', function (Blueprint $table) {
                $table->dropForeign(['matched_member_profile_id']);
            });

            DB::statement('ALTER TABLE payroll_upload_rows ADD COLUMN temp_members_id VARCHAR(255) NULL AFTER matched_member_profile_id');
            DB::statement('UPDATE payroll_upload_rows pur INNER JOIN member_profiles mp ON pur.matched_member_profile_id = mp.id SET pur.temp_members_id = mp.members_id WHERE pur.matched_member_profile_id IS NOT NULL');

            Schema::table('payroll_upload_rows', function (Blueprint $table) {
                $table->dropColumn('matched_member_profile_id');
            });

            DB::statement('ALTER TABLE payroll_upload_rows CHANGE temp_members_id matched_member_profile_id VARCHAR(255) NULL');

            Schema::table('payroll_upload_rows', function (Blueprint $table) {
                $table->foreign('matched_member_profile_id', 'payroll_upload_rows_matched_member_profile_id_foreign')
                    ->references('members_id')->on('member_profiles')
                    ->nullOnDelete();
            });

            // 4. member_profiles: drop id PK and column, make members_id PK
            Schema::table('member_profiles', function (Blueprint $table) {
                $table->dropPrimary(['id']);
                $table->dropColumn('id');
            });

            Schema::table('member_profiles', function (Blueprint $table) {
                $table->primary('members_id');
            });
        } elseif ($driver === 'sqlite') {
            DB::statement('PRAGMA foreign_keys = OFF');

            Schema::create('temp_member_profile_mapping', function (Blueprint $table) {
                $table->unsignedBigInteger('old_id');
                $table->string('members_id');
                $table->primary(['old_id', 'members_id']);
            });

            DB::statement('INSERT INTO temp_member_profile_mapping SELECT id, members_id FROM member_profiles');

            // 1. beneficiaries
            Schema::create('beneficiaries_new', function (Blueprint $table) {
                $table->id();
                $table->string('member_profile_id')->nullable();
                $table->string('full_name');
                $table->string('relationship');
                $table->date('date_of_birth')->nullable();
                $table->timestamps();
            });

            DB::statement('INSERT INTO beneficiaries_new (id, member_profile_id, full_name, relationship, date_of_birth, created_at, updated_at) SELECT b.id, mp.members_id, b.full_name, b.relationship, b.date_of_birth, b.created_at, b.updated_at FROM beneficiaries b INNER JOIN member_profiles mp ON b.member_profile_id = mp.id');

            Schema::dropIfExists('beneficiaries');
            DB::statement('ALTER TABLE beneficiaries_new RENAME TO beneficiaries');

            // 2. deduction_records
            Schema::create('deduction_records_new', function (Blueprint $table) {
                $table->id();
                $table->foreignId('loan_id')->constrained()->cascadeOnDelete();
                $table->foreignId('loan_amortization_id')->nullable()->constrained('loan_amortizations')->nullOnDelete();
                $table->foreignId('payroll_upload_id')->nullable()->constrained()->nullOnDelete();
                $table->foreignId('payroll_upload_row_id')->nullable()->constrained()->nullOnDelete();
                $table->string('member_profile_id')->nullable();
                $table->foreignId('processed_by')->nullable()->constrained('users')->nullOnDelete();
                $table->date('cutoff_date');
                $table->decimal('expected_amount', 12, 2)->default(0);
                $table->decimal('deducted_amount', 12, 2)->default(0);
                $table->string('status');
                $table->string('payment_method')->default('salary_deduction');
                $table->decimal('balance_after', 12, 2)->nullable();
                $table->string('reference_number')->nullable();
                $table->text('remarks')->nullable();
                $table->timestamp('processed_at')->nullable();
                $table->timestamps();
                $table->index(['cutoff_date', 'status']);
                $table->index(['loan_id', 'loan_amortization_id']);
            });

            DB::statement('INSERT INTO deduction_records_new (id, loan_id, loan_amortization_id, payroll_upload_id, payroll_upload_row_id, member_profile_id, processed_by, cutoff_date, expected_amount, deducted_amount, status, payment_method, balance_after, reference_number, remarks, processed_at, created_at, updated_at) SELECT dr.id, dr.loan_id, dr.loan_amortization_id, dr.payroll_upload_id, dr.payroll_upload_row_id, mp.members_id, dr.processed_by, dr.cutoff_date, dr.expected_amount, dr.deducted_amount, dr.status, dr.payment_method, dr.balance_after, dr.reference_number, dr.remarks, dr.processed_at, dr.created_at, dr.updated_at FROM deduction_records dr LEFT JOIN member_profiles mp ON dr.member_profile_id = mp.id');

            Schema::dropIfExists('deduction_records');
            DB::statement('ALTER TABLE deduction_records_new RENAME TO deduction_records');

            // 3. payroll_upload_rows
            Schema::create('payroll_upload_rows_new', function (Blueprint $table) {
                $table->id();
                $table->foreignId('payroll_upload_id')->constrained()->cascadeOnDelete();
                $table->foreignId('matched_user_id')->nullable()->constrained('users')->nullOnDelete();
                $table->string('matched_member_profile_id')->nullable();
                $table->unsignedInteger('row_number');
                $table->string('members_id')->nullable();
                $table->string('payroll_id')->nullable();
                $table->string('member_id')->nullable();
                $table->string('employee_name')->nullable();
                $table->date('cutoff_date')->nullable();
                $table->decimal('deduction_amount', 12, 2)->default(0);
                $table->decimal('applied_amount', 12, 2)->default(0);
                $table->decimal('unapplied_amount', 12, 2)->default(0);
                $table->string('status')->default('pending');
                $table->string('deduction_status')->nullable();
                $table->json('errors')->nullable();
                $table->json('raw_payload')->nullable();
                $table->text('remarks')->nullable();
                $table->timestamp('processed_at')->nullable();
                $table->timestamps();
                $table->index(['members_id', 'payroll_id', 'member_id']);
                $table->index(['status', 'deduction_status']);
            });

            DB::statement('INSERT INTO payroll_upload_rows_new (id, payroll_upload_id, matched_user_id, matched_member_profile_id, row_number, members_id, payroll_id, member_id, employee_name, cutoff_date, deduction_amount, applied_amount, unapplied_amount, status, deduction_status, errors, raw_payload, remarks, processed_at, created_at, updated_at) SELECT pur.id, pur.payroll_upload_id, pur.matched_user_id, mp.members_id, pur.row_number, pur.members_id, pur.payroll_id, pur.member_id, pur.employee_name, pur.cutoff_date, pur.deduction_amount, pur.applied_amount, pur.unapplied_amount, pur.status, pur.deduction_status, pur.errors, pur.raw_payload, pur.remarks, pur.processed_at, pur.created_at, pur.updated_at FROM payroll_upload_rows pur LEFT JOIN member_profiles mp ON pur.matched_member_profile_id = mp.id');

            Schema::dropIfExists('payroll_upload_rows');
            DB::statement('ALTER TABLE payroll_upload_rows_new RENAME TO payroll_upload_rows');

            // 4. member_profiles
            Schema::create('member_profiles_new', function (Blueprint $table) {
                $table->string('members_id')->primary();
                $table->foreignId('user_id')->constrained()->cascadeOnDelete();
                $table->string('first_name');
                $table->string('middle_name')->nullable();
                $table->string('last_name');
                $table->date('date_of_birth');
                $table->string('sex');
                $table->string('civil_status');
                $table->string('spouse_name')->nullable();
                $table->string('mobile_number');
                $table->text('present_address');
                $table->text('permanent_address')->nullable();
                $table->string('position');
                $table->date('date_hired');
                $table->decimal('basic_salary', 10, 2);
                $table->decimal('share_capital_balance', 12, 2)->default(0);
                $table->string('bank_account_number')->nullable();
                $table->string('tin_number')->nullable();
                $table->string('payroll_id')->nullable()->unique();
                $table->string('profile_picture')->nullable();
                $table->string('place_of_birth')->nullable();
                $table->string('educational_attainment')->nullable();
                $table->string('permanent_zip_code', 20)->nullable();
                $table->string('permanent_mobile_number', 20)->nullable();
                $table->string('present_zip_code', 20)->nullable();
                $table->string('income_type')->default('monthly');
                $table->decimal('net_income', 10, 2)->nullable();
                $table->string('other_source_of_income')->nullable();
                $table->string('facebook_account_name')->nullable();
                $table->string('spouse_occupation')->nullable();
                $table->decimal('spouse_gross_income', 10, 2)->nullable();
                $table->string('spouse_income_type')->default('monthly');
                $table->decimal('spouse_net_income', 10, 2)->nullable();
                $table->string('legal_beneficiary_1_name')->nullable();
                $table->text('real_properties_owned')->nullable();
                $table->timestamps();
            });

            DB::statement('INSERT INTO member_profiles_new (members_id, user_id, first_name, middle_name, last_name, date_of_birth, sex, civil_status, spouse_name, mobile_number, present_address, permanent_address, position, date_hired, basic_salary, share_capital_balance, bank_account_number, tin_number, payroll_id, profile_picture, place_of_birth, educational_attainment, permanent_zip_code, permanent_mobile_number, present_zip_code, income_type, net_income, other_source_of_income, facebook_account_name, spouse_occupation, spouse_gross_income, spouse_income_type, spouse_net_income, legal_beneficiary_1_name, real_properties_owned, created_at, updated_at) SELECT members_id, user_id, first_name, middle_name, last_name, date_of_birth, sex, civil_status, spouse_name, mobile_number, present_address, permanent_address, position, date_hired, basic_salary, share_capital_balance, bank_account_number, tin_number, payroll_id, profile_picture, place_of_birth, educational_attainment, permanent_zip_code, permanent_mobile_number, present_zip_code, income_type, net_income, other_source_of_income, facebook_account_name, spouse_occupation, spouse_gross_income, spouse_income_type, spouse_net_income, legal_beneficiary_1_name, real_properties_owned, created_at, updated_at FROM member_profiles');

            Schema::dropIfExists('member_profiles');
            DB::statement('ALTER TABLE member_profiles_new RENAME TO member_profiles');

            // Recreate foreign keys
            Schema::table('beneficiaries', function (Blueprint $table) {
                $table->foreign('member_profile_id', 'beneficiaries_member_profile_id_foreign')
                    ->references('members_id')->on('member_profiles')
                    ->cascadeOnDelete();
            });

            Schema::table('deduction_records', function (Blueprint $table) {
                $table->foreign('member_profile_id', 'deduction_records_member_profile_id_foreign')
                    ->references('members_id')->on('member_profiles')
                    ->nullOnDelete();
            });

            Schema::table('payroll_upload_rows', function (Blueprint $table) {
                $table->foreign('matched_member_profile_id', 'payroll_upload_rows_matched_member_profile_id_foreign')
                    ->references('members_id')->on('member_profiles')
                    ->nullOnDelete();
            });

            DB::statement('DROP TABLE temp_member_profile_mapping');
            DB::statement('PRAGMA foreign_keys = ON');
        } else {
            throw new \RuntimeException('This migration only supports MySQL and SQLite.');
        }
    }

    public function down(): void
    {
        throw new \RuntimeException('This migration is not reversible. To revert, manually restore the original schema from a backup.');
    }
};
