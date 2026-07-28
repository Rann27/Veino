<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Chapter;
use App\Models\Comment;
use App\Models\Series;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class MonitoringController extends Controller
{
    private const REACTION_TYPES = ['like', 'love', 'haha', 'angry', 'sad'];

    public function index(): Response
    {
        return Inertia::render('Admin/Monitoring/Index', [
            'series' => Series::select('id', 'title')->orderBy('title')->get(),
            'stats' => $this->buildStats(),
        ]);
    }

    /** Headline counters for the summary tiles. */
    public function stats(): JsonResponse
    {
        return response()->json($this->buildStats());
    }

    private function buildStats(): array
    {
        $comments = DB::table('comments')
            ->whereNull('deleted_at')
            ->selectRaw('COUNT(*) as total')
            ->selectRaw('SUM(CASE WHEN parent_id IS NULL THEN 1 ELSE 0 END) as threads')
            ->selectRaw('SUM(CASE WHEN parent_id IS NOT NULL THEN 1 ELSE 0 END) as replies')
            ->selectRaw('COUNT(DISTINCT user_id) as commenters')
            ->selectRaw('SUM(CASE WHEN created_at >= ? THEN 1 ELSE 0 END) as today', [now()->startOfDay()])
            ->selectRaw('SUM(CASE WHEN created_at >= ? THEN 1 ELSE 0 END) as week', [now()->subDays(7)])
            ->first();

        $reactions = DB::table('reactions')
            ->selectRaw('COUNT(*) as total')
            ->selectRaw('COUNT(DISTINCT CONCAT(reactable_type, reactable_id)) as pages')
            ->first();

        $byType = DB::table('reactions')
            ->select('type', DB::raw('COUNT(*) as c'))
            ->groupBy('type')
            ->pluck('c', 'type');

        return [
            'comments' => [
                'total' => (int) ($comments->total ?? 0),
                'threads' => (int) ($comments->threads ?? 0),
                'replies' => (int) ($comments->replies ?? 0),
                'commenters' => (int) ($comments->commenters ?? 0),
                'today' => (int) ($comments->today ?? 0),
                'week' => (int) ($comments->week ?? 0),
            ],
            'reactions' => [
                'total' => (int) ($reactions->total ?? 0),
                'pages' => (int) ($reactions->pages ?? 0),
                'by_type' => collect(self::REACTION_TYPES)
                    ->mapWithKeys(fn ($t) => [$t => (int) ($byType[$t] ?? 0)])
                    ->all(),
            ],
            'views' => [
                'series' => (int) DB::table('series')->sum('views'),
                'chapters' => (int) DB::table('chapters')->sum('views'),
                'total' => (int) DB::table('series')->sum('views') + (int) DB::table('chapters')->sum('views'),
                'series_count' => (int) DB::table('series')->count(),
                'chapter_count' => (int) DB::table('chapters')->count(),
            ],
        ];
    }

    // ─── Comments ────────────────────────────────────────────────────────────

    public function getComments(Request $request): JsonResponse
    {
        $query = Comment::query()
            ->with(['user:id,display_name,email,role', 'commentable'])
            ->withCount('replies');

        if (! $request->boolean('includeReplies')) {
            $query->whereNull('parent_id');
        }

        $this->applyTargetFilter($query, $request, 'commentable_type', 'commentable_id');

        if ($search = trim((string) $request->query('search'))) {
            $query->where(function ($q) use ($search) {
                $q->where('content', 'like', "%{$search}%")
                    ->orWhereHas('user', fn ($u) => $u->where('display_name', 'like', "%{$search}%"));
            });
        }

        if ($since = $this->sinceFromPeriod($request->query('period'))) {
            $query->where('created_at', '>=', $since);
        }

        match ($request->query('sort')) {
            'oldest' => $query->orderBy('created_at'),
            'longest' => $query->orderByRaw('CHAR_LENGTH(content) DESC'),
            'replies' => $query->orderBy('replies_count', 'desc')->orderBy('created_at', 'desc'),
            default => $query->orderBy('created_at', 'desc'),
        };

        $comments = $query->paginate($this->perPage($request), ["*"], "page", $this->page($request))->withQueryString();

        $comments->getCollection()->transform(function (Comment $comment) {
            [$page, $context] = $this->describeTarget($comment->commentable);

            return [
                'id' => $comment->id,
                'page' => $page,
                'context' => $context,
                'user_name' => $comment->user?->display_name ?? 'Deleted user',
                'user_email' => $comment->user?->email,
                'user_role' => $comment->user?->role,
                'content' => $comment->content,
                'is_reply' => $comment->parent_id !== null,
                'replies_count' => (int) $comment->replies_count,
                'is_edited' => (bool) $comment->is_edited,
                'created_at' => $comment->created_at?->toIso8601String(),
                'created_label' => $comment->created_at?->format('d M Y, H:i'),
            ];
        });

        return response()->json($comments);
    }

    public function deleteComment(int $id): JsonResponse
    {
        $comment = Comment::findOrFail($id);
        $commentable = $comment->commentable;

        // Comment uses SoftDeletes, so the parent_id foreign key's ON DELETE
        // CASCADE never fires — replies would be left orphaned and invisible.
        // Remove them explicitly, in a transaction with the parent.
        $removedReplies = DB::transaction(function () use ($comment, $commentable) {
            $replies = 0;

            if ($comment->parent_id === null) {
                $replies = Comment::where('parent_id', $comment->id)->count();
                Comment::where('parent_id', $comment->id)->delete();
            }

            // comments_count on a series tracks top-level comments on the series
            // page itself — matching how CommentController increments it.
            //
            // The column is UNSIGNED, so a plain decrement on a counter that has
            // already drifted to 0 makes MySQL abort the whole delete with an
            // out-of-range error. Guard the update instead of trusting the count.
            if ($commentable instanceof Series && $comment->parent_id === null) {
                DB::table('series')
                    ->where('id', $commentable->id)
                    ->where('comments_count', '>', 0)
                    ->decrement('comments_count');
            }

            $comment->delete();

            return $replies;
        });

        return response()->json([
            'message' => $removedReplies > 0
                ? "Comment and {$removedReplies} repl".($removedReplies === 1 ? 'y' : 'ies').' deleted.'
                : 'Comment deleted.',
            'removed_replies' => $removedReplies,
        ]);
    }

    // ─── Reactions ───────────────────────────────────────────────────────────

    public function getReactions(Request $request): JsonResponse
    {
        $query = DB::table('reactions')
            ->select('reactable_type', 'reactable_id')
            ->selectRaw('COUNT(*) as total_count');

        foreach (self::REACTION_TYPES as $type) {
            $query->selectRaw("SUM(CASE WHEN type = ? THEN 1 ELSE 0 END) as {$type}_count", [$type]);
        }

        $query->groupBy('reactable_type', 'reactable_id');

        $this->applyTargetFilter($query, $request, 'reactable_type', 'reactable_id');

        match ($request->query('sort')) {
            'least' => $query->orderBy('total_count'),
            default => $query->orderByDesc('total_count'),
        };

        $rows = $query->paginate($this->perPage($request), ["*"], "page", $this->page($request));

        // Resolve every referenced series/chapter in two queries rather than one
        // per row, which is what the previous version did.
        $labels = $this->resolveLabels($rows->getCollection(), 'reactable_type', 'reactable_id');

        $rows->getCollection()->transform(function ($row) use ($labels) {
            $key = $row->reactable_type.':'.$row->reactable_id;
            $label = $labels[$key] ?? null;

            return [
                'page' => $label['page'] ?? 'Deleted content',
                'context' => $label['context'] ?? null,
                'type' => $label['type'] ?? 'unknown',
                'orphaned' => $label === null,
                'like_count' => (int) $row->like_count,
                'love_count' => (int) $row->love_count,
                'haha_count' => (int) $row->haha_count,
                'angry_count' => (int) $row->angry_count,
                'sad_count' => (int) $row->sad_count,
                'total_count' => (int) $row->total_count,
            ];
        });

        // Totals across the whole filtered set, not just this page.
        $totalsQuery = DB::table('reactions');
        $this->applyTargetFilter($totalsQuery, $request, 'reactable_type', 'reactable_id');

        $totals = $totalsQuery
            ->selectRaw('COUNT(*) as total')
            ->tap(function ($q) {
                foreach (self::REACTION_TYPES as $type) {
                    $q->selectRaw("SUM(CASE WHEN type = ? THEN 1 ELSE 0 END) as {$type}_count", [$type]);
                }
            })
            ->first();

        return response()->json([
            'rows' => $rows,
            'totals' => [
                'total' => (int) ($totals->total ?? 0),
                'like' => (int) ($totals->like_count ?? 0),
                'love' => (int) ($totals->love_count ?? 0),
                'haha' => (int) ($totals->haha_count ?? 0),
                'angry' => (int) ($totals->angry_count ?? 0),
                'sad' => (int) ($totals->sad_count ?? 0),
            ],
        ]);
    }

    // ─── Views ───────────────────────────────────────────────────────────────

    /**
     * Series and chapters are unioned in SQL so the list can be sorted,
     * searched and paginated as one set — and so the grand total is a real
     * SUM across everything that matches the filter, not the sum of whatever
     * rows happened to fit on screen.
     */
    public function getViews(Request $request): JsonResponse
    {
        $base = DB::query()->fromSub($this->viewsUnion(), 'v');

        $this->applyViewFilter($base, $request);

        $totals = (clone $base)
            ->selectRaw('COALESCE(SUM(views), 0) as total_views')
            ->selectRaw('COUNT(*) as total_rows')
            ->selectRaw("COALESCE(SUM(CASE WHEN item_type = 'series' THEN views ELSE 0 END), 0) as series_views")
            ->selectRaw("COALESCE(SUM(CASE WHEN item_type = 'chapter' THEN views ELSE 0 END), 0) as chapter_views")
            ->first();

        $list = clone $base;

        match ($request->query('sort')) {
            'least' => $list->orderBy('views')->orderBy('page'),
            'title' => $list->orderBy('page'),
            default => $list->orderByDesc('views')->orderBy('page'),
        };

        $rows = $list->paginate($this->perPage($request), ["*"], "page", $this->page($request));

        $rows->getCollection()->transform(fn ($r) => [
            'page' => $r->page,
            'type' => $r->item_type,
            'views' => (int) $r->views,
            'series_id' => (int) $r->series_id,
        ]);

        return response()->json([
            'rows' => $rows,
            'totals' => [
                'views' => (int) ($totals->total_views ?? 0),
                'rows' => (int) ($totals->total_rows ?? 0),
                'series_views' => (int) ($totals->series_views ?? 0),
                'chapter_views' => (int) ($totals->chapter_views ?? 0),
            ],
        ]);
    }

    private function viewsUnion()
    {
        $series = DB::table('series')
            ->selectRaw("'series' as item_type")
            ->selectRaw('series.id as item_id')
            ->selectRaw('series.id as series_id')
            ->selectRaw("CONCAT(series.title, ' (Series Page)') as page")
            ->selectRaw('COALESCE(series.views, 0) as views');

        $chapters = DB::table('chapters')
            ->join('series', 'series.id', '=', 'chapters.series_id')
            ->selectRaw("'chapter' as item_type")
            ->selectRaw('chapters.id as item_id')
            ->selectRaw('chapters.series_id as series_id')
            ->selectRaw("CONCAT(series.title, ' - Ch ', chapters.chapter_number, CASE WHEN chapters.title IS NULL OR chapters.title = '' THEN '' ELSE CONCAT(': ', chapters.title) END) as page")
            ->selectRaw('COALESCE(chapters.views, 0) as views');

        return $series->unionAll($chapters);
    }

    private function applyViewFilter($query, Request $request): void
    {
        $type = $request->query('filterType');
        $id = $request->query('filterId');

        if ($id) {
            match ($type) {
                'series' => $query->where('item_type', 'series')->where('item_id', $id),
                'chapter' => $query->where('item_type', 'chapter')->where('item_id', $id),
                'series_chapters' => $query->where('item_type', 'chapter')->where('series_id', $id),
                'series_all' => $query->where('series_id', $id),
                default => null,
            };
        }

        if ($request->query('itemType') === 'series') {
            $query->where('item_type', 'series');
        } elseif ($request->query('itemType') === 'chapter') {
            $query->where('item_type', 'chapter');
        }

        if ($search = trim((string) $request->query('search'))) {
            $query->where('page', 'like', "%{$search}%");
        }
    }

    // ─── Shared helpers ──────────────────────────────────────────────────────

    /** Applies the series/chapter scope filter to a morph-based query. */
    private function applyTargetFilter($query, Request $request, string $typeColumn, string $idColumn): void
    {
        $type = $request->query('filterType');
        $id = $request->query('filterId');

        if (! $id) {
            return;
        }

        match ($type) {
            'series' => $query->where($typeColumn, Series::class)->where($idColumn, $id),
            'chapter' => $query->where($typeColumn, Chapter::class)->where($idColumn, $id),
            'series_chapters' => $query->where($typeColumn, Chapter::class)
                ->whereIn($idColumn, Chapter::where('series_id', $id)->select('id')),
            'series_all' => $query->where(function ($q) use ($typeColumn, $idColumn, $id) {
                $q->where(fn ($s) => $s->where($typeColumn, Series::class)->where($idColumn, $id))
                    ->orWhere(fn ($c) => $c->where($typeColumn, Chapter::class)
                        ->whereIn($idColumn, Chapter::where('series_id', $id)->select('id')));
            }),
            default => null,
        };
    }

    /**
     * Batch-resolves morph targets to display labels.
     *
     * @return array<string, array{page: string, context: string|null, type: string}>
     */
    private function resolveLabels($rows, string $typeColumn, string $idColumn): array
    {
        $seriesIds = [];
        $chapterIds = [];

        foreach ($rows as $row) {
            $type = is_object($row) ? $row->{$typeColumn} : $row[$typeColumn];
            $id = is_object($row) ? $row->{$idColumn} : $row[$idColumn];

            if ($type === Series::class) {
                $seriesIds[] = $id;
            } elseif ($type === Chapter::class) {
                $chapterIds[] = $id;
            }
        }

        $labels = [];

        if ($seriesIds) {
            foreach (Series::whereIn('id', $seriesIds)->get(['id', 'title']) as $s) {
                $labels[Series::class.':'.$s->id] = [
                    'page' => $s->title,
                    'context' => 'Series page',
                    'type' => 'series',
                ];
            }
        }

        if ($chapterIds) {
            $chapters = Chapter::whereIn('chapters.id', $chapterIds)
                ->join('series', 'series.id', '=', 'chapters.series_id')
                ->get(['chapters.id', 'chapters.chapter_number', 'chapters.title', 'series.title as series_title']);

            foreach ($chapters as $c) {
                $labels[Chapter::class.':'.$c->id] = [
                    'page' => 'Ch '.$c->chapter_number.($c->title ? ': '.$c->title : ''),
                    'context' => $c->series_title,
                    'type' => 'chapter',
                ];
            }
        }

        return $labels;
    }

    /** @return array{0: string, 1: string|null} page label and its context line */
    private function describeTarget($commentable): array
    {
        if ($commentable instanceof Series) {
            return [$commentable->title, 'Series page'];
        }

        if ($commentable instanceof Chapter) {
            $label = 'Ch '.$commentable->chapter_number.($commentable->title ? ': '.$commentable->title : '');

            return [$label, $commentable->series?->title ?? 'Unknown series'];
        }

        return ['Deleted content', null];
    }

    private function sinceFromPeriod(?string $period)
    {
        return match ($period) {
            'today' => now()->startOfDay(),
            '7d' => now()->subDays(7),
            '30d' => now()->subDays(30),
            '90d' => now()->subDays(90),
            default => null,
        };
    }

    private function perPage(Request $request): int
    {
        $perPage = (int) $request->query('perPage', 25);

        return in_array($perPage, [25, 50, 100, 200], true) ? $perPage : 25;
    }

    /**
     * Read the page straight off the request instead of relying on the global
     * page resolver, so pagination behaves the same however the request was
     * built.
     */
    private function page(Request $request): int
    {
        return max(1, (int) $request->query('page', 1));
    }

    public function getChapters(int $seriesId): JsonResponse
    {
        $chapters = Chapter::where('series_id', $seriesId)
            ->select('id', 'chapter_number', 'title')
            ->orderBy('chapter_number')
            ->get()
            ->map(fn (Chapter $c) => [
                'id' => $c->id,
                'label' => 'Ch '.$c->chapter_number.($c->title ? ': '.$c->title : ''),
            ]);

        return response()->json($chapters);
    }
}
