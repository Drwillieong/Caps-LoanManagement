<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $rows = DB::select('SELECT * FROM notification_logs');

        Schema::dropIfExists('notification_logs');

        Schema::create('notification_logs', function (Blueprint $table) {
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
                'salary_deduction',
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

        Schema::create('notification_logs', function (Blueprint $table) {
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

        $allowed = ['loan_status', 'payment_due', 'comaker_request', 'system', 'general', 'gm_profile_decision'];
        $reinsert = array_filter(
            array_map(fn ($row) => (array) $row, $rows),
            fn ($row) => in_array($row['type'], $allowed, true)
        );

        if (! empty($reinsert)) {
            DB::table('notification_logs')->insert($reinsert);
        }
    }
};
