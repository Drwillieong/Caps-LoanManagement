<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $driver = Schema::getConnection()->getDriverName();

        if ($driver === 'mysql') {
            DB::statement("ALTER TABLE `loans` MODIFY `rejected_by` ENUM('gm', 'credit_com', 'co_maker') NULL");
            return;
        }

        if ($driver === 'pgsql') {
            $constraint = DB::selectOne(
                "SELECT conname FROM pg_constraint WHERE conrelid = 'loans'::regclass AND conname LIKE '%rejected_by%'"
            );
            if ($constraint) {
                DB::statement('ALTER TABLE loans DROP CONSTRAINT ' . $constraint->conname);
            }
            DB::statement("ALTER TABLE loans ADD CONSTRAINT loans_rejected_by_check CHECK (rejected_by IN ('gm', 'credit_com', 'co_maker'))");
            return;
        }

        Schema::disableForeignKeyConstraints();

        DB::statement('CREATE TABLE loans_backup AS SELECT * FROM loans');

        DB::statement('DROP TABLE loans');

        DB::statement('CREATE TABLE loans (
            "id" integer primary key autoincrement not null,
            "user_id" integer not null,
            "loan_type_id" integer not null,
            "principal_amount" numeric not null,
            "terms_months" integer not null,
            "interest_amount" numeric not null,
            "total_amount_due" numeric not null,
            "monthly_amortization" numeric not null,
            "voucher_number" varchar,
            "check_number" varchar,
            "release_date" date,
            "status" varchar check ("status" in (\'draft\', \'awaiting_comaker\', \'pending_gm_review\', \'endorsed_by_gm\', \'pending_cc_review\', \'approved\', \'released\', \'rejected_by_co_maker\', \'rejected_by_gm\', \'rejected_by_credit_com\', \'paid_off\')) not null default \'draft\',
            "remarks" text,
            "created_at" datetime,
            "updated_at" datetime,
            "rejected_by" varchar check ("rejected_by" in (\'gm\', \'credit_com\', \'co_maker\')),
            "rejected_at" datetime,
            "notifications_read_at" datetime,
            "has_edited" tinyint(1) not null default \'0\',
            foreign key("user_id") references "users"("id"),
            foreign key("loan_type_id") references "loan_types"("id")
        )');

        DB::statement('INSERT INTO loans SELECT * FROM loans_backup');

        DB::statement('DROP TABLE loans_backup');

        Schema::enableForeignKeyConstraints();
    }

    public function down(): void
    {
        DB::table('loans')->where('rejected_by', 'co_maker')->update(['rejected_by' => null]);

        $driver = Schema::getConnection()->getDriverName();

        if ($driver === 'mysql') {
            DB::statement("ALTER TABLE `loans` MODIFY `rejected_by` ENUM('gm', 'credit_com') NULL");
            return;
        }

        if ($driver === 'pgsql') {
            $constraint = DB::selectOne(
                "SELECT conname FROM pg_constraint WHERE conrelid = 'loans'::regclass AND conname LIKE '%rejected_by%'"
            );
            if ($constraint) {
                DB::statement('ALTER TABLE loans DROP CONSTRAINT ' . $constraint->conname);
            }
            DB::statement("ALTER TABLE loans ADD CONSTRAINT loans_rejected_by_check CHECK (rejected_by IN ('gm', 'credit_com'))");
            return;
        }

        Schema::disableForeignKeyConstraints();

        DB::statement('CREATE TABLE loans_backup AS SELECT * FROM loans');

        DB::statement('DROP TABLE loans');

        DB::statement('CREATE TABLE loans (
            "id" integer primary key autoincrement not null,
            "user_id" integer not null,
            "loan_type_id" integer not null,
            "principal_amount" numeric not null,
            "terms_months" integer not null,
            "interest_amount" numeric not null,
            "total_amount_due" numeric not null,
            "monthly_amortization" numeric not null,
            "voucher_number" varchar,
            "check_number" varchar,
            "release_date" date,
            "status" varchar check ("status" in (\'draft\', \'awaiting_comaker\', \'pending_gm_review\', \'endorsed_by_gm\', \'pending_cc_review\', \'approved\', \'released\', \'rejected_by_co_maker\', \'rejected_by_gm\', \'rejected_by_credit_com\', \'paid_off\')) not null default \'draft\',
            "remarks" text,
            "created_at" datetime,
            "updated_at" datetime,
            "rejected_by" varchar check ("rejected_by" in (\'gm\', \'credit_com\')),
            "rejected_at" datetime,
            "notifications_read_at" datetime,
            "has_edited" tinyint(1) not null default \'0\',
            foreign key("user_id") references "users"("id"),
            foreign key("loan_type_id") references "loan_types"("id")
        )');

        DB::statement('INSERT INTO loans SELECT * FROM loans_backup');

        DB::statement('DROP TABLE loans_backup');

        Schema::enableForeignKeyConstraints();
    }
};
