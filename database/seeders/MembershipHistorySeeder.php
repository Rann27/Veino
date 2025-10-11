<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\MembershipHistory;
use App\Models\User;
use App\Models\MembershipPackage;
use Carbon\Carbon;

class MembershipHistorySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $users = User::all();
        $packages = MembershipPackage::all();

        if ($users->isEmpty() || $packages->isEmpty()) {
            $this->command->warn('No users or membership packages found. Please run user and membership package seeders first.');
            return;
        }

        $statuses = ['completed', 'pending', 'failed'];
        $paymentMethods = ['paypal', 'cryptomus'];

        // Create 15 sample membership histories
        for ($i = 0; $i < 15; $i++) {
            $user = $users->random();
            $package = $packages->random();
            $status = $statuses[array_rand($statuses)];
            $paymentMethod = $paymentMethods[array_rand($paymentMethods)];
            
            // Generate invoice number
            $invoiceNumber = 'INV-' . strtoupper(uniqid());

            MembershipHistory::create([
                'user_id' => $user->id,
                'membership_package_id' => $package->id,
                'invoice_number' => $invoiceNumber,
                'tier' => $package->tier,
                'duration_days' => $package->duration_days,
                'amount_usd' => $package->price_usd,
                'payment_method' => $paymentMethod,
                'status' => $status,
                'created_at' => Carbon::now()->subDays(rand(1, 30)),
                'updated_at' => Carbon::now()->subDays(rand(0, 10)),
            ]);
        }

        $this->command->info('Membership history seeded successfully with 15 sample records!');
    }
}
