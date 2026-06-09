<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement("ALTER TABLE transactions MODIFY COLUMN type ENUM('coin_purchase', 'membership_purchase', 'ebook_purchase', 'chapter_purchase', 'admin_grant', 'admin_deduction', 'admin_membership_grant', 'commission_payment') NOT NULL");
    }

    public function down(): void
    {
        DB::statement("ALTER TABLE transactions MODIFY COLUMN type ENUM('coin_purchase', 'membership_purchase', 'ebook_purchase', 'chapter_purchase', 'admin_grant', 'admin_deduction', 'admin_membership_grant') NOT NULL");
    }
};
