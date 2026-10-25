<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Modify the period enum to include more options
        DB::statement("ALTER TABLE fines MODIFY COLUMN period ENUM('morning_in', 'morning_out', 'afternoon_in', 'afternoon_out', 'whole_morning', 'whole_afternoon', 'whole_day', 'whole_event', 'check_in') NOT NULL");
    }

    public function down(): void
    {
        DB::statement("ALTER TABLE fines MODIFY COLUMN period ENUM('morning_in', 'morning_out', 'afternoon_in', 'afternoon_out') NOT NULL");
    }
};
