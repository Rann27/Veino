<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Shown to the banned reader on the page they are held at, so it
            // has to be written for them to read — not an internal note.
            $table->text('ban_reason')->nullable()->after('is_banned');
            $table->timestamp('banned_at')->nullable()->after('ban_reason');
        });

        // One row per address a reader has ever signed in from.
        //
        // Deliberately the raw address, which is a departure from the rest of
        // the analytics in this codebase: TrackPageView hashes the IP and
        // never keeps it. The purpose here is different and narrow — telling
        // one person with five accounts apart from five people — and that
        // cannot be done against a salted hash, because the whole point is
        // comparing addresses between accounts.
        Schema::create('user_login_ips', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('ip', 45);
            $table->timestamp('first_seen_at');
            $table->timestamp('last_seen_at');
            $table->unsignedInteger('logins')->default(1);

            // An address already seen for this account is updated, never
            // appended — the list is "which addresses", not "every sign-in".
            $table->unique(['user_id', 'ip']);

            // Drives the shared-address report, which asks the question the
            // other way round: which accounts sit behind one address.
            $table->index(['ip', 'last_seen_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_login_ips');

        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['ban_reason', 'banned_at']);
        });
    }
};
