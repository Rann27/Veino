<?php

namespace Database\Seeders;

use App\Models\CoinPackage;
use Illuminate\Database\Seeder;

class CoinPackageSeeder extends Seeder
{
    public function run(): void
    {
        $packages = [
            ['name' => 'S Package', 'coin_amount' => 600, 'bonus_premium_days' => 1, 'price_usd' => 6.00],
            ['name' => 'M Package', 'coin_amount' => 1050, 'bonus_premium_days' => 3, 'price_usd' => 10.00],
            ['name' => 'L Package', 'coin_amount' => 2125, 'bonus_premium_days' => 7, 'price_usd' => 20.00],
            ['name' => 'XL Package', 'coin_amount' => 3215, 'bonus_premium_days' => 14, 'price_usd' => 30.00],
            ['name' => 'XXL Package', 'coin_amount' => 5500, 'bonus_premium_days' => 30, 'price_usd' => 50.00],
            ['name' => 'XXXL Package', 'coin_amount' => 11250, 'bonus_premium_days' => 60, 'price_usd' => 100.00],
        ];

        foreach ($packages as $package) {
            CoinPackage::create($package);
        }
    }
}
