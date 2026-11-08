<?php

namespace App\Console\Commands;

use App\Services\AutoVoucherService;
use Illuminate\Console\Command;

class RotateAutoVouchers extends Command
{
    protected $signature = 'vouchers:auto';

    protected $description = 'Create the current daily/weekly/monthly vouchers and switch off expired ones';

    public function handle(AutoVoucherService $vouchers): int
    {
        $created = $vouchers->ensureCurrent();
        $revoked = $vouchers->revokeExpired();

        $this->info("Created {$created}, revoked {$revoked}.");

        return self::SUCCESS;
    }
}
