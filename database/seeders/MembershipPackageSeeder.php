<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\MembershipPackage;

class MembershipPackageSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $packages = [
            // 1 Month Premium
            [
                'name' => '1 Month Premium',
                'tier' => 'premium',
                'price_usd' => 7.95,
                'duration_days' => 30,
                'features' => [
                    'unlock_premium_chapters' => true,
                    'ad_free' => true,
                ],
                'discount_percentage' => 21, // $10 -> $7.95
                'is_active' => true,
                'sort_order' => 1,
            ],
            
            // 3 Months Premium
            [
                'name' => '3 Months Premium',
                'tier' => 'premium',
                'price_usd' => 20.99,
                'duration_days' => 90,
                'features' => [
                    'unlock_premium_chapters' => true,
                    'ad_free' => true,
                ],
                'discount_percentage' => 30, // $30 -> $20.99
                'is_active' => true,
                'sort_order' => 2,
            ],
            
            // 6 Months Premium
            [
                'name' => '6 Months Premium',
                'tier' => 'premium',
                'price_usd' => 39.95,
                'duration_days' => 180,
                'features' => [
                    'unlock_premium_chapters' => true,
                    'ad_free' => true,
                ],
                'discount_percentage' => 33, // $60 -> $39.95
                'is_active' => true,
                'sort_order' => 3,
            ],
            
            // 12 Months Premium (Best Value)
            [
                'name' => '12 Months Premium',
                'tier' => 'premium',
                'price_usd' => 79.95,
                'duration_days' => 365,
                'features' => [
                    'unlock_premium_chapters' => true,
                    'ad_free' => true,
                ],
                'discount_percentage' => 33, // $120 -> $79.95
                'is_active' => true,
                'sort_order' => 4,
            ],
        ];

        foreach ($packages as $package) {
            MembershipPackage::create($package);
        }

        $this->command->info('Membership packages seeded successfully!');
    }
}
