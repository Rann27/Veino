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
        // Clear existing packages (using delete instead of truncate due to foreign key)
        MembershipPackage::query()->delete();
        
        $packages = [
            // 1 Month Premium
            [
                'name' => '1 Month Premium',
                'tier' => 'premium',
                'gimmick_price' => 10.00,
                'price_usd' => 5.49,
                'coin_price' => 549,
                'duration_days' => 30,
                'features' => [
                    'unlock_premium_chapters' => true,
                    'ad_free' => true,
                ],
                'discount_percentage' => 45,
                'is_active' => true,
                'sort_order' => 1,
            ],
            
            // 3 Months Premium
            [
                'name' => '3 Months Premium',
                'tier' => 'premium',
                'gimmick_price' => 45.00,
                'price_usd' => 15.49,
                'coin_price' => 1549,
                'duration_days' => 90,
                'features' => [
                    'unlock_premium_chapters' => true,
                    'ad_free' => true,
                ],
                'discount_percentage' => 66,
                'is_active' => true,
                'sort_order' => 2,
            ],
            
            // 6 Months Premium
            [
                'name' => '6 Months Premium',
                'tier' => 'premium',
                'gimmick_price' => 90.00,
                'price_usd' => 28.99,
                'coin_price' => 2899,
                'duration_days' => 180,
                'features' => [
                    'unlock_premium_chapters' => true,
                    'ad_free' => true,
                ],
                'discount_percentage' => 68,
                'is_active' => true,
                'sort_order' => 3,
            ],
            
            // 12 Months Premium (Best Value)
            [
                'name' => '12 Months Premium',
                'tier' => 'premium',
                'gimmick_price' => 180.00,
                'price_usd' => 54.49,
                'coin_price' => 5449,
                'duration_days' => 365,
                'features' => [
                    'unlock_premium_chapters' => true,
                    'ad_free' => true,
                ],
                'discount_percentage' => 70,
                'is_active' => true,
                'sort_order' => 4,
            ],
        ];

        foreach ($packages as $package) {
            MembershipPackage::create($package);
        }

        $this->command->info('✅ Membership packages seeded successfully!');
    }
}
