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
        Schema::create('chapters', function (Blueprint $table) {
            $table->id();
            $table->foreignId('series_id')->constrained('series')->onDelete('cascade');
            $table->integer('chapter_number');
            $table->string('title');
            $table->longText('content');
            $table->boolean('is_premium')->default(false);
            $table->integer('coin_price')->default(45);
            $table->boolean('is_published')->default(true);
            $table->timestamps();
            
            $table->unique(['series_id', 'chapter_number']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('chapters');
    }
};
