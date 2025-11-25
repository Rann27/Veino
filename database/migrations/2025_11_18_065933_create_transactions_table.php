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
        Schema::create('transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            
            // Transaction type: 'coin_purchase', 'membership_purchase', 'ebook_purchase', 'chapter_purchase'
            $table->enum('type', ['coin_purchase', 'membership_purchase', 'ebook_purchase', 'chapter_purchase']);
            
            // Amount and currency
            $table->decimal('amount', 10, 2); // USD amount
            $table->integer('coins_spent')->nullable(); // For purchases with coins
            $table->integer('coins_received')->nullable(); // For coin top-ups
            
            // Payment method: 'paypal', 'coins'
            $table->enum('payment_method', ['paypal', 'coins']);
            
            // Status: 'pending', 'completed', 'failed', 'refunded'
            $table->enum('status', ['pending', 'completed', 'failed', 'refunded'])->default('pending');
            
            // Related items (polymorphic-like but simple)
            $table->foreignId('coin_package_id')->nullable()->constrained('coin_packages')->onDelete('set null');
            $table->foreignId('membership_package_id')->nullable()->constrained('membership_packages')->onDelete('set null');
            $table->foreignId('ebook_item_id')->nullable()->constrained('ebook_items')->onDelete('set null');
            $table->foreignId('chapter_id')->nullable()->constrained('chapters')->onDelete('set null');
            
            // PayPal transaction details
            $table->string('paypal_order_id')->nullable();
            $table->string('paypal_payer_id')->nullable();
            $table->text('paypal_response')->nullable();
            
            // Description for display
            $table->string('description')->nullable();
            
            $table->timestamps();
            
            // Indexes
            $table->index('user_id');
            $table->index('type');
            $table->index('status');
            $table->index('created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('transactions');
    }
};
