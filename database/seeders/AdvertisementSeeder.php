<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class AdvertisementSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $now = Carbon::now();
        $oneYearLater = Carbon::now()->addYear();

        $advertisements = [
            // Premium Membership Promotions - Interstitial Ads
            // Note: Images need to be uploaded via admin panel
            [
                'advertiser_name' => 'Veino Premium - Ad Free Experience',
                'unit_type' => 'interstitial',
                'file_path_desktop' => null,
                'file_path_mobile' => null,
                'link_url' => '/',
                'link_caption' => null,
                'expired_at' => $oneYearLater,
                'clicks' => 0,
                'impressions' => 0,
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'advertiser_name' => 'Veino Premium - Exclusive Content',
                'unit_type' => 'interstitial',
                'file_path_desktop' => null,
                'file_path_mobile' => null,
                'link_url' => '/',
                'link_caption' => null,
                'expired_at' => $oneYearLater,
                'clicks' => 0,
                'impressions' => 0,
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'advertiser_name' => 'Veino Premium - Unlock All Chapters',
                'unit_type' => 'interstitial',
                'file_path_desktop' => null,
                'file_path_mobile' => null,
                'link_url' => '/',
                'link_caption' => null,
                'expired_at' => $oneYearLater,
                'clicks' => 0,
                'impressions' => 0,
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],

            // In-Text Link Ads - Premium Promotions
            [
                'advertiser_name' => 'Veino Premium',
                'unit_type' => 'in_text_link',
                'file_path_desktop' => null,
                'file_path_mobile' => null,
                'link_url' => '/',
                'link_caption' => 'Upgrade to Premium - Enjoy Ad-Free Reading Experience',
                'expired_at' => $oneYearLater,
                'clicks' => 0,
                'impressions' => 0,
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'advertiser_name' => 'Veino Premium',
                'unit_type' => 'in_text_link',
                'file_path_desktop' => null,
                'file_path_mobile' => null,
                'link_url' => '/',
                'link_caption' => 'Get Premium Access - Read Without Interruptions',
                'expired_at' => $oneYearLater,
                'clicks' => 0,
                'impressions' => 0,
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'advertiser_name' => 'Veino Premium',
                'unit_type' => 'in_text_link',
                'file_path_desktop' => null,
                'file_path_mobile' => null,
                'link_url' => '/',
                'link_caption' => 'Join Premium - Unlock All Chapters & Remove Ads',
                'expired_at' => $oneYearLater,
                'clicks' => 0,
                'impressions' => 0,
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'advertiser_name' => 'Veino Premium',
                'unit_type' => 'in_text_link',
                'file_path_desktop' => null,
                'file_path_mobile' => null,
                'link_url' => '/',
                'link_caption' => 'Premium Members Get Exclusive Benefits - Learn More',
                'expired_at' => $oneYearLater,
                'clicks' => 0,
                'impressions' => 0,
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'advertiser_name' => 'Veino Premium',
                'unit_type' => 'in_text_link',
                'file_path_desktop' => null,
                'file_path_mobile' => null,
                'link_url' => '/',
                'link_caption' => 'Support Your Favorite Authors - Go Premium Today',
                'expired_at' => $oneYearLater,
                'clicks' => 0,
                'impressions' => 0,
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],

            // In-Text Link Ads - General Advertise Offers
            [
                'advertiser_name' => 'Veino Advertising',
                'unit_type' => 'in_text_link',
                'file_path_desktop' => null,
                'file_path_mobile' => null,
                'link_url' => '/',
                'link_caption' => 'Advertise with Us - Reach Thousands of Engaged Readers',
                'expired_at' => $oneYearLater,
                'clicks' => 0,
                'impressions' => 0,
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'advertiser_name' => 'Veino Advertising',
                'unit_type' => 'in_text_link',
                'file_path_desktop' => null,
                'file_path_mobile' => null,
                'link_url' => '/',
                'link_caption' => 'Promote Your Brand Here - Connect with Our Community',
                'expired_at' => $oneYearLater,
                'clicks' => 0,
                'impressions' => 0,
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'advertiser_name' => 'Veino Advertising',
                'unit_type' => 'in_text_link',
                'file_path_desktop' => null,
                'file_path_mobile' => null,
                'link_url' => '/',
                'link_caption' => 'Advertising Opportunities Available - Contact Us Today',
                'expired_at' => $oneYearLater,
                'clicks' => 0,
                'impressions' => 0,
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'advertiser_name' => 'Veino Advertising',
                'unit_type' => 'in_text_link',
                'file_path_desktop' => null,
                'file_path_mobile' => null,
                'link_url' => '/',
                'link_caption' => 'Get Noticed - Advertise Your Services on Veino',
                'expired_at' => $oneYearLater,
                'clicks' => 0,
                'impressions' => 0,
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'advertiser_name' => 'Veino Advertising',
                'unit_type' => 'in_text_link',
                'file_path_desktop' => null,
                'file_path_mobile' => null,
                'link_url' => '/',
                'link_caption' => 'Grow Your Business - Advertise with Veino Platform',
                'expired_at' => $oneYearLater,
                'clicks' => 0,
                'impressions' => 0,
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],

            // Banner Ads (for future use)
            [
                'advertiser_name' => 'Veino Premium Banner',
                'unit_type' => 'banner',
                'file_path_desktop' => null,
                'file_path_mobile' => null,
                'link_url' => '/',
                'link_caption' => null,
                'expired_at' => $oneYearLater,
                'clicks' => 0,
                'impressions' => 0,
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'advertiser_name' => 'Veino Advertising Banner',
                'unit_type' => 'banner',
                'file_path_desktop' => null,
                'file_path_mobile' => null,
                'link_url' => '/',
                'link_caption' => null,
                'expired_at' => $oneYearLater,
                'clicks' => 0,
                'impressions' => 0,
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],
        ];

        DB::table('advertisements')->insert($advertisements);

        $this->command->info('✅ Advertisement seeder completed! Created 15 advertisements.');
        $this->command->info('   - 3 Interstitial ads (Premium promotions - images to be uploaded via admin)');
        $this->command->info('   - 10 In-text link ads (5 Premium + 5 Advertise offers)');
        $this->command->info('   - 2 Banner ads (for future use - images to be uploaded via admin)');
        $this->command->warn('⚠️  Note: Interstitial and banner images need to be uploaded via admin panel.');
    }
}
