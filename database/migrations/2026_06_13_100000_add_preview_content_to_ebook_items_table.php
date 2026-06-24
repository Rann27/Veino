<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('ebook_items', function (Blueprint $table) {
            $table->longText('preview_content')->nullable()->after('pdf_file_path');
        });
    }

    public function down(): void
    {
        Schema::table('ebook_items', function (Blueprint $table) {
            $table->dropColumn('preview_content');
        });
    }
};
