<?php

namespace Database\Seeders;

use App\Models\EbookSeries;
use App\Models\EbookItem;
use App\Models\Genre;
use Illuminate\Database\Seeder;

class EbookSeriesSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $genres = Genre::limit(3)->get();

        // Sample Ebook Series 1
        $series1 = EbookSeries::create([
            'title' => 'The Legendary Moonlight Sculptor',
            'alternative_title' => 'Dalbic Jogaksa',
            'synopsis' => 'The man forsaken by the world, the man a slave to money and the man known as the legendary God of War in the highly popular MMORPG Continent of Magic. With the coming of age, he decides to say goodbye, but the feeble attempt to earn a little something for his time and effort ripples into an effect none could ever have imagined.',
            'author' => 'Nam Heesung',
            'artist' => 'Lee Doyoung',
        ]);
        $series1->genres()->attach($genres->pluck('id'));

        // Add items (volumes)
        for ($i = 1; $i <= 5; $i++) {
            EbookItem::create([
                'ebook_series_id' => $series1->id,
                'title' => "Volume {$i}",
                'summary' => "Volume {$i} of The Legendary Moonlight Sculptor. Continue the epic adventure in the virtual world!",
                'price_coins' => 500 + ($i * 50),
                'order' => $i,
            ]);
        }

        // Sample Ebook Series 2
        $series2 = EbookSeries::create([
            'title' => 'Overlord',
            'alternative_title' => 'オーバーロード',
            'synopsis' => 'The final hour of the popular virtual reality game Yggdrasil has come. However, Momonga, a powerful wizard and master of the dark guild Ainz Ooal Gown, decides to spend his last few moments in the game as the servers begin to shut down.',
            'author' => 'Kugane Maruyama',
            'artist' => 'so-bin',
        ]);
        $series2->genres()->attach($genres->pluck('id'));

        // Add items
        for ($i = 1; $i <= 3; $i++) {
            EbookItem::create([
                'ebook_series_id' => $series2->id,
                'title' => "Volume {$i}",
                'summary' => "Volume {$i} of Overlord. The undead overlord continues his conquest!",
                'price_coins' => 600 + ($i * 50),
                'order' => $i,
            ]);
        }

        // Sample Ebook Series 3
        $series3 = EbookSeries::create([
            'title' => 'Solo Leveling',
            'alternative_title' => '나 혼자만 레벨업',
            'synopsis' => 'Ten years ago, "the Gate" appeared and connected the real world with the realm of magic and monsters. Ordinary people received superhuman powers and became known as "Hunters." Sung Jinwoo is the weakest of the E-rank Hunters—in other words, the weakest of the weak.',
            'author' => 'Chugong',
            'artist' => 'DUBU (REDICE Studio)',
        ]);
        $series3->genres()->attach($genres->pluck('id'));

        // Add items with varying prices
        $prices = [800, 850, 900, 950, 1000];
        for ($i = 1; $i <= 5; $i++) {
            EbookItem::create([
                'ebook_series_id' => $series3->id,
                'title' => "Volume {$i}",
                'summary' => "Volume {$i} of Solo Leveling. Witness Jinwoo's incredible journey from the weakest to the strongest!",
                'price_coins' => $prices[$i - 1],
                'order' => $i,
            ]);
        }
    }
}
