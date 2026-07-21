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
            DB::statement("ALTER TABLE loan_amortizations MODIFY status ENUM('pending', 'paid', 'partial', 'overdue', 'missed', 'deferred', 'manual_payment') DEFAULT 'pending'");
            return;
        }

        if ($driver === 'pgsql') {
            $constraint = DB::selectOne(
                "SELECT conname FROM pg_constraint WHERE conrelid = 'loan_amortizations'::regclass AND conname LIKE '%status%'"
            );

            if ($constraint) {
                DB::statement('ALTER TABLE loan_amortizations DROP CONSTRAINT ' . $constraint->conname);
            }

            DB::statement("ALTER TABLE loan_amortizations ADD CONSTRAINT loan_amortizations_status_check CHECK (status IN ('pending', 'paid', 'partial', 'overdue', 'missed', 'deferred', 'manual_payment'))");
            return;
        }

        Schema::disableForeignKeyConstraints();

        DB::statement('CREATE TABLE loan_amortizations_backup AS SELECT * FROM loan_amortizations');

        DB::statement('DROP TABLE loan_amortizations');

        DB::statement('CREATE TABLE loan_amortizations (
            "id" integer primary key autoincrement not null,
            "loan_id" integer not null,
            "installment_number" integer not null,
            "due_date" date not null,
            "amount_due" numeric not null,
            "amount_paid" numeric not null default 0,
            "status" varchar check ("status" in (\'pending\', \'paid\', \'partial\', \'overdue\', \'missed\', \'deferred\', \'manual_payment\')) not null default \'pending\',
            "created_at" datetime,
            "updated_at" datetime,
            foreign key("loan_id") references "loans"("id") on delete cascade
        )');

        DB::statement('INSERT INTO loan_amortizations SELECT * FROM loan_amortizations_backup');

        DB::statement('DROP TABLE loan_amortizations_backup');

        Schema::enableForeignKeyConstraints();
    }

    public function down(): void
    {
        DB::table('loan_amortizations')
            ->whereIn('status', ['missed', 'deferred', 'manual_payment'])
            ->update(['status' => 'overdue']);

        $driver = Schema::getConnection()->getDriverName();

        if ($driver === 'mysql') {
            DB::statement("ALTER TABLE loan_amortizations MODIFY status ENUM('pending', 'paid', 'partial', 'overdue') DEFAULT 'pending'");
            return;
        }

        if ($driver === 'pgsql') {
            $constraint = DB::selectOne(
                "SELECT conname FROM pg_constraint WHERE conrelid = 'loan_amortizations'::regclass AND conname LIKE '%status%'"
            );

            if ($constraint) {
                DB::statement('ALTER TABLE loan_amortizations DROP CONSTRAINT ' . $constraint->conname);
            }

            DB::statement("ALTER TABLE loan_amortizations ADD CONSTRAINT loan_amortizations_status_check CHECK (status IN ('pending', 'paid', 'partial', 'overdue'))");
            return;
        }

        Schema::disableForeignKeyConstraints();

        DB::statement('CREATE TABLE loan_amortizations_backup AS SELECT * FROM loan_amortizations');

        DB::statement('DROP TABLE loan_amortizations');

        DB::statement('CREATE TABLE loan_amortizations (
            "id" integer primary key autoincrement not null,
            "loan_id" integer not null,
            "installment_number" integer not null,
            "due_date" date not null,
            "amount_due" numeric not null,
            "amount_paid" numeric not null default 0,
            "status" varchar check ("status" in (\'pending\', \'paid\', \'partial\', \'overdue\')) not null default \'pending\',
            "created_at" datetime,
            "updated_at" datetime,
            foreign key("loan_id") references "loans"("id") on delete cascade
        )');

        DB::statement('INSERT INTO loan_amortizations SELECT * FROM loan_amortizations_backup');

        DB::statement('DROP TABLE loan_amortizations_backup');

        Schema::enableForeignKeyConstraints();
    }
};
