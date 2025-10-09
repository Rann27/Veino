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
        Schema::create('membership_packages', function (Blueprint $table) {
            $table->id();
            
            // Package details
            $table->string('name'); // e.g., "Premium Monthly", "Premium Annual"
            $table->enum('tier', ['premium']);
            
            // Pricing
            $table->decimal('price_usd', 8, 2);
            
            // Duration in days (30 for monthly, 365 for annual)
            $table->integer('duration_days');
            
            // Features/Benefits (stored as JSON for flexibility)
            $table->json('features')->nullable();
            // Example features:
            // {
            //   "unlimited_reading": true,
            //   "ad_free": true,
            //   "exclusive_content": false,
            //   "early_access": false,
            //   "bonus_coins": 100
            // }
            
            // Discount percentage (optional, for promotions)
            $table->integer('discount_percentage')->default(0);
            
            // Status
            $table->boolean('is_active')->default(true);
            
            // Display order
            $table->integer('sort_order')->default(0);
            
            $table->timestamps();
            
            // Indexes
            $table->index('tier');
            $table->index('is_active');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('membership_packages');
    }
};
