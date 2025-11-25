<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            GenreSeeder::class,
            NativeLanguageSeeder::class,
            CoinPackageSeeder::class,
            MembershipPackageSeeder::class,
            EbookSeriesSeeder::class,
        ]);

        // Create admin user
        User::factory()->create([
            'name' => 'Admin',
            'display_name' => 'Administrator',
            'uid' => Str::random(10),
            'email' => 'admin@fantl.com',
            'role' => 'admin',
            'coins' => 10000,
        ]);
    }
}
