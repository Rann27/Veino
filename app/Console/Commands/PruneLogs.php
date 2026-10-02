<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

/**
 * Trims the raw logs that grow with traffic and are never read once cold.
 *
 * Only tables where a row is a *record of an event* belong here. Anything a
 * reader would notice the loss of — reading history, bookmarks, purchases,
 * membership records — is theirs, not ours to age out, however old it gets.
 *
 * Deliberately absent: user_login_ips. It holds one row per account and
 * address rather than one per sign-in, so it grows with the number of people
 * rather than with traffic, and it is the long tail that makes it useful —
 * an address first seen four months ago is exactly the evidence that ties two
 * accounts together.
 */
class PruneLogs extends Command
{
    protected $signature = 'logs:prune
                            {--days=90 : Keep this many days}
                            {--dry-run : Report what would go, delete nothing}';

    protected $description = 'Delete raw event logs past the retention window';

    /** Deleted in batches so a large table is never locked in one statement. */
    private const CHUNK = 5000;

    /**
     * table => [date column, what it holds]
     */
    private const TABLES = [
        'chapter_unlock_attempts' => ['created_at', 'free-unlock attempts'],
        // A visitor not seen within the window is aged out. The daily and
        // monthly rollups are already written, so no reporting is lost; the
        // only effect is that someone returning after that long counts as new,
        // which is arguably what they are.
        'analytics_visitors' => ['last_seen_at', 'analytics visitors'],
    ];

    public function handle(): int
    {
        $days = max(1, (int) $this->option('days'));
        $cutoff = now()->subDays($days)->startOfDay();
        $dry = (bool) $this->option('dry-run');

        $this->line("Retention: {$days} days (cutoff {$cutoff->toDateString()})".($dry ? ' — dry run' : ''));

        $grand = 0;

        foreach (self::TABLES as $table => [$column, $label]) {
            if (! DB::getSchemaBuilder()->hasTable($table)) {
                continue;
            }

            $stale = DB::table($table)->where($column, '<', $cutoff);
            $count = (clone $stale)->count();
            $kept = DB::table($table)->where($column, '>=', $cutoff)->count();

            if ($count === 0) {
                $this->line(sprintf('  %-26s nothing to remove (%d kept)', $label, $kept));

                continue;
            }

            if ($dry) {
                $this->line(sprintf('  %-26s would remove %d, keep %d', $label, $count, $kept));
                $grand += $count;

                continue;
            }

            $removed = 0;

            do {
                $batch = DB::table($table)->where($column, '<', $cutoff)->limit(self::CHUNK)->delete();
                $removed += $batch;
            } while ($batch > 0);

            $this->line(sprintf('  %-26s removed %d, kept %d', $label, $removed, $kept));
            $grand += $removed;
        }

        $this->info($dry ? "Would remove {$grand} row(s)." : "Removed {$grand} row(s).");

        return self::SUCCESS;
    }
}
