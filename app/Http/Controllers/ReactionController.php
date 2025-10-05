<?php

namespace App\Http\Controllers;

use App\Models\Reaction;
use App\Models\Series;
use App\Models\Chapter;
use App\Models\Comment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ReactionController extends Controller
{
    /**
     * Toggle reaction (add if doesn't exist, update if different, remove if same)
     */
    public function toggle(Request $request)
    {
        if (!Auth::check()) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $validated = $request->validate([
            'reactable_type' => 'required|in:series,chapter,comment',
            'reactable_id' => 'required|integer',
            'type' => 'required|in:like,love,haha,angry,sad',
        ]);

        $reactable = $this->getReactable($validated['reactable_type'], $validated['reactable_id']);
        
        if (!$reactable) {
            return response()->json(['error' => 'Not found'], 404);
        }

        $userId = Auth::id();
        $reactableType = $this->getReactableModel($validated['reactable_type']);

        // Check if user already reacted
        $existingReaction = Reaction::where([
            'user_id' => $userId,
            'reactable_type' => $reactableType,
            'reactable_id' => $validated['reactable_id'],
        ])->first();

        if ($existingReaction) {
            if ($existingReaction->type === $validated['type']) {
                // Same reaction, remove it
                $existingReaction->delete();
                $action = 'removed';
            } else {
                // Different reaction, update it
                $existingReaction->update(['type' => $validated['type']]);
                $action = 'updated';
            }
        } else {
            // No reaction, create new one
            Reaction::create([
                'user_id' => $userId,
                'reactable_type' => $reactableType,
                'reactable_id' => $validated['reactable_id'],
                'type' => $validated['type'],
            ]);
            $action = 'added';
        }

        // Get updated reaction counts
        $reactionCounts = Reaction::where([
            'reactable_type' => $reactableType,
            'reactable_id' => $validated['reactable_id'],
        ])
        ->selectRaw('type, count(*) as count')
        ->groupBy('type')
        ->pluck('count', 'type')
        ->toArray();

        // Get user's current reaction
        $userReaction = Reaction::where([
            'user_id' => $userId,
            'reactable_type' => $reactableType,
            'reactable_id' => $validated['reactable_id'],
        ])->first();

        return response()->json([
            'message' => 'Reaction ' . $action,
            'action' => $action,
            'reaction_counts' => $reactionCounts,
            'user_reaction' => $userReaction?->type,
        ]);
    }

    /**
     * Get reactions for a reactable item
     */
    public function index(Request $request, $type, $id)
    {
        $reactable = $this->getReactable($type, $id);
        
        if (!$reactable) {
            return response()->json(['error' => 'Not found'], 404);
        }

        $reactableType = $this->getReactableModel($type);

        // Get reaction counts
        $reactionCounts = Reaction::where([
            'reactable_type' => $reactableType,
            'reactable_id' => $id,
        ])
        ->selectRaw('type, count(*) as count')
        ->groupBy('type')
        ->pluck('count', 'type')
        ->toArray();

        // Get user's reaction if authenticated
        $userReaction = null;
        if (Auth::check()) {
            $userReaction = Reaction::where([
                'user_id' => Auth::id(),
                'reactable_type' => $reactableType,
                'reactable_id' => $id,
            ])->first()?->type;
        }

        return response()->json([
            'reaction_counts' => $reactionCounts,
            'user_reaction' => $userReaction,
        ]);
    }

    /**
     * Get reactable model instance
     */
    private function getReactable($type, $id)
    {
        switch ($type) {
            case 'series':
                return Series::find($id);
            case 'chapter':
                return Chapter::find($id);
            case 'comment':
                return Comment::find($id);
            default:
                return null;
        }
    }

    /**
     * Get reactable model class name
     */
    private function getReactableModel($type)
    {
        switch ($type) {
            case 'series':
                return Series::class;
            case 'chapter':
                return Chapter::class;
            case 'comment':
                return Comment::class;
            default:
                return null;
        }
    }
}
