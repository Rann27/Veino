<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('request_commissions', function (Blueprint $table) {
            $table->text('note_for_admin')->nullable()->after('raw_link');
        });
    }

    public function down(): void
    {
        Schema::table('request_commissions', function (Blueprint $table) {
            $table->dropColumn('note_for_admin');
        });
    }
};
