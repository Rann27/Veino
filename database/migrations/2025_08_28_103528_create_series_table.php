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
        Schema::create('series', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->string('alternative_title')->nullable();
            $table->string('slug')->unique();
            $table->text('cover_url')->nullable();
            $table->longText('synopsis')->nullable();
            $table->string('author')->nullable();
            $table->string('artist')->nullable();
            $table->decimal('rating', 3, 1)->default(0); // 0.0 to 10.0
            $table->enum('status', ['ongoing', 'complete', 'hiatus'])->default('ongoing');
            $table->foreignId('native_language_id')->constrained('native_languages');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('series');
    }
};
