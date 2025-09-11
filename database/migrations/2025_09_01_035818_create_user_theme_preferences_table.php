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
        Schema::create('user_theme_preferences', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('theme_name')->default('Light'); // Light, Dark, Sepia, etc
            $table->boolean('auto_theme')->default(false); // Follow system preference
            $table->json('reader_settings')->nullable(); // Font, size, line height, etc
            $table->timestamps();
            
            $table->unique('user_id'); // One preference per user
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('user_theme_preferences');
    }
};
