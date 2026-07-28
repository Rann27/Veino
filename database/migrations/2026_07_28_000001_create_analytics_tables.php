<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Raw pageview log. Pruned after config('analytics.retention_days').
        Schema::create('page_views', function (Blueprint $table) {
            $table->id();
            $table->char('visitor_id', 32);
            $table->char('session_id', 32)->nullable();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('path', 512);
            $table->string('page_type', 20)->default('other');
            $table->unsignedBigInteger('series_id')->nullable();
            $table->string('title', 255)->nullable();
            $table->string('referrer_host', 255)->nullable();
            $table->string('device', 10)->default('desktop');
            $table->string('browser', 30)->nullable();
            $table->string('os', 30)->nullable();
            $table->char('country', 2)->nullable();
            $table->boolean('is_new_visitor')->default(false);
            $table->boolean('is_member')->default(false);
            $table->timestamp('created_at')->nullable();

            $table->index('created_at');
            $table->index(['visitor_id', 'created_at']);
            $table->index(['page_type', 'created_at']);
            $table->index(['series_id', 'created_at']);
            $table->index(['session_id', 'created_at']);
        });

        // One row per unique visitor. Enables new-vs-returning without scanning page_views.
        Schema::create('analytics_visitors', function (Blueprint $table) {
            $table->char('visitor_id', 32)->primary();
            $table->timestamp('first_seen_at');
            $table->timestamp('last_seen_at');
            $table->unsignedInteger('pageviews')->default(0);
            $table->char('country', 2)->nullable();
            $table->string('device', 10)->nullable();

            $table->index('first_seen_at');
            $table->index('last_seen_at');
        });

        // Permanent daily rollup. Survives pruning of page_views.
        Schema::create('analytics_daily', function (Blueprint $table) {
            $table->id();
            $table->date('date')->unique();
            $table->unsignedInteger('pageviews')->default(0);
            $table->unsignedInteger('visitors')->default(0);
            $table->unsignedInteger('sessions')->default(0);
            $table->unsignedInteger('new_visitors')->default(0);
            $table->unsignedInteger('member_views')->default(0);
            $table->unsignedInteger('guest_views')->default(0);
            $table->json('devices')->nullable();
            $table->json('top_pages')->nullable();
            $table->json('top_referrers')->nullable();
            $table->json('countries')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('analytics_daily');
        Schema::dropIfExists('analytics_visitors');
        Schema::dropIfExists('page_views');
    }
};
