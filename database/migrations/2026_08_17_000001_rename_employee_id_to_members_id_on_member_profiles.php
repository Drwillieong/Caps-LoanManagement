<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('member_profiles') || ! Schema::hasColumn('member_profiles', 'employee_id')) {
            return;
        }

        $this->dropMemberProfileForeignKeys();

        Schema::table('member_profiles', function (Blueprint $table) {
            if (Schema::hasColumn('member_profiles', 'employee_id')) {
                $table->renameColumn('employee_id', 'members_id');
            }
        });

        Schema::table('payroll_upload_rows', function (Blueprint $table) {
            if (Schema::hasColumn('payroll_upload_rows', 'employee_id')) {
                $table->renameColumn('employee_id', 'members_id');
            }
        });

        $this->recreateMemberProfileForeignKeys('members_id');
    }

    public function down(): void
    {
        if (! Schema::hasTable('member_profiles') || ! Schema::hasColumn('member_profiles', 'members_id')) {
            return;
        }

        $this->dropMemberProfileForeignKeys();

        Schema::table('member_profiles', function (Blueprint $table) {
            if (Schema::hasColumn('member_profiles', 'members_id')) {
                $table->renameColumn('members_id', 'employee_id');
            }
        });

        Schema::table('payroll_upload_rows', function (Blueprint $table) {
            if (Schema::hasColumn('payroll_upload_rows', 'members_id')) {
                $table->renameColumn('members_id', 'employee_id');
            }
        });

        $this->recreateMemberProfileForeignKeys('employee_id');
    }

    private function dropMemberProfileForeignKeys(): void
    {
        foreach ([
            ['beneficiaries', 'beneficiaries_member_profile_id_foreign'],
            ['deduction_records', 'deduction_records_member_profile_id_foreign'],
            ['payroll_upload_rows', 'payroll_upload_rows_matched_member_profile_id_foreign'],
            ['profile_update_requests', 'profile_update_requests_member_id_foreign'],
        ] as [$tableName, $foreignKey]) {
            if (! Schema::hasTable($tableName)) {
                continue;
            }

            try {
                Schema::table($tableName, function (Blueprint $table) use ($foreignKey) {
                    $table->dropForeign($foreignKey);
                });
            } catch (Throwable) {
                // Some local/test databases may not have the expected FK name.
            }
        }
    }

    private function recreateMemberProfileForeignKeys(string $referencedColumn): void
    {
        foreach ([
            ['beneficiaries', 'member_profile_id', 'beneficiaries_member_profile_id_foreign', 'cascade'],
            ['deduction_records', 'member_profile_id', 'deduction_records_member_profile_id_foreign', 'set null'],
            ['payroll_upload_rows', 'matched_member_profile_id', 'payroll_upload_rows_matched_member_profile_id_foreign', 'set null'],
            ['profile_update_requests', 'member_id', 'profile_update_requests_member_id_foreign', 'cascade'],
        ] as [$tableName, $column, $foreignKey, $onDelete]) {
            if (! Schema::hasTable($tableName) || ! Schema::hasColumn($tableName, $column)) {
                continue;
            }

            Schema::table($tableName, function (Blueprint $table) use ($column, $foreignKey, $referencedColumn, $onDelete) {
                $foreign = $table->foreign($column, $foreignKey)
                    ->references($referencedColumn)
                    ->on('member_profiles');

                $onDelete === 'cascade' ? $foreign->cascadeOnDelete() : $foreign->nullOnDelete();
            });
        }
    }
};
