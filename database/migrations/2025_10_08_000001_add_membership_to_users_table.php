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
        Schema::table('users', function (Blueprint $table) {
            // Membership tier: basic (free), premium (paid)
            $table->enum('membership_tier', ['basic', 'premium'])
                  ->default('basic')
                  ->after('coins');
            
            // Membership expiration timestamp (null = free/never expires)
            $table->timestamp('membership_expires_at')
                  ->nullable()
                  ->after('membership_tier');
            
            // Index for efficient queries
            $table->index('membership_tier');
            $table->index('membership_expires_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex(['membership_tier']);
            $table->dropIndex(['membership_expires_at']);
            $table->dropColumn(['membership_tier', 'membership_expires_at']);
        });
    }
};
