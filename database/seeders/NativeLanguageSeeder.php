<?php

namespace Database\Seeders;

use App\Models\NativeLanguage;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class NativeLanguageSeeder extends Seeder
{
    public function run(): void
    {
        $languages = ['Chinese', 'Japanese', 'Korean'];

        foreach ($languages as $language) {
            NativeLanguage::create([
                'name' => $language,
                'slug' => Str::slug($language),
            ]);
        }
    }
}
