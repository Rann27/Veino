<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('membership_packages', function (Blueprint $table) {
            $table->decimal('gimmick_price_usd', 8, 2)->nullable()->after('gimmick_price');
        });

        // Set default USD prices per duration
        DB::table('membership_packages')->where('duration_days', 30)
            ->update(['price_usd' => 6.49,  'gimmick_price_usd' => 10.00]);
        DB::table('membership_packages')->where('duration_days', 90)
            ->update(['price_usd' => 17.49, 'gimmick_price_usd' => 30.00]);
        DB::table('membership_packages')->where('duration_days', 180)
            ->update(['price_usd' => 32.49, 'gimmick_price_usd' => 60.00]);
        DB::table('membership_packages')->where('duration_days', 365)
            ->update(['price_usd' => 60.49, 'gimmick_price_usd' => 120.00]);
    }

    public function down(): void
    {
        Schema::table('membership_packages', function (Blueprint $table) {
            $table->dropColumn('gimmick_price_usd');
        });
    }
};
