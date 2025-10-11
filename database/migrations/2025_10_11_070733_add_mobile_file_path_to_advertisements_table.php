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
        Schema::table('advertisements', function (Blueprint $table) {
            // Rename existing file_path to file_path_desktop for clarity
            $table->renameColumn('file_path', 'file_path_desktop');
            
            // Add mobile file path column
            $table->string('file_path_mobile')->nullable()->after('file_path_desktop');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('advertisements', function (Blueprint $table) {
            // Remove mobile file path
            $table->dropColumn('file_path_mobile');
            
            // Rename back to original
            $table->renameColumn('file_path_desktop', 'file_path');
        });
    }
};
