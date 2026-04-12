<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // MySQL ALTER COLUMN to extend the enum with 'cancelled'
        DB::statement("ALTER TABLE coin_purchases MODIFY COLUMN status ENUM('pending', 'completed', 'failed', 'refunded', 'cancelled') NOT NULL DEFAULT 'pending'");
    }

    public function down(): void
    {
        DB::statement("ALTER TABLE coin_purchases MODIFY COLUMN status ENUM('pending', 'completed', 'failed', 'refunded') NOT NULL DEFAULT 'pending'");
    }
};
