<?php

namespace App\Console\Commands;

use App\Models\CoinPurchase;
use App\Models\MembershipHistory;
use Illuminate\Console\Command;

class ExpireStalePayments extends Command
{
    protected $signature = 'payments:expire';

    protected $description = 'Cancel pending coin purchases and memberships that have passed their expiry window';

    public function handle(): int
    {
        // Cancel purchases that have passed their explicit expiry time
        $byExpiry = CoinPurchase::where('status', 'pending')
            ->whereNotNull('expires_at')
            ->where('expires_at', '<', now())
            ->update(['status' => 'cancelled']);

        // Cancel legacy pending records (before expires_at existed) — use 3h as safe cutoff
        $legacy = CoinPurchase::where('status', 'pending')
            ->whereNull('expires_at')
            ->where('created_at', '<', now()->subHours(3))
            ->update(['status' => 'cancelled']);

        // Membership: cancel by payment_expires_at
        $memByExpiry = MembershipHistory::whereIn('payment_method', ['paypal', 'oxapay', 'cryptomus'])
            ->where('status', 'pending')
            ->whereNotNull('payment_expires_at')
            ->where('payment_expires_at', '<', now())
            ->update(['status' => 'cancelled']);

        // Membership: cancel legacy records (before payment_expires_at existed) — 3h safe cutoff
        $memLegacy = MembershipHistory::whereIn('payment_method', ['paypal', 'oxapay', 'cryptomus'])
            ->where('status', 'pending')
            ->whereNull('payment_expires_at')
            ->where('created_at', '<', now()->subHours(3))
            ->update(['status' => 'cancelled']);

        $coinTotal = $byExpiry + $legacy;
        $memTotal  = $memByExpiry + $memLegacy;
        $total     = $coinTotal + $memTotal;

        if ($total > 0) {
            $this->info("✓ Cancelled {$coinTotal} coin purchase(s) + {$memTotal} membership purchase(s) = {$total} total");
        } else {
            $this->info('✓ No expired pending purchases found');
        }

        return Command::SUCCESS;
    }
}
