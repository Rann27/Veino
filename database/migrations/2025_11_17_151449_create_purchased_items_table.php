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
        Schema::create('purchased_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('ebook_item_id')->constrained('ebook_items')->cascadeOnDelete();
            $table->string('transaction_id')->unique(); // untuk tracking
            $table->integer('price_paid'); // harga saat dibeli (bisa berubah di masa depan)
            $table->timestamp('purchased_at');
            $table->timestamps();
            
            // Prevent duplicate purchases (user can only buy same item once)
            $table->unique(['user_id', 'ebook_item_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('purchased_items');
    }
};
