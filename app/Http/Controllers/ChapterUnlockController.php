<?php

namespace App\Http\Controllers;

use App\Models\Chapter;
use App\Models\Series;
use App\Services\ChapterUnlockService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;

class ChapterUnlockController extends Controller
{
    public function __construct(private ChapterUnlockService $unlock) {}

    /**
     * Step 1 — the reader pressed "Free with challenge".
     *
     * Records the attempt and hands back the chapter's shortlink. The shortlink
     * is built on first use and cached on the chapter thereafter.
     */
    public function start(Request $request, string $seriesSlug, string $chapterLink): JsonResponse
    {
        $user = Auth::user();

        if (! $user) {
            return response()->json(['message' => 'Please sign in first.'], 401);
        }

        $series = Series::where('slug', $seriesSlug)->firstOrFail();
        $chapter = Chapter::where('series_id', $series->id)
            ->where('chapter_link', $chapterLink)
            ->where('is_published', true)
            ->firstOrFail();

        if (! $chapter->is_premium) {
            return response()->json(['message' => 'This chapter is already free.'], 422);
        }

        if (! $this->unlock->enabled()) {
            return response()->json(['message' => 'The free challenge is not available right now.'], 503);
        }

        if ($this->unlock->hasActiveAccess($user, $chapter)) {
            return response()->json(['message' => 'You already have access to this chapter.'], 409);
        }

        if ($this->unlock->reachedDailyLimit($user)) {
            return response()->json([
                'message' => "You've reached today's limit of {$this->unlock->dailyLimit()} free unlocks. Try again tomorrow.",
            ], 429);
        }

        $shortlink = $this->unlock->challengeUrlFor($chapter);

        if (! $shortlink) {
            return response()->json([
                'message' => $this->unlock->lastError()
                    ?? 'Could not prepare the challenge link. Please try again in a moment.',
            ], 503);
        }

        $this->unlock->startChallenge($user, $chapter);

        return response()->json([
            'shortlink' => $shortlink,
            'sandbox' => $this->unlock->sandbox(),
        ]);
    }

    /**
     * The stand-in gate. Reachable only while sandbox mode is on, so leaving a
     * stale link lying around cannot hand out access later.
     */
    public function sandbox(string $token)
    {
        abort_unless($this->unlock->sandbox(), 404);

        $chapter = Chapter::where('unlock_token', $token)->firstOrFail();
        $series = $chapter->series;

        abort_unless($series !== null, 404);

        return response()
            ->view('unlock-sandbox', [
                'chapter' => $chapter,
                'series' => $series,
                'days' => $this->unlock->accessDays(),
                'claimUrl' => route('chapters.unlock.claim', $chapter->unlock_token),
                'cancelUrl' => route('chapters.show', [$series->slug, $chapter->chapter_link]),
            ])
            // Never let a proxy keep a copy of a test-only page.
            ->header('Cache-Control', 'no-store, private')
            ->header('X-Robots-Tag', 'noindex, nofollow');
    }

    /**
     * Step 2 — the reader came back through the ad gate.
     *
     * The token identifies the chapter only; authorisation comes from the
     * pending record created in step 1, which is why a stranger following this
     * URL gets nothing.
     */
    public function claim(Request $request, string $token): RedirectResponse
    {
        $chapter = Chapter::where('unlock_token', $token)->firstOrFail();
        $series = $chapter->series;

        if (! $series) {
            abort(404);
        }

        $chapterUrl = route('chapters.show', [$series->slug, $chapter->chapter_link]);
        $user = Auth::user();

        if (! $user) {
            return redirect()->route('login')
                ->with('error', 'Please sign in to claim your free access.');
        }

        // Already covered — send them straight in rather than burning a grant.
        if ($this->unlock->hasActiveAccess($user, $chapter)) {
            return redirect()->to($chapterUrl.'?unlocked=1');
        }

        if (! $this->unlock->claimable()) {
            return redirect()->to($chapterUrl)->with('error', 'The free challenge is not available right now.');
        }

        [$ok, $reason] = $this->unlock->consumeChallenge(
            $user,
            $chapter,
            $request->headers->get('referer'),
            $request->getHost(),
        );

        if (! $ok) {
            return redirect()->to($chapterUrl)->with('error', match ($reason) {
                'too_fast' => 'That was too quick — please complete the challenge to unlock.',
                'bad_referer' => 'Please complete the challenge from the start.',
                default => 'Start the challenge from the chapter page first.',
            });
        }

        if ($this->unlock->reachedDailyLimit($user)) {
            return redirect()->to($chapterUrl)->with('error', "You've reached today's free unlock limit.");
        }

        $this->unlock->grant($user, $chapter);

        return redirect()->to($chapterUrl.'?unlocked=1');
    }
}
