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
        Schema::create('membership_purchases', function (Blueprint $table) {
            $table->id();
            
            // Relations
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('membership_package_id')->constrained()->onDelete('cascade');
            
            // Purchase details
            $table->enum('tier', ['premium']);
            $table->integer('duration_days');
            $table->decimal('price_usd', 8, 2);
            
            // Payment information
            $table->string('payment_method'); // paypal, stripe, etc.
            $table->string('transaction_id')->nullable();
            $table->enum('status', ['pending', 'completed', 'failed', 'refunded', 'cancelled'])
                  ->default('pending');
            
            // Membership period
            $table->timestamp('starts_at')->nullable();
            $table->timestamp('expires_at')->nullable();
            
            // Additional info
            $table->text('notes')->nullable(); // For admin notes or failure reasons
            
            $table->timestamps();
            
            // Indexes
            $table->index('user_id');
            $table->index('status');
            $table->index('starts_at');
            $table->index('expires_at');
            $table->index('transaction_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('membership_purchases');
    }
};
