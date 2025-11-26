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
        Schema::create('vouchers', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique(); // Voucher code (ALL CAPS)
            $table->enum('type', ['membership', 'ebook', 'hybrid']); // Applicable for
            $table->enum('discount_type', ['percent', 'flat']); // Discount type
            $table->decimal('discount_value', 10, 2); // Discount amount/percentage
            $table->enum('usage_limit_type', ['per_user', 'global']); // N kali per user atau global
            $table->integer('usage_limit'); // N kali usage
            $table->integer('usage_count')->default(0); // Current usage count (for global)
            $table->timestamp('expires_at')->nullable(); // Expiry date
            $table->boolean('is_active')->default(true); // Active status
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('vouchers');
    }
};
