<?php

namespace Database\Seeders;

use App\Models\Chapter;
use App\Models\Genre;
use App\Models\NativeLanguage;
use App\Models\Series;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class DemoDataSeeder extends Seeder
{
    public function run(): void
    {
        // Create some demo users
        for ($i = 1; $i <= 10; $i++) {
            User::factory()->create([
                'display_name' => "User $i",
                'email' => "user$i@example.com",
                'coins' => rand(0, 1000),
            ]);
        }

        // Create demo series
        $japanese = NativeLanguage::where('name', 'Japanese')->first();
        $chinese = NativeLanguage::where('name', 'Chinese')->first();
        $korean = NativeLanguage::where('name', 'Korean')->first();

        $fantasyGenre = Genre::where('name', 'Fantasy')->first();
        $romanceGenre = Genre::where('name', 'Romance')->first();
        $actionGenre = Genre::where('name', 'Action')->first();
        $adventureGenre = Genre::where('name', 'Adventure')->first();

        // Series 1: Fantasy Adventure
        $series1 = Series::create([
            'title' => 'The Legendary Sword Master',
            'alternative_title' => '伝説の剣士',
            'slug' => 'legendary-sword-master',
            'cover_url' => 'https://via.placeholder.com/300x400/4F46E5/FFFFFF?text=Sword+Master',
            'synopsis' => 'A young warrior embarks on an epic journey to become the greatest sword master in the realm. With ancient magic and legendary weapons, he must face powerful enemies and uncover the secrets of his mysterious past.',
            'author' => 'Yamamoto Kenji',
            'artist' => 'Tanaka Hiroshi',
            'rating' => 8.5,
            'status' => 'ongoing',
            'native_language_id' => $japanese->id,
        ]);
        $series1->genres()->attach([$fantasyGenre->id, $actionGenre->id, $adventureGenre->id]);

        // Add chapters for series 1
        for ($i = 1; $i <= 15; $i++) {
            Chapter::create([
                'series_id' => $series1->id,
                'chapter_number' => $i,
                'title' => "Chapter $i: " . $this->getRandomChapterTitle(),
                'content' => $this->getRandomContent(),
                'is_premium' => $i > 5, // First 5 chapters free
                'coin_price' => $i > 5 ? 45 : 0,
            ]);
        }

        // Series 2: Romance
        $series2 = Series::create([
            'title' => 'My Contract Marriage with the CEO',
            'alternative_title' => '总裁的契约婚姻',
            'slug' => 'contract-marriage-ceo',
            'cover_url' => 'https://via.placeholder.com/300x400/EC4899/FFFFFF?text=CEO+Romance',
            'synopsis' => 'A fake marriage contract leads to unexpected love between a struggling artist and a cold-hearted CEO. Will their contract turn into something real?',
            'author' => 'Li Wei Ming',
            'artist' => 'Chen Xiao Yu',
            'rating' => 9.2,
            'status' => 'ongoing',
            'native_language_id' => $chinese->id,
        ]);
        $series2->genres()->attach([$romanceGenre->id]);

        // Add chapters for series 2
        for ($i = 1; $i <= 12; $i++) {
            Chapter::create([
                'series_id' => $series2->id,
                'chapter_number' => $i,
                'title' => "Chapter $i: " . $this->getRandomRomanceTitle(),
                'content' => $this->getRandomContent(),
                'is_premium' => $i > 3,
                'coin_price' => $i > 3 ? 50 : 0,
            ]);
        }

        // Series 3: Korean Fantasy
        $series3 = Series::create([
            'title' => 'Return of the Demon King',
            'alternative_title' => '마왕의 귀환',
            'slug' => 'return-demon-king',
            'cover_url' => 'https://via.placeholder.com/300x400/7C3AED/FFFFFF?text=Demon+King',
            'synopsis' => 'After 1000 years of slumber, the Demon King awakens to find the world has changed. Now he must reclaim his throne while navigating modern society.',
            'author' => 'Park Min Jun',
            'artist' => 'Kim Soo Jin',
            'rating' => 8.8,
            'status' => 'complete',
            'native_language_id' => $korean->id,
        ]);
        $series3->genres()->attach([$fantasyGenre->id, $actionGenre->id]);

        // Add chapters for series 3
        for ($i = 1; $i <= 25; $i++) {
            Chapter::create([
                'series_id' => $series3->id,
                'chapter_number' => $i,
                'title' => "Chapter $i: " . $this->getRandomFantasyTitle(),
                'content' => $this->getRandomContent(),
                'is_premium' => $i > 2,
                'coin_price' => $i > 2 ? 40 : 0,
            ]);
        }
    }

    private function getRandomChapterTitle(): string
    {
        $titles = [
            'The Beginning of Adventure',
            'First Trial',
            'Meeting the Master',
            'Ancient Secrets',
            'The Forbidden Forest',
            'Battle with the Shadow Beast',
            'Awakening Power',
            'The Lost City',
            'Betrayal of Trust',
            'Final Confrontation',
            'New Horizons',
            'The Sacred Blade',
            'Mysterious Ally',
            'Dark Prophecy',
            'Rise of Heroes'
        ];

        return $titles[array_rand($titles)];
    }

    private function getRandomRomanceTitle(): string
    {
        $titles = [
            'Unexpected Meeting',
            'The Contract Begins',
            'Growing Closer',
            'First Kiss',
            'Misunderstanding',
            'Jealousy Strikes',
            'Truth Revealed',
            'Confessions',
            'Family Opposition',
            'Love Prevails',
            'Wedding Bells',
            'Happy Ever After'
        ];

        return $titles[array_rand($titles)];
    }

    private function getRandomFantasyTitle(): string
    {
        $titles = [
            'Awakening from Slumber',
            'The Changed World',
            'Reclaiming Power',
            'Ancient Enemies',
            'New Alliances',
            'The Demon Army',
            'Human Technology',
            'Magic vs Science',
            'The Final Battle',
            'Throne Reclaimed',
            'Peace Treaty',
            'New Era Begins'
        ];

        return $titles[array_rand($titles)];
    }

    private function getRandomContent(): string
    {
        return "This is a sample chapter content. In a real application, this would contain the full chapter text with proper formatting, dialogue, and narrative.\n\nThe content would be much longer and include:\n- Character development\n- Plot progression\n- Detailed descriptions\n- Dialogue between characters\n- Action scenes\n- Emotional moments\n\nFor demonstration purposes, this shortened content shows how the chapter system works in the CMS.";
    }
}
