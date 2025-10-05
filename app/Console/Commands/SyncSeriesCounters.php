<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Series;
use App\Models\Bookmark;
use App\Models\Comment;

class SyncSeriesCounters extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'series:sync-counters';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Sync bookmarks_count and comments_count for all series';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Syncing series counters...');
        
        $series = Series::all();
        $bar = $this->output->createProgressBar($series->count());
        
        foreach ($series as $s) {
            // Count bookmarks
            $bookmarksCount = Bookmark::where('series_id', $s->id)->count();
            
            // Count comments (only parent comments, not replies)
            $commentsCount = Comment::where('commentable_type', Series::class)
                ->where('commentable_id', $s->id)
                ->whereNull('parent_id')
                ->count();
            
            // Update counters
            $s->update([
                'bookmarks_count' => $bookmarksCount,
                'comments_count' => $commentsCount,
            ]);
            
            $bar->advance();
        }
        
        $bar->finish();
        $this->newLine();
        $this->info('Series counters synced successfully!');
        
        return 0;
    }
}
