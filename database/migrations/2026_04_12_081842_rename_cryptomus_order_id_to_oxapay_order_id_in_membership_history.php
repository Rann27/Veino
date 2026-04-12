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
        Schema::table('membership_history', function (Blueprint $table) {
            $table->renameColumn('cryptomus_order_id', 'oxapay_order_id');
        });
    }

    public function down(): void
    {
        Schema::table('membership_history', function (Blueprint $table) {
            $table->renameColumn('oxapay_order_id', 'cryptomus_order_id');
        });
    }
};
