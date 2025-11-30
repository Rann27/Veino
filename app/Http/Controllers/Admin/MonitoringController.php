<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Comment;
use App\Models\Reaction;
use App\Models\Series;
use App\Models\Chapter;
use Illuminate\Support\Facades\DB;

class MonitoringController extends Controller
{
    public function index()
    {
        $series = Series::select('id', 'title')->orderBy('title')->get();
        
        return Inertia::render('Admin/Monitoring/Index', [
            'series' => $series,
        ]);
    }

    public function getComments(Request $request)
    {
        $query = Comment::with(['user', 'commentable'])
            ->whereNull('parent_id'); // Only parent comments, not replies

        // Filter by type (series/chapter/all)
        if ($request->filterType === 'series' && $request->filterId) {
            $query->where('commentable_type', Series::class)
                ->where('commentable_id', $request->filterId);
        } elseif ($request->filterType === 'chapter' && $request->filterId) {
            $query->where('commentable_type', Chapter::class)
                ->where('commentable_id', $request->filterId);
        } elseif ($request->filterType === 'series_chapters' && $request->filterId) {
            // All chapters in a series
            $chapterIds = Chapter::where('series_id', $request->filterId)->pluck('id');
            $query->where('commentable_type', Chapter::class)
                ->whereIn('commentable_id', $chapterIds);
        }

        // Search
        if ($request->search) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('content', 'like', "%{$search}%")
                  ->orWhereHas('user', function($userQuery) use ($search) {
                      $userQuery->where('display_name', 'like', "%{$search}%");
                  });
            });
        }

        $comments = $query->orderBy('created_at', 'desc')
            ->paginate(50);

        // Transform data
        $comments->getCollection()->transform(function ($comment) {
            $commentable = $comment->commentable;
            $page = '';
            
            if ($commentable instanceof Series) {
                $page = $commentable->title . ' (Series)';
            } elseif ($commentable instanceof Chapter) {
                $series = $commentable->series;
                $page = $series->title . ' - Ch ' . $commentable->chapter_number;
            }

            return [
                'id' => $comment->id,
                'page' => $page,
                'user_name' => $comment->user->display_name,
                'content' => $comment->content,
                'created_at' => $comment->created_at->format('Y-m-d H:i'),
                'commentable_type' => $comment->commentable_type,
                'commentable_id' => $comment->commentable_id,
            ];
        });

        return response()->json($comments);
    }

    public function deleteComment($id)
    {
        $comment = Comment::findOrFail($id);
        
        // Decrement counter if needed
        $commentable = $comment->commentable;
        if ($commentable instanceof Series && !$comment->parent_id) {
            $commentable->decrement('comments_count');
        }
        
        $comment->delete();

        return response()->json([
            'message' => 'Comment deleted successfully',
        ]);
    }

    public function getReactions(Request $request)
    {
        $query = DB::table('reactions')
            ->select(
                'reactable_type',
                'reactable_id',
                DB::raw('SUM(CASE WHEN type = "like" THEN 1 ELSE 0 END) as like_count'),
                DB::raw('SUM(CASE WHEN type = "love" THEN 1 ELSE 0 END) as love_count'),
                DB::raw('SUM(CASE WHEN type = "haha" THEN 1 ELSE 0 END) as haha_count'),
                DB::raw('SUM(CASE WHEN type = "angry" THEN 1 ELSE 0 END) as angry_count'),
                DB::raw('SUM(CASE WHEN type = "sad" THEN 1 ELSE 0 END) as sad_count'),
                DB::raw('COUNT(*) as total_count')
            )
            ->groupBy('reactable_type', 'reactable_id');

        // Filter by type
        if ($request->filterType === 'series' && $request->filterId) {
            $query->where('reactable_type', Series::class)
                ->where('reactable_id', $request->filterId);
        } elseif ($request->filterType === 'chapter' && $request->filterId) {
            $query->where('reactable_type', Chapter::class)
                ->where('reactable_id', $request->filterId);
        } elseif ($request->filterType === 'series_chapters' && $request->filterId) {
            // All chapters in a series
            $chapterIds = Chapter::where('series_id', $request->filterId)->pluck('id');
            $query->where('reactable_type', Chapter::class)
                ->whereIn('reactable_id', $chapterIds);
        }

        $reactions = $query->get();

        // Transform data
        $transformedReactions = $reactions->map(function ($reaction) {
            $page = '';
            
            if ($reaction->reactable_type === 'App\\Models\\Series') {
                $series = Series::find($reaction->reactable_id);
                $page = $series ? $series->title . ' (Series)' : 'Unknown';
            } elseif ($reaction->reactable_type === 'App\\Models\\Chapter') {
                $chapter = Chapter::with('series')->find($reaction->reactable_id);
                if ($chapter) {
                    $page = $chapter->series->title . ' - Ch ' . $chapter->chapter_number;
                } else {
                    $page = 'Unknown';
                }
            }

            return [
                'page' => $page,
                'like_count' => $reaction->like_count,
                'love_count' => $reaction->love_count,
                'haha_count' => $reaction->haha_count,
                'angry_count' => $reaction->angry_count,
                'sad_count' => $reaction->sad_count,
                'total_count' => $reaction->total_count,
            ];
        });

        return response()->json($transformedReactions);
    }

    public function getViews(Request $request)
    {
        $results = [];

        // Filter by type
        if ($request->filterType === 'series' && $request->filterId) {
            // Get specific series views
            $series = Series::find($request->filterId);
            if ($series) {
                $results[] = [
                    'page' => $series->title . ' (Series Page)',
                    'views' => $series->views,
                    'type' => 'series',
                ];
            }
        } elseif ($request->filterType === 'chapter' && $request->filterId) {
            // Get specific chapter views
            $chapter = Chapter::with('series')->find($request->filterId);
            if ($chapter) {
                $page = $chapter->series->title . ' - Ch ' . $chapter->chapter_number;
                if ($chapter->title) {
                    $page .= ': ' . $chapter->title;
                }
                $results[] = [
                    'page' => $page,
                    'views' => $chapter->views,
                    'type' => 'chapter',
                ];
            }
        } elseif ($request->filterType === 'series_chapters' && $request->filterId) {
            // Get all chapters in a series
            $chapters = Chapter::where('series_id', $request->filterId)
                ->with('series')
                ->orderBy('views', 'desc')
                ->get();
            
            foreach ($chapters as $chapter) {
                $page = $chapter->series->title . ' - Ch ' . $chapter->chapter_number;
                if ($chapter->title) {
                    $page .= ': ' . $chapter->title;
                }
                $results[] = [
                    'page' => $page,
                    'views' => $chapter->views,
                    'type' => 'chapter',
                ];
            }
        } else {
            // Get all series and chapters sorted by views
            $seriesViews = Series::select('id', 'title', 'views')
                ->orderBy('views', 'desc')
                ->limit(20)
                ->get()
                ->map(function ($series) {
                    return [
                        'page' => $series->title . ' (Series Page)',
                        'views' => $series->views,
                        'type' => 'series',
                    ];
                });

            $chapterViews = Chapter::with('series')
                ->select('id', 'series_id', 'chapter_number', 'title', 'views')
                ->orderBy('views', 'desc')
                ->limit(30)
                ->get()
                ->map(function ($chapter) {
                    $page = $chapter->series->title . ' - Ch ' . $chapter->chapter_number;
                    if ($chapter->title) {
                        $page .= ': ' . $chapter->title;
                    }
                    return [
                        'page' => $page,
                        'views' => $chapter->views,
                        'type' => 'chapter',
                    ];
                });

            // Merge and sort by views
            $results = $seriesViews->concat($chapterViews)
                ->sortByDesc('views')
                ->values()
                ->all();
        }

        return response()->json($results);
    }

    public function getChapters($seriesId)
    {
        $chapters = Chapter::where('series_id', $seriesId)
            ->select('id', 'chapter_number', 'title')
            ->orderBy('chapter_number')
            ->get()
            ->map(function ($chapter) {
                return [
                    'id' => $chapter->id,
                    'label' => 'Ch ' . $chapter->chapter_number . ($chapter->title ? ': ' . $chapter->title : ''),
                ];
            });

        return response()->json($chapters);
    }
}
