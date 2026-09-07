<?php

use App\Models\MembershipPackage;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Every tier column is an enum, so the new value has to be admitted on
        // all of them before any row can use it — miss one and the purchase
        // still fails, just later and with a truncation warning. Raw statements
        // because Doctrine cannot alter enums.
        DB::statement("ALTER TABLE users MODIFY membership_tier ENUM('basic','premium','exclusive') NOT NULL DEFAULT 'basic'");
        DB::statement("ALTER TABLE membership_packages MODIFY tier ENUM('premium','exclusive') NOT NULL DEFAULT 'premium'");
        DB::statement("ALTER TABLE membership_history MODIFY tier ENUM('basic','premium','exclusive') NOT NULL DEFAULT 'premium'");
        DB::statement("ALTER TABLE membership_purchases MODIFY tier ENUM('premium','exclusive') NOT NULL");

        MembershipPackage::updateOrCreate(
            ['tier' => 'exclusive', 'duration_days' => 30],
            [
                'name' => '1 Month Premium Exclusive',
                'price_usd' => 10.00,
                'gimmick_price_usd' => 20.00,
                'coin_price' => 999,
                'gimmick_price' => 1998,
                'features' => [
                    'Everything in Premium',
                    'Every EPUB volume, free to download',
                    'Unlock all premium chapters',
                    'Completely ad-free reading',
                ],
                'discount_percentage' => 50,
                'is_active' => true,
                // Sorted after every Premium plan so it reads as the tier above.
                'sort_order' => 99,
            ]
        );
    }

    public function down(): void
    {
        MembershipPackage::where('tier', 'exclusive')->delete();

        // Any row still on the tier would violate the narrowed enum, so demote
        // them all first — history included, or the ALTER truncates it silently.
        DB::table('users')->where('membership_tier', 'exclusive')->update([
            'membership_tier' => 'premium',
        ]);
        DB::table('membership_history')->where('tier', 'exclusive')->update(['tier' => 'premium']);
        DB::table('membership_purchases')->where('tier', 'exclusive')->update(['tier' => 'premium']);

        DB::statement("ALTER TABLE users MODIFY membership_tier ENUM('basic','premium') NOT NULL DEFAULT 'basic'");
        DB::statement("ALTER TABLE membership_packages MODIFY tier ENUM('premium') NOT NULL DEFAULT 'premium'");
        DB::statement("ALTER TABLE membership_history MODIFY tier ENUM('basic','premium') NOT NULL DEFAULT 'premium'");
        DB::statement("ALTER TABLE membership_purchases MODIFY tier ENUM('premium') NOT NULL");
    }
};
