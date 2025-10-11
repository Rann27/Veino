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
        Schema::create('advertisements', function (Blueprint $table) {
            $table->id();
            $table->string('advertiser_name');
            $table->enum('unit_type', ['banner', 'interstitial', 'in_text_link']);
            $table->string('file_path')->nullable(); // For banner and interstitial (jpg/gif)
            $table->string('link_url'); // Destination URL for all types
            $table->string('link_caption')->nullable(); // Caption for in-text links
            $table->dateTime('expired_at');
            $table->unsignedBigInteger('clicks')->default(0); // Click tracking
            $table->unsignedBigInteger('impressions')->default(0); // Impression tracking
            $table->boolean('is_active')->default(true); // Auto false if expired
            $table->timestamps();

            // Indexes for performance
            $table->index('unit_type');
            $table->index('is_active');
            $table->index('expired_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('advertisements');
    }
};
