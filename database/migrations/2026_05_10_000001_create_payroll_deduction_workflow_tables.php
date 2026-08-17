<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('member_profiles', function (Blueprint $table) {
            if (! Schema::hasColumn('member_profiles', 'payroll_id')) {
                $table->string('payroll_id')->nullable()->unique()->after('members_id');
            }
        });

        if (Schema::getConnection()->getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE loan_amortizations MODIFY status ENUM('pending', 'paid', 'partial', 'overdue', 'missed', 'deferred', 'manual_payment') DEFAULT 'pending'");
        }

        Schema::create('system_settings', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique();
            $table->json('value')->nullable();
            $table->text('description')->nullable();
            $table->timestamps();
        });

        Schema::create('payroll_uploads', function (Blueprint $table) {
            $table->id();
            $table->foreignId('uploaded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('original_file_name');
            $table->string('stored_file_name')->nullable();
            $table->string('file_hash', 128);
            $table->date('cutoff_date');
            $table->enum('status', ['processing', 'processed', 'failed'])->default('processing');
            $table->unsignedInteger('total_rows')->default(0);
            $table->unsignedInteger('processed_rows')->default(0);
            $table->unsignedInteger('failed_rows')->default(0);
            $table->unsignedInteger('duplicate_rows')->default(0);
            $table->unsignedInteger('paid_count')->default(0);
            $table->unsignedInteger('partial_count')->default(0);
            $table->unsignedInteger('missed_count')->default(0);
            $table->unsignedInteger('deferred_count')->default(0);
            $table->decimal('total_expected_amount', 12, 2)->default(0);
            $table->decimal('total_deducted_amount', 12, 2)->default(0);
            $table->text('remarks')->nullable();
            $table->text('error_message')->nullable();
            $table->timestamp('started_at')->nullable();
            $table->timestamp('finished_at')->nullable();
            $table->timestamps();

            $table->unique(['file_hash', 'cutoff_date']);
            $table->index(['cutoff_date', 'status']);
        });

        Schema::create('payroll_upload_rows', function (Blueprint $table) {
            $table->id();
            $table->foreignId('payroll_upload_id')->constrained()->cascadeOnDelete();
            $table->foreignId('matched_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('matched_member_profile_id')->nullable()->constrained('member_profiles')->nullOnDelete();
            $table->unsignedInteger('row_number');
            $table->string('members_id')->nullable();
            $table->string('payroll_id')->nullable();
            $table->string('member_id')->nullable();
            $table->string('employee_name')->nullable();
            $table->date('cutoff_date')->nullable();
            $table->decimal('deduction_amount', 12, 2)->default(0);
            $table->decimal('applied_amount', 12, 2)->default(0);
            $table->decimal('unapplied_amount', 12, 2)->default(0);
            $table->enum('status', ['pending', 'processed', 'failed', 'skipped', 'duplicate'])->default('pending');
            $table->enum('deduction_status', ['pending', 'paid', 'partial', 'missed', 'deferred', 'manual_payment'])->nullable();
            $table->json('errors')->nullable();
            $table->json('raw_payload')->nullable();
            $table->text('remarks')->nullable();
            $table->timestamp('processed_at')->nullable();
            $table->timestamps();

            $table->index(['members_id', 'payroll_id', 'member_id']);
            $table->index(['status', 'deduction_status']);
        });

        $isSqlite = Schema::getConnection()->getDriverName() === 'sqlite';

        Schema::table('loan_payments', function (Blueprint $table) use ($isSqlite) {
            if (! Schema::hasColumn('loan_payments', 'loan_amortization_id')) {
                $isSqlite
                    ? $table->unsignedBigInteger('loan_amortization_id')->nullable()
                    : $table->foreignId('loan_amortization_id')->nullable()->after('loan_id')->constrained('loan_amortizations')->nullOnDelete();
            }

            if (! Schema::hasColumn('loan_payments', 'payroll_upload_id')) {
                $isSqlite
                    ? $table->unsignedBigInteger('payroll_upload_id')->nullable()
                    : $table->foreignId('payroll_upload_id')->nullable()->after('loan_amortization_id')->constrained('payroll_uploads')->nullOnDelete();
            }

            if (! Schema::hasColumn('loan_payments', 'payment_method')) {
                $table->string('payment_method')->default('salary_deduction')->after('amount');
            }

            if (! Schema::hasColumn('loan_payments', 'processed_by')) {
                $isSqlite
                    ? $table->unsignedBigInteger('processed_by')->nullable()
                    : $table->foreignId('processed_by')->nullable()->after('paid_by')->constrained('users')->nullOnDelete();
            }

            if (! Schema::hasColumn('loan_payments', 'remarks')) {
                $table->text('remarks')->nullable()->after('processed_by');
            }
        });

        Schema::create('deduction_records', function (Blueprint $table) {
            $table->id();
            $table->foreignId('loan_id')->constrained()->cascadeOnDelete();
            $table->foreignId('loan_amortization_id')->nullable()->constrained('loan_amortizations')->nullOnDelete();
            $table->foreignId('payroll_upload_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('payroll_upload_row_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('member_profile_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('processed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->date('cutoff_date');
            $table->decimal('expected_amount', 12, 2)->default(0);
            $table->decimal('deducted_amount', 12, 2)->default(0);
            $table->enum('status', ['pending', 'paid', 'partial', 'missed', 'deferred', 'manual_payment']);
            $table->string('payment_method')->default('salary_deduction');
            $table->decimal('balance_after', 12, 2)->nullable();
            $table->string('reference_number')->nullable();
            $table->text('remarks')->nullable();
            $table->timestamp('processed_at')->nullable();
            $table->timestamps();

            $table->index(['cutoff_date', 'status']);
            $table->index(['loan_id', 'loan_amortization_id']);
        });

        Schema::create('loan_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('loan_id')->constrained()->cascadeOnDelete();
            $table->foreignId('loan_amortization_id')->nullable()->constrained('loan_amortizations')->nullOnDelete();
            $table->foreignId('payroll_upload_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('payroll_upload_row_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('processed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('transaction_type');
            $table->decimal('amount', 12, 2)->default(0);
            $table->date('transaction_date');
            $table->decimal('balance_after', 12, 2);
            $table->string('reference_number')->nullable();
            $table->text('remarks')->nullable();
            $table->json('meta')->nullable();
            $table->timestamps();

            $table->index(['loan_id', 'transaction_date']);
            $table->index(['transaction_type', 'transaction_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('loan_transactions');
        Schema::dropIfExists('deduction_records');

        $isSqlite = Schema::getConnection()->getDriverName() === 'sqlite';

        Schema::table('loan_payments', function (Blueprint $table) use ($isSqlite) {
            $columns = ['loan_amortization_id', 'payroll_upload_id', 'payment_method', 'processed_by', 'remarks'];

            if (Schema::hasColumn('loan_payments', 'loan_amortization_id')) {
                $isSqlite ? $table->dropColumn('loan_amortization_id') : $table->dropConstrainedForeignId('loan_amortization_id');
            }

            if (Schema::hasColumn('loan_payments', 'payroll_upload_id')) {
                $isSqlite ? $table->dropColumn('payroll_upload_id') : $table->dropConstrainedForeignId('payroll_upload_id');
            }

            if (Schema::hasColumn('loan_payments', 'processed_by')) {
                $isSqlite ? $table->dropColumn('processed_by') : $table->dropConstrainedForeignId('processed_by');
            }

            foreach (array_diff($columns, ['loan_amortization_id', 'payroll_upload_id', 'processed_by']) as $column) {
                if (Schema::hasColumn('loan_payments', $column)) {
                    $table->dropColumn($column);
                }
            }
        });

        Schema::dropIfExists('payroll_upload_rows');
        Schema::dropIfExists('payroll_uploads');
        Schema::dropIfExists('system_settings');

        DB::table('loan_amortizations')
            ->whereIn('status', ['missed', 'deferred', 'manual_payment'])
            ->update(['status' => 'overdue']);

        if (Schema::getConnection()->getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE loan_amortizations MODIFY status ENUM('pending', 'paid', 'partial', 'overdue') DEFAULT 'pending'");
        }

        Schema::table('member_profiles', function (Blueprint $table) {
            if (Schema::hasColumn('member_profiles', 'payroll_id')) {
                $table->dropColumn('payroll_id');
            }
        });
    }
};
