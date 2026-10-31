<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * An admin's "looked at this, it's fine" on a fraud suspect.
     *
     * A timestamp rather than a flag so the suspect list can tell an account
     * cleared last week from one cleared before a fresh batch of look-alike
     * accounts turned up — see FraudDetector, which only honours a clearance
     * for evidence that existed when it was given.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->timestamp('fraud_cleared_at')->nullable()->after('banned_at');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('fraud_cleared_at');
        });
    }
};
