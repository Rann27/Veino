<?php

namespace Database\Seeders;

use App\Models\Genre;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class GenreSeeder extends Seeder
{
    public function run(): void
    {
        $genres = [
            'Action', 'Adult', 'Adventure', 'Comedy', 'Drama', 'Ecchi', 'Fantasy', 
            'Gender Bender', 'Harem', 'Historical', 'Horror', 'Josei', 'Martial Arts', 
            'Mature', 'Mecha', 'Mystery', 'Psychological', 'Romance', 'School Life', 
            'Sci-fi', 'Seinen', 'Shoujo', 'Shoujo Ai', 'Shounen', 'Shounen Ai', 
            'Slice of Life', 'Smut', 'Sports', 'Supernatural', 'Tragedy', 'Wuxia', 
            'Xianxia', 'Xuanhuan', 'Yaoi', 'Yuri'
        ];

        foreach ($genres as $genre) {
            Genre::create([
                'name' => $genre,
                'slug' => Str::slug($genre),
            ]);
        }
    }
}
