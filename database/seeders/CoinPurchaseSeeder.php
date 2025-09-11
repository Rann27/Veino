<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\CoinPurchase;
use App\Models\User;
use App\Models\CoinPackage;
use Carbon\Carbon;

class CoinPurchaseSeeder extends Seeder
{
    /**
     * Run the database seeder.
     */
    public function run(): void
    {
        $users = User::all();
        $coinPackages = CoinPackage::all();

        if ($users->isEmpty() || $coinPackages->isEmpty()) {
            $this->command->warn('No users or coin packages found. Please run user and coin package seeders first.');
            return;
        }

        // Create some sample coin purchases
        $statuses = ['completed', 'pending', 'failed'];
        $paymentMethods = ['paypal', 'stripe', 'bank_transfer'];

        for ($i = 0; $i < 15; $i++) {
            $coinPackage = $coinPackages->random();
            $user = $users->random();
            
            CoinPurchase::create([
                'user_id' => $user->id,
                'coin_package_id' => $coinPackage->id,
                'coins_amount' => $coinPackage->coin_amount,
                'price_usd' => $coinPackage->price_usd,
                'payment_method' => $paymentMethods[array_rand($paymentMethods)],
                'transaction_id' => 'txn_' . uniqid(),
                'status' => $statuses[array_rand($statuses)],
                'created_at' => Carbon::now()->subDays(rand(1, 30)),
            ]);
        }

        $this->command->info('Created 15 sample coin purchases.');
    }
}
