<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Free-unlock shortlinks, per provider and per landing host.
     *
     * The original chapters.unlock_shortlink column stays what it always was:
     * Move2Link links landing on the main site. Everything else lives here,
     * one per chapter, provider, claim token and landing host, so that
     *  - switching provider never overwrites another provider's link, and
     *    switching back finds the old ones still in place;
     *  - a copy of the app on another host (test.veinovel.com shares this
     *    database) never hands the main site a link that lands on the copy.
     */
    public function up(): void
    {
        Schema::create('chapter_shortlinks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('chapter_id')->constrained()->cascadeOnDelete();
            $table->string('provider', 20);
            $table->string('token', 64);
            $table->string('host', 100);
            $table->string('url', 255);
            $table->timestamp('created_at')->nullable();

            $table->unique(['chapter_id', 'provider', 'token', 'host']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('chapter_shortlinks');
    }
};
