<?php

namespace Database\Seeders;

use App\Models\CoinPackage;
use Illuminate\Database\Seeder;

class CoinPackageSeeder extends Seeder
{
    public function run(): void
    {
        $packages = [
            ['name' => 'Small Package', 'coin_amount' => 1000, 'price_usd' => 5.00],
            ['name' => 'Medium Package', 'coin_amount' => 2100, 'price_usd' => 10.00],
            ['name' => 'Large Package', 'coin_amount' => 5500, 'price_usd' => 25.00],
            ['name' => 'Mega Package', 'coin_amount' => 11250, 'price_usd' => 50.00],
        ];

        foreach ($packages as $package) {
            CoinPackage::create($package);
        }
    }
}
