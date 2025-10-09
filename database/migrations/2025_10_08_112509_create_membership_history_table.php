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
        Schema::create('membership_history', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('membership_package_id')->constrained()->onDelete('cascade');
            
            // Transaction details
            $table->string('invoice_number')->unique();
            $table->string('transaction_id')->nullable()->unique();
            
            // Package info (snapshot at purchase time)
            $table->enum('tier', ['basic', 'premium'])->default('premium');
            $table->integer('duration_days');
            $table->decimal('amount_usd', 10, 2);
            
            // Payment details
            $table->enum('payment_method', ['paypal', 'cryptomus'])->default('paypal');
            $table->enum('status', ['pending', 'completed', 'failed', 'refunded', 'cancelled'])->default('pending');
            
            // Gateway references
            $table->string('paypal_order_id')->nullable();
            $table->string('cryptomus_order_id')->nullable();
            $table->text('gateway_response')->nullable(); // JSON response from gateway
            
            // Membership activation
            $table->timestamp('starts_at')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            
            $table->timestamps();
            
            // Indexes
            $table->index('user_id');
            $table->index('status');
            $table->index('payment_method');
            $table->index('invoice_number');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('membership_history');
    }
};
