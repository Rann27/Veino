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
        Schema::table('series', function (Blueprint $table) {
            $table->unsignedBigInteger('bookmarks_count')->default(0)->after('views');
            $table->unsignedBigInteger('comments_count')->default(0)->after('bookmarks_count');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('series', function (Blueprint $table) {
            $table->dropColumn(['bookmarks_count', 'comments_count']);
        });
    }
};
