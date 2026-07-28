<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Permanent monthly archive. Unique visitor counts cannot be summed from
        // the daily table, so each month is counted from raw page views while
        // they are still inside the retention window.
        Schema::create('analytics_monthly', function (Blueprint $table) {
            $table->id();
            $table->char('month', 7)->unique(); // YYYY-MM
            $table->unsignedInteger('pageviews')->default(0);
            $table->unsignedInteger('visitors')->default(0);
            $table->unsignedInteger('sessions')->default(0);
            $table->unsignedInteger('new_visitors')->default(0);
            $table->unsignedInteger('member_views')->default(0);
            $table->unsignedInteger('guest_views')->default(0);
            $table->unsignedInteger('active_days')->default(0);
            $table->json('devices')->nullable();
            $table->json('browsers')->nullable();
            $table->json('os')->nullable();
            $table->json('page_types')->nullable();
            $table->json('top_pages')->nullable();
            $table->json('top_referrers')->nullable();
            $table->json('countries')->nullable();
            $table->timestamps();
        });

        Schema::table('analytics_daily', function (Blueprint $table) {
            $table->json('browsers')->nullable()->after('devices');
            $table->json('os')->nullable()->after('browsers');
            $table->json('page_types')->nullable()->after('os');
        });
    }

    public function down(): void
    {
        Schema::table('analytics_daily', function (Blueprint $table) {
            $table->dropColumn(['browsers', 'os', 'page_types']);
        });

        Schema::dropIfExists('analytics_monthly');
    }
};
