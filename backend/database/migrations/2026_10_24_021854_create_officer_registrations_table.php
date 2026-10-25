<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('officer_registrations', function (Blueprint $table) {
            $table->id();
            $table->string('full_name');
            $table->string('student_id')->nullable();
            $table->string('email')->unique();
            $table->string('usg_position');
            $table->text('reason')->nullable(); // Why they need officer access
            $table->string('password'); // Hashed password (set during registration)
            $table->string('email_verification_token')->nullable();
            $table->timestamp('email_verified_at')->nullable();
            $table->enum('status', ['pending_verification', 'pending_approval', 'approved', 'rejected'])->default('pending_verification');
            $table->text('rejection_reason')->nullable();
            $table->foreignId('reviewed_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamp('reviewed_at')->nullable();
            $table->json('permissions')->nullable(); // Admin can set specific permissions on approval
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('officer_registrations');
    }
};
