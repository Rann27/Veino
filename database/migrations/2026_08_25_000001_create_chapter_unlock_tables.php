<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('chapters', function (Blueprint $table) {
            // Public token that appears in the unlock URL. Shared by every
            // reader — what makes a claim valid is the per-reader pending
            // record, not secrecy of this value.
            $table->char('unlock_token', 32)->nullable()->unique()->after('chapter_link');

            // Cached Move2Link URL. Built once per chapter and reused, because
            // their API is rate limited per IP and that IP is our server.
            $table->string('unlock_shortlink', 255)->nullable()->after('unlock_token');
            $table->timestamp('unlock_shortlink_at')->nullable()->after('unlock_shortlink');
        });

        // Time-limited access earned through the shortlink challenge. Kept out
        // of chapter_purchases on purpose: that table records permanent coin
        // purchases and must stay a clean financial history.
        Schema::create('chapter_temporary_access', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('chapter_id')->constrained()->onDelete('cascade');
            $table->timestamp('granted_at');
            $table->timestamp('expires_at');
            $table->string('source', 20)->default('shortlink');
            $table->timestamps();

            // One grant per reader per chapter; unlocking again after it lapses
            // refreshes the same row rather than piling up history.
            $table->unique(['user_id', 'chapter_id']);
            $table->index(['user_id', 'expires_at']);
            $table->index('expires_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('chapter_temporary_access');

        Schema::table('chapters', function (Blueprint $table) {
            $table->dropColumn(['unlock_token', 'unlock_shortlink', 'unlock_shortlink_at']);
        });
    }
};
