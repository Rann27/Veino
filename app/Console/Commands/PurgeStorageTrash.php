<?php

namespace App\Console\Commands;

use App\Models\StorageTrash;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;

class PurgeStorageTrash extends Command
{
    protected $signature = 'storage:purge-trash';

    protected $description = 'Permanently delete quarantined files past their retention window';

    public function handle(): int
    {
        $expired = StorageTrash::expired()->get();

        if ($expired->isEmpty()) {
            $this->info('✓ Nothing to purge.');

            return self::SUCCESS;
        }

        $freed = 0;

        foreach ($expired as $entry) {
            Storage::disk('local')->delete($entry->trash_path);
            $freed += $entry->size;
            $entry->delete();
        }

        $this->info(sprintf(
            '✓ Purged %d file(s) older than %d days, freeing %s MB',
            $expired->count(),
            StorageTrash::RETENTION_DAYS,
            round($freed / 1048576, 2)
        ));

        return self::SUCCESS;
    }
}
