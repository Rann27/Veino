<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Deleting from the storage manager moves the file here rather than
        // unlinking it. The usage scan is careful, but "careful" is not "proven"
        // — if a reference source is ever missed, this table is what makes the
        // mistake undoable instead of permanent.
        Schema::create('storage_trash', function (Blueprint $table) {
            $table->id();
            $table->string('original_path', 500);
            $table->string('trash_path', 500);
            $table->string('disk', 20);
            $table->unsignedBigInteger('size')->default(0);
            $table->foreignId('deleted_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('deleted_at');
            $table->timestamps();

            $table->index('deleted_at');
            $table->index('original_path');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('storage_trash');
    }
};
