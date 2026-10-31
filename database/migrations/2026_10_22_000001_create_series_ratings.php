<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // One vote per reader per series, 1–5 stars.
        Schema::create('series_ratings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('series_id')->constrained('series')->cascadeOnDelete();
            $table->unsignedTinyInteger('stars');
            $table->timestamps();

            $table->unique(['user_id', 'series_id']);
            $table->index('series_id');
        });

        Schema::table('series', function (Blueprint $table) {
            // The admin-entered figure, kept rather than thrown away. Ratings
            // are now readers' votes only, but these numbers were curated by
            // hand and are cheap to keep in case they are wanted back.
            $table->decimal('legacy_rating', 3, 1)->nullable()->after('rating');
            $table->unsignedInteger('rating_count')->default(0)->after('legacy_rating');
        });

        DB::table('series')->update(['legacy_rating' => DB::raw('rating')]);

        // rating becomes a cached aggregate of votes: average stars x 2, out
        // of 10. NULL until the first vote, so an unrated series shows no
        // score rather than a misleading 0.0 — and sorts last by rating.
        Schema::table('series', function (Blueprint $table) {
            $table->decimal('rating', 3, 1)->nullable()->default(null)->change();
        });

        DB::table('series')->update(['rating' => null]);
    }

    public function down(): void
    {
        DB::table('series')->update(['rating' => DB::raw('COALESCE(legacy_rating, 0)')]);

        Schema::table('series', function (Blueprint $table) {
            $table->decimal('rating', 3, 1)->default(0)->nullable(false)->change();
            $table->dropColumn(['legacy_rating', 'rating_count']);
        });

        Schema::dropIfExists('series_ratings');
    }
};
