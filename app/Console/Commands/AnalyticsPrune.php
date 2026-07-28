<?php

namespace App\Console\Commands;

use App\Models\AnalyticsDaily;
use App\Models\AnalyticsMonthly;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

/**
 * Deletes raw page views older than the retention window. Only removes days
 * that already exist in analytics_daily, so nothing is lost silently.
 */
class AnalyticsPrune extends Command
{
    protected $signature = 'analytics:prune {--days= : Override the configured retention window}';

    protected $description = 'Delete raw page views older than the retention window';

    public function handle(): int
    {
        $days = (int) ($this->option('days') ?: config('analytics.retention_days', 120));
        $cutoff = now()->subDays($days)->startOfDay();

        $oldest = DB::table('page_views')->min('created_at');

        if (! $oldest || $oldest >= $cutoff) {
            $this->info('Nothing to prune.');

            return self::SUCCESS;
        }

        // Make sure everything about to be deleted has been rolled up.
        $this->call('analytics:rollup', ['--all' => true]);

        $expiring = DB::table('page_views')
            ->where('created_at', '<', $cutoff)
            ->selectRaw('DATE(created_at) as d')
            ->distinct()
            ->pluck('d');

        $unrolled = $expiring->reject(fn ($d) => AnalyticsDaily::whereDate('date', $d)->exists());

        if ($unrolled->isNotEmpty()) {
            $this->error('Aborting: '.$unrolled->count().' day(s) are not rolled up yet.');

            return self::FAILURE;
        }

        // Monthly rows hold the only recoverable unique-visitor count once the
        // raw rows are gone, so never prune a month that has no archive row.
        $unarchived = $expiring
            ->map(fn ($d) => substr((string) $d, 0, 7))
            ->unique()
            ->reject(fn ($m) => AnalyticsMonthly::where('month', $m)->exists());

        if ($unarchived->isNotEmpty()) {
            $this->error('Aborting: month(s) not archived yet: '.$unarchived->implode(', '));

            return self::FAILURE;
        }

        $total = 0;
        do {
            $deleted = DB::table('page_views')->where('created_at', '<', $cutoff)->limit(5000)->delete();
            $total += $deleted;
        } while ($deleted > 0);

        $this->info("Pruned {$total} raw page view(s) older than {$days} days.");

        return self::SUCCESS;
    }
}
