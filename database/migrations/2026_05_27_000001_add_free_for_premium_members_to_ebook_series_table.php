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
        Schema::table('ebook_series', function (Blueprint $table) {
            $table->boolean('free_for_premium_members')->default(false)->after('series_slug');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('ebook_series', function (Blueprint $table) {
            $table->dropColumn('free_for_premium_members');
        });
    }
};
