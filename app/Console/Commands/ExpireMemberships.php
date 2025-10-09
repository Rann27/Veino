<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\MembershipService;

class ExpireMemberships extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'memberships:expire';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Expire all memberships that have passed their expiration date';

    /**
     * Execute the console command.
     */
    public function handle(MembershipService $membershipService)
    {
        $this->info('Checking for expired memberships...');
        
        $count = $membershipService->expireExpiredMemberships();
        
        if ($count > 0) {
            $this->info("✓ Expired {$count} membership(s)");
        } else {
            $this->info('✓ No expired memberships found');
        }
        
        return Command::SUCCESS;
    }
}
