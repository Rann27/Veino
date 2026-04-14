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
     * Toggle reaction.
     * - Authenticated users: stored in DB keyed by user_id.
     * - Anonymous users: stored in DB keyed by session_id (persists across page loads).
     */
    public function toggle(Request $request)
    {
        $validated = $request->validate([
            'reactable_type' => 'required|in:series,chapter,comment',
            'reactable_id'   => 'required|integer',
            'type'           => 'required|in:like,love,haha,angry,sad',
        ]);

        $reactable = $this->getReactable($validated['reactable_type'], $validated['reactable_id']);
        if (!$reactable) {
            return response()->json(['error' => 'Not found'], 404);
        }

        $reactableType = $this->getReactableModel($validated['reactable_type']);
        $reactableId   = $validated['reactable_id'];
        $type          = $validated['type'];

        if (Auth::check()) {
            // ── Authenticated: keyed by user_id ───────────────────────────────
            $existing = Reaction::where([
                'user_id'        => Auth::id(),
                'reactable_type' => $reactableType,
                'reactable_id'   => $reactableId,
            ])->first();
        } else {
            // ── Anonymous: keyed by session_id ───────────────────────────────
            $existing = Reaction::where([
                'session_id'     => $request->session()->getId(),
                'reactable_type' => $reactableType,
                'reactable_id'   => $reactableId,
            ])->first();
        }

        if ($existing) {
            if ($existing->type === $type) {
                $existing->delete();
                $userReaction = null;
            } else {
                $existing->update(['type' => $type]);
                $userReaction = $type;
            }
        } else {
            Reaction::create([
                'user_id'        => Auth::id(),          // null for anonymous
                'session_id'     => Auth::check() ? null : $request->session()->getId(),
                'reactable_type' => $reactableType,
                'reactable_id'   => $reactableId,
                'type'           => $type,
            ]);
            $userReaction = $type;
        }

        return response()->json([
            'reaction_counts' => $this->getCounts($reactableType, $reactableId),
            'user_reaction'   => $userReaction,
        ]);
    }

    /**
     * Get reactions for a reactable item.
     */
    public function index(Request $request, $type, $id)
    {
        $reactable = $this->getReactable($type, $id);
        if (!$reactable) {
            return response()->json(['error' => 'Not found'], 404);
        }

        $reactableType = $this->getReactableModel($type);

        if (Auth::check()) {
            $userReaction = Reaction::where([
                'user_id'        => Auth::id(),
                'reactable_type' => $reactableType,
                'reactable_id'   => $id,
            ])->first()?->type;
        } else {
            $userReaction = Reaction::where([
                'session_id'     => $request->session()->getId(),
                'reactable_type' => $reactableType,
                'reactable_id'   => $id,
            ])->first()?->type;
        }

        return response()->json([
            'reaction_counts' => $this->getCounts($reactableType, $id),
            'user_reaction'   => $userReaction,
        ]);
    }

    private function getCounts($reactableType, $reactableId): array
    {
        return Reaction::where([
            'reactable_type' => $reactableType,
            'reactable_id'   => $reactableId,
        ])
        ->selectRaw('type, count(*) as count')
        ->groupBy('type')
        ->pluck('count', 'type')
        ->toArray();
    }

    private function getReactable($type, $id)
    {
        return match ($type) {
            'series'  => Series::find($id),
            'chapter' => Chapter::find($id),
            'comment' => Comment::find($id),
            default   => null,
        };
    }

    private function getReactableModel($type): ?string
    {
        return match ($type) {
            'series'  => Series::class,
            'chapter' => Chapter::class,
            'comment' => Comment::class,
            default   => null,
        };
    }
}
