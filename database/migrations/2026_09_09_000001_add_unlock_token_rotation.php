<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('chapters', function (Blueprint $table) {
            // Grants made against the current token. Rotation is driven by this
            // rather than by refusals: a reader who has worked out how to skip
            // the gate stops producing refusals entirely, but every unlock they
            // take still lands here, so they spend the token down themselves.
            $table->unsignedInteger('unlock_claim_count')->default(0)->after('unlock_shortlink_at');
        });

        // Every token this chapter has ever used, kept rather than discarded.
        //
        // Two reasons, both about not leaking. A reader still walking through
        // the gate when rotation happens must still be able to claim, which the
        // retired_at window allows. And a claim arriving on a long-dead token
        // has to produce exactly the same reply as any other failure — if dead
        // tokens 404 while live ones redirect, anyone holding a saved URL can
        // test whether it still works for free, which is the one thing the
        // single refusal message exists to prevent.
        Schema::create('chapter_unlock_tokens', function (Blueprint $table) {
            $table->id();
            $table->foreignId('chapter_id')->constrained()->cascadeOnDelete();
            $table->string('token', 64)->unique();
            $table->timestamp('retired_at');

            $table->index('retired_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('chapter_unlock_tokens');

        Schema::table('chapters', function (Blueprint $table) {
            $table->dropColumn('unlock_claim_count');
        });
    }
};
