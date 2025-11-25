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
        // Alter the enum type column to include admin action types
        DB::statement("ALTER TABLE transactions MODIFY COLUMN type ENUM('coin_purchase', 'membership_purchase', 'ebook_purchase', 'chapter_purchase', 'admin_grant', 'admin_deduction', 'admin_membership_grant') NOT NULL");
        
        // Also update payment_method enum to include 'admin'
        DB::statement("ALTER TABLE transactions MODIFY COLUMN payment_method ENUM('paypal', 'coins', 'cryptomus', 'admin') NOT NULL");
        
        // Make amount nullable for admin grants (no money involved)
        DB::statement("ALTER TABLE transactions MODIFY COLUMN amount DECIMAL(10, 2) NULL");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Revert back to original enum values
        DB::statement("ALTER TABLE transactions MODIFY COLUMN type ENUM('coin_purchase', 'membership_purchase', 'ebook_purchase', 'chapter_purchase') NOT NULL");
        DB::statement("ALTER TABLE transactions MODIFY COLUMN payment_method ENUM('paypal', 'coins') NOT NULL");
        DB::statement("ALTER TABLE transactions MODIFY COLUMN amount DECIMAL(10, 2) NOT NULL");
    }
};
