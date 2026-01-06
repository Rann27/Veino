<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Step 1: Add chapter_link column (nullable initially) if it doesn't exist
        if (!Schema::hasColumn('chapters', 'chapter_link')) {
            Schema::table('chapters', function (Blueprint $table) {
                $table->string('chapter_link', 50)->nullable()->after('chapter_number');
            });
        }

        // Step 2: Populate chapter_link with existing chapter_number values for rows where it's null
        // Use PHP formatting to properly handle decimals (1.00 -> 1, 1.50 -> 1.5, 0.5 -> 0.5)
        // Note: Decimal chapters only use 1 digit (e.g., 1.5, not 1.75)
        $chapters = DB::table('chapters')->whereNull('chapter_link')->get(['id', 'chapter_number']);
        foreach ($chapters as $chapter) {
            $number = (float) $chapter->chapter_number;
            // Remove trailing zeros and decimal point if not needed
            // Examples: 1.0 -> "1", 1.5 -> "1.5", 0.5 -> "0.5"
            $cleanLink = rtrim(rtrim(number_format($number, 1, '.', ''), '0'), '.');
            
            DB::table('chapters')
                ->where('id', $chapter->id)
                ->update(['chapter_link' => $cleanLink]);
        }

        // Step 3: Drop old unique constraint on (series_id, chapter_number) if it exists
        try {
            DB::statement('ALTER TABLE chapters DROP INDEX chapters_series_id_chapter_number_unique');
        } catch (\Exception $e) {
            // Index might already be dropped, ignore error
        }

        // Step 4: Add new unique constraint on (series_id, chapter_link) if it doesn't exist
        $indexes = DB::select("SHOW INDEX FROM chapters WHERE Key_name = 'chapters_series_id_chapter_link_unique'");
        if (empty($indexes)) {
            Schema::table('chapters', function (Blueprint $table) {
                $table->unique(['series_id', 'chapter_link']);
            });
        }

        // Step 5: Make chapter_link non-nullable
        Schema::table('chapters', function (Blueprint $table) {
            $table->string('chapter_link', 50)->nullable(false)->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Step 1: Drop unique constraint on chapter_link
        Schema::table('chapters', function (Blueprint $table) {
            $table->dropUnique(['series_id', 'chapter_link']);
        });

        // Step 2: Restore unique constraint on chapter_number
        Schema::table('chapters', function (Blueprint $table) {
            $table->unique(['series_id', 'chapter_number']);
        });

        // Step 3: Drop chapter_link column
        Schema::table('chapters', function (Blueprint $table) {
            $table->dropColumn('chapter_link');
        });
    }
};
