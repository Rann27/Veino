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
        Schema::table('user_theme_preferences', function (Blueprint $table) {
            $table->string('theme_background', 7)->nullable()->after('theme_name');
            $table->string('theme_foreground', 7)->nullable()->after('theme_background');
        });
    }

    public function down(): void
    {
        Schema::table('user_theme_preferences', function (Blueprint $table) {
            $table->dropColumn(['theme_background', 'theme_foreground']);
        });
    }
};
