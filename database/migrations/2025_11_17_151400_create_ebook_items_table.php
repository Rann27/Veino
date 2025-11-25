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
        Schema::create('ebook_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('ebook_series_id')->constrained('ebook_series')->cascadeOnDelete();
            $table->string('title');
            $table->string('cover')->nullable();
            $table->text('summary')->nullable();
            $table->string('file_path')->nullable(); // epub file path
            $table->integer('price_coins')->default(0);
            $table->integer('order')->default(0); // untuk sorting (volume 1, 2, 3, dst)
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ebook_items');
    }
};
