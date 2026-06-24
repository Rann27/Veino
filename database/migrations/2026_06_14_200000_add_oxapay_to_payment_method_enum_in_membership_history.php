<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement("ALTER TABLE membership_history MODIFY COLUMN payment_method ENUM('paypal', 'cryptomus', 'coins', 'oxapay') NOT NULL DEFAULT 'paypal'");
    }

    public function down(): void
    {
        DB::statement("ALTER TABLE membership_history MODIFY COLUMN payment_method ENUM('paypal', 'cryptomus', 'coins') NOT NULL DEFAULT 'paypal'");
    }
};
