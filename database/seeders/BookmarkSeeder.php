<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Series;
use App\Models\Bookmark;

class BookmarkSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get first user and first few series for testing
        $user = User::first();
        $series = Series::take(3)->get();

        if ($user && $series->count() > 0) {
            foreach ($series as $seriesItem) {
                Bookmark::firstOrCreate([
                    'user_id' => $user->id,
                    'series_id' => $seriesItem->id,
                ], [
                    'note' => 'Test bookmark for ' . $seriesItem->title,
                ]);
            }
        }
    }
}
