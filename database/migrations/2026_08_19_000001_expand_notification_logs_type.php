<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // SQLite implements ENUM columns as TEXT with a CHECK constraint, which
        // cannot be altered in place. To allow GM profile-decision notifications
        // we recreate the table with an expanded set of allowed `type` values while
        // preserving any existing rows.
        $rows = DB::select('SELECT * FROM notification_logs');

        Schema::dropIfExists('notification_logs');

        Schema::create('notification_logs', function ($table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->string('title');
            $table->text('message');
            $table->enum('type', [
                'loan_status',
                'payment_due',
                'comaker_request',
                'system',
                'general',
                'gm_profile_decision',
            ])->default('general');
            $table->unsignedBigInteger('related_id')->nullable();
            $table->string('related_type')->nullable();
            $table->boolean('is_read')->default(false);
            $table->timestamp('read_at')->nullable();
            $table->timestamps();
            $table->index(['user_id', 'is_read', 'created_at']);
        });

        if (! empty($rows)) {
            DB::table('notification_logs')->insert(
                array_map(fn ($row) => (array) $row, $rows)
            );
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $rows = DB::select('SELECT * FROM notification_logs');

        Schema::dropIfExists('notification_logs');

        Schema::create('notification_logs', function ($table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->string('title');
            $table->text('message');
            $table->enum('type', [
                'loan_status',
                'payment_due',
                'comaker_request',
                'system',
                'general',
            ])->default('general');
            $table->unsignedBigInteger('related_id')->nullable();
            $table->string('related_type')->nullable();
            $table->boolean('is_read')->default(false);
            $table->timestamp('read_at')->nullable();
            $table->timestamps();
            $table->index(['user_id', 'is_read', 'created_at']);
        });

        if (! empty($rows)) {
            // Keep only rows whose type still belongs to the original allowed set.
            $allowed = ['loan_status', 'payment_due', 'comaker_request', 'system', 'general'];
            $reinsert = array_filter(
                array_map(fn ($row) => (array) $row, $rows),
                fn ($row) => in_array($row['type'], $allowed, true)
            );

            if (! empty($reinsert)) {
                DB::table('notification_logs')->insert($reinsert);
            }
        }
    }
};
