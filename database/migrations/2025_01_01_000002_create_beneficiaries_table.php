<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('beneficiaries', function (Blueprint $table) {
            $table->id();
            $table->string('member_profile_id');
            $table->string('full_name');
            $table->string('relationship');
            $table->date('date_of_birth')->nullable();
            $table->timestamps();

            $table->foreign('member_profile_id')
                ->references('members_id')
                ->on('member_profiles')
                ->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('beneficiaries');
    }
};
