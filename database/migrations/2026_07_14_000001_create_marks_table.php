<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('marks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('series_id')->constrained()->cascadeOnDelete();
            $table->foreignId('chapter_id')->constrained()->cascadeOnDelete();
            $table->unsignedSmallInteger('paragraph_index');
            $table->string('paragraph_preview', 200)->default('');
            $table->timestamps();

            $table->unique(['user_id', 'chapter_id', 'paragraph_index'], 'marks_unique');
            $table->index(['user_id', 'series_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('marks');
    }
};
