<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('profile_update_requests', function (Blueprint $table) {
            $table->id();
            $table->string('member_id');
            $table->string('request_type')->default('profile_update');
            $table->string('proposed_status')->nullable();
            $table->text('reason')->nullable();
            $table->foreignId('requested_by')->constrained('users')->onDelete('cascade');
            $table->json('original_data');
            $table->json('pending_data');
            $table->enum('status', ['pending', 'approved', 'rejected'])->default('pending');
            $table->text('rejection_reason')->nullable();
            $table->foreignId('reviewed_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamps();

            $table->foreign('member_id')
                ->references('members_id')
                ->on('member_profiles')
                ->onDelete('cascade');

            $table->index('status');
            $table->index('member_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('profile_update_requests');
    }
};
