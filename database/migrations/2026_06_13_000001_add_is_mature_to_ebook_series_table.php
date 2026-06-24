<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('ebook_series', function (Blueprint $table) {
            $table->boolean('is_mature')->default(false)->after('free_for_premium_members');
        });
    }

    public function down(): void
    {
        Schema::table('ebook_series', function (Blueprint $table) {
            $table->dropColumn('is_mature');
        });
    }
};
