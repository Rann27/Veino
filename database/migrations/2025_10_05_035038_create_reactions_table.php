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
        Schema::create('reactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->morphs('reactable'); // Polymorphic relation (series, chapter, or comment) - already creates index
            $table->enum('type', ['like', 'love', 'haha', 'angry', 'sad']);
            $table->timestamps();
            
            // Ensure one user can only have one reaction per item
            $table->unique(['user_id', 'reactable_type', 'reactable_id']);
            
            // Additional index for performance (morphs already creates reactable index)
            $table->index('user_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('reactions');
    }
};
