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
        Schema::table('membership_packages', function (Blueprint $table) {
            // Add gimmick_price (original price for display with strikethrough)
            $table->decimal('gimmick_price', 8, 2)->after('price_usd')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('membership_packages', function (Blueprint $table) {
            $table->dropColumn('gimmick_price');
        });
    }
};
