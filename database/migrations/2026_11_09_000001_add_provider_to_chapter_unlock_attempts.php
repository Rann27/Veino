<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Which shortlink network a free-unlock attempt went through.
     *
     * With several networks in rotation, the monitor needs to tell them apart:
     * each gate takes its own time, and the timing floor is tuned per network
     * from these rows. Null on rows from before rotation.
     */
    public function up(): void
    {
        Schema::table('chapter_unlock_attempts', function (Blueprint $table) {
            $table->string('provider', 20)->nullable()->after('source');
            // A referer from outside the network's known hosts. Recorded,
            // not refused: see ChapterUnlockService::consumeChallenge().
            $table->string('referer_host', 100)->nullable()->after('provider');
            $table->index(['provider', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::table('chapter_unlock_attempts', function (Blueprint $table) {
            $table->dropIndex(['provider', 'created_at']);
            $table->dropColumn(['provider', 'referer_host']);
        });
    }
};
