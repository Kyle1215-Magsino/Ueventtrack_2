<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('academic_years', function (Blueprint $table) {
            $table->id();
            $table->string('year_name'); // e.g., "2024-2025"
            $table->date('start_date');
            $table->date('end_date');
            $table->boolean('is_active')->default(false);
            $table->boolean('is_archived')->default(false);
            $table->text('description')->nullable();
            $table->timestamps();

            // Ensure only one active academic year at a time
            $table->index('is_active');
        });

        // Add academic_year_id to events table
        Schema::table('events', function (Blueprint $table) {
            $table->unsignedBigInteger('academic_year_id')->nullable()->after('id');
            $table->foreign('academic_year_id')->references('id')->on('academic_years')->nullOnDelete();
        });

        // Add academic_year_id to students table
        Schema::table('students', function (Blueprint $table) {
            $table->unsignedBigInteger('academic_year_id')->nullable()->after('id');
            $table->foreign('academic_year_id')->references('id')->on('academic_years')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('students', function (Blueprint $table) {
            $table->dropForeign(['academic_year_id']);
            $table->dropColumn('academic_year_id');
        });

        Schema::table('events', function (Blueprint $table) {
            $table->dropForeign(['academic_year_id']);
            $table->dropColumn('academic_year_id');
        });

        Schema::dropIfExists('academic_years');
    }
};
