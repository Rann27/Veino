<?php

namespace App\Http\Controllers;

use App\Models\Comment;
use App\Models\Series;
use App\Models\Chapter;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class CommentController extends Controller
{
    /**
     * Get comments for a commentable item (Series or Chapter)
     */
    public function index(Request $request, $type, $id)
    {
        $commentable = $this->getCommentable($type, $id);
        
        if (!$commentable) {
            return response()->json(['error' => 'Not found'], 404);
        }

        $sortBy = $request->get('sort', 'newest'); // newest, oldest, popular
        
        $query = $commentable->comments()->with(['user', 'replies.user', 'reactions']);
        
        // Apply sorting
        switch ($sortBy) {
            case 'oldest':
                $query->orderBy('created_at', 'asc');
                break;
            case 'popular':
                $query->withCount('reactions')->orderBy('reactions_count', 'desc');
                break;
            default: // newest
                $query->orderBy('created_at', 'desc');
                break;
        }
        
        $comments = $query->get();
        
        // Add user reaction info
        $userId = Auth::id();
        if ($userId) {
            $comments->each(function ($comment) use ($userId) {
                $comment->user_reaction = $comment->reactions()
                    ->where('user_id', $userId)
                    ->first()?->type;
                    
                // Add reaction info for replies
                $comment->replies->each(function ($reply) use ($userId) {
                    $reply->user_reaction = $reply->reactions()
                        ->where('user_id', $userId)
                        ->first()?->type;
                });
            });
        }
        
        return response()->json([
            'comments' => $comments,
            'total' => $comments->count(),
        ]);
    }

    /**
     * Store a new comment
     */
    public function store(Request $request, $type, $id)
    {
        if (!Auth::check()) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $commentable = $this->getCommentable($type, $id);
        
        if (!$commentable) {
            return response()->json(['error' => 'Not found'], 404);
        }

        $validated = $request->validate([
            'content' => 'required|string|max:5000',
            'parent_id' => 'nullable|exists:comments,id',
        ]);

        $comment = $commentable->comments()->create([
            'user_id' => Auth::id(),
            'parent_id' => $validated['parent_id'] ?? null,
            'content' => $validated['content'],
        ]);

        // Load relationships
        $comment->load(['user', 'reactions']);
        $comment->user_reaction = null;

        return response()->json([
            'message' => 'Comment posted successfully',
            'comment' => $comment,
        ], 201);
    }

    /**
     * Update a comment
     */
    public function update(Request $request, $id)
    {
        if (!Auth::check()) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $comment = Comment::find($id);
        
        if (!$comment) {
            return response()->json(['error' => 'Comment not found'], 404);
        }

        // Check if user owns the comment
        if ($comment->user_id !== Auth::id()) {
            return response()->json(['error' => 'Forbidden'], 403);
        }

        $validated = $request->validate([
            'content' => 'required|string|max:5000',
        ]);

        $comment->update([
            'content' => $validated['content'],
            'is_edited' => true,
            'edited_at' => now(),
        ]);

        $comment->load(['user', 'reactions']);
        $comment->user_reaction = $comment->reactions()
            ->where('user_id', Auth::id())
            ->first()?->type;

        return response()->json([
            'message' => 'Comment updated successfully',
            'comment' => $comment,
        ]);
    }

    /**
     * Delete a comment
     */
    public function destroy($id)
    {
        if (!Auth::check()) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $comment = Comment::find($id);
        
        if (!$comment) {
            return response()->json(['error' => 'Comment not found'], 404);
        }

        // Check if user owns the comment or is admin
        if ($comment->user_id !== Auth::id() && Auth::user()->role !== 'administrator') {
            return response()->json(['error' => 'Forbidden'], 403);
        }

        $comment->delete();

        return response()->json([
            'message' => 'Comment deleted successfully',
        ]);
    }

    /**
     * Get commentable model instance
     */
    private function getCommentable($type, $id)
    {
        switch ($type) {
            case 'series':
                return Series::find($id);
            case 'chapter':
                return Chapter::find($id);
            default:
                return null;
        }
    }
}
