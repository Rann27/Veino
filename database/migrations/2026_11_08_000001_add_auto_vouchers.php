<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Automatic first-come vouchers (daily, weekly, monthly).
     *
     * `auto_kind` + `period_key` identify the voucher of one period ("daily",
     * "2026-11-08"), and the unique index is what makes generation safe to run
     * from several places at once: the scheduler and the first page view of a
     * period can both try, and only one row can ever exist.
     */
    public function up(): void
    {
        Schema::table('vouchers', function (Blueprint $table) {
            $table->string('auto_kind', 10)->nullable()->after('is_active');
            $table->string('period_key', 20)->nullable()->after('auto_kind');
            $table->unique(['auto_kind', 'period_key']);
        });
    }

    public function down(): void
    {
        Schema::table('vouchers', function (Blueprint $table) {
            $table->dropUnique(['auto_kind', 'period_key']);
            $table->dropColumn(['auto_kind', 'period_key']);
        });
    }
};
