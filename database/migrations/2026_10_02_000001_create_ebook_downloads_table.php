<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // One row per reader, volume and format, counted up on each download.
        //
        // Not a log of every click: someone pressing the button ten times is
        // one reader with ten downloads, and keeping it that way means the
        // table grows with readers rather than with traffic — so it never
        // needs pruning, and lifetime totals never shrink.
        Schema::create('ebook_downloads', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('ebook_item_id')->constrained()->cascadeOnDelete();
            $table->string('format', 8);            // epub | pdf
            $table->unsignedInteger('downloads')->default(1);
            $table->timestamp('first_downloaded_at');
            $table->timestamp('last_downloaded_at');

            $table->unique(['user_id', 'ebook_item_id', 'format']);
            $table->index('ebook_item_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ebook_downloads');
    }
};
