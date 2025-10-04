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
        Schema::table('chapters', function (Blueprint $table) {
            // Add volume column as DECIMAL, nullable for existing data
            $table->decimal('volume', 8, 2)->nullable()->after('chapter_number');
            
            // Change chapter_number from integer to decimal
            $table->decimal('chapter_number', 8, 2)->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('chapters', function (Blueprint $table) {
            // Remove volume column
            $table->dropColumn('volume');
            
            // Revert chapter_number back to integer
            $table->integer('chapter_number')->change();
        });
    }
};
