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
            $table->boolean('show_trial_button')->default(false)->after('native_language_id');
            $table->string('series_slug')->nullable()->after('show_trial_button');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('ebook_series', function (Blueprint $table) {
            $table->dropColumn(['show_trial_button', 'series_slug']);
        });
    }
};
