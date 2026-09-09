<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Every claim, granted or refused. Kept apart from
        // chapter_temporary_access on purpose: that table records who currently
        // holds access, and a refused attempt must not create a row there.
        //
        // elapsed_seconds is the point of the whole table. The gate takes about
        // a minute, so a run that finishes far quicker is someone who skipped
        // it — but that only becomes visible once the timings are written down
        // and can be compared against each other.
        Schema::create('chapter_unlock_attempts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('chapter_id')->nullable()->constrained()->nullOnDelete();

            // granted | not_started | too_fast | bad_referer | daily_limit | disabled
            $table->string('outcome', 20);

            $table->unsignedInteger('elapsed_seconds')->nullable();
            $table->string('source', 20)->default('shortlink');
            $table->string('ip', 45)->nullable();
            $table->timestamp('created_at')->nullable();

            $table->index('created_at');
            $table->index(['outcome', 'created_at']);
            $table->index(['user_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('chapter_unlock_attempts');
    }
};
