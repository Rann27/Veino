<?php

namespace App\Http\Controllers;

use App\Models\Chapter;
use App\Models\ChapterUnlockAttempt;
use App\Models\Series;
use App\Models\User;
use App\Services\ChapterUnlockService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;

class ChapterUnlockController extends Controller
{
    /**
     * The only thing a refused reader is ever told.
     *
     * Deliberately says what to do without saying what went wrong. An honest
     * reader needs a way forward, and this gives them one; someone testing
     * where the boundaries sit learns nothing they can act on, because every
     * failure looks identical from the outside.
     */
    private const REFUSAL_MESSAGE = "We couldn't verify that unlock. Open the chapter and start the free unlock again.";

    /** Refusals within the window before a reader is made to slow down. */
    private const REFUSAL_LIMIT = 5;

    private const REFUSAL_WINDOW_MINUTES = 60;

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

        if ($this->unlock->reachedIpDailyLimit($request->ip())) {
            $this->log($request, $user->id, $chapter->id, 'ip_limit');

            return response()->json([
                'message' => "Today's free unlocks are used up. Try again tomorrow.",
            ], 429);
        }

        $shortlink = $this->unlock->challengeUrlFor($chapter);

        if (! $shortlink) {
            return response()->json([
                'message' => $this->unlock->lastError()
                    ?? 'Could not prepare the challenge link. Please try again in a moment.',
            ], 503);
        }

        $fresh = $this->unlock->startChallenge($user, $chapter);

        // Logged here too, not only on the way back. Without a row at the start
        // a reader who presses the button and wanders off leaves no trace at
        // all, so the monitor cannot tell a gate nobody finishes from a gate
        // nobody tries.
        //
        // Only genuinely new runs are recorded. Pressing the button again while
        // a run is already going does not start a second one, and counting it
        // would inflate both the start tally and the abandonment figure derived
        // from it.
        if ($fresh) {
            $this->log($request, $user->id, $chapter->id, 'started');
        }

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
        // Retired tokens resolve too. A 404 for those and a redirect for live
        // ones would let anyone holding a saved URL check whether it still works
        // without spending anything — the free reconnaissance the single refusal
        // message exists to deny. Only a token that never existed 404s, and
        // guessing one of those is not a route anybody takes.
        [$chapter, $tokenLive] = $this->unlock->resolveToken($token);
        $series = $chapter?->series;

        if (! $chapter || ! $series) {
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
            $this->log($request, $user->id, $chapter->id, 'disabled');

            return redirect()->to($chapterUrl)->with('error', 'The free challenge is not available right now.');
        }

        // Checked before the challenge is consumed, not after.
        //
        // Run the other way round it becomes an oracle: someone probing the
        // rules could deliberately spend their daily grants, and from then on a
        // "daily limit" reply means the timing check passed while the generic
        // reply means it failed. Answering the quota question first keeps this
        // message honest for readers without it ever reporting on the challenge.
        if ($this->unlock->reachedDailyLimit($user)) {
            $this->log($request, $user->id, $chapter->id, 'daily_limit');

            return redirect()->to($chapterUrl)->with('error', "You've reached today's free unlock limit.");
        }

        // Same reasoning as the per-account quota above: answered before the
        // challenge is consumed, and in quota terms only.
        if ($this->unlock->reachedIpDailyLimit($request->ip())) {
            $this->log($request, $user->id, $chapter->id, 'ip_limit');

            return redirect()->to($chapterUrl)->with('error', "You've reached today's free unlock limit.");
        }

        if ($this->throttled($user)) {
            $this->log($request, $user->id, $chapter->id, 'throttled');

            return redirect()->to($chapterUrl)->with('error', self::REFUSAL_MESSAGE);
        }

        // Past the grace window, so this is a URL kept from an earlier run
        // rather than a reader still on their way back. Answered exactly like
        // every other failure, and the pending record is left alone — it is not
        // this token's to spend.
        if (! $tokenLive) {
            $this->log($request, $user->id, $chapter->id, 'expired_token');

            return redirect()->to($chapterUrl)->with('error', self::REFUSAL_MESSAGE);
        }

        [$ok, $reason, $elapsed] = $this->unlock->consumeChallenge(
            $user,
            $chapter,
            $request->headers->get('referer'),
            $request->getHost(),
        );

        if (! $ok) {
            // The real reason goes to the log, never to the reader. Distinct
            // wording per failure told anyone testing the boundaries exactly
            // which rule they had tripped, which is the one thing that makes
            // the rules cheap to map.
            $this->log($request, $user->id, $chapter->id, $reason, $elapsed);

            return redirect()->to($chapterUrl)->with('error', self::REFUSAL_MESSAGE);
        }

        $this->unlock->grant($user, $chapter);
        $this->log($request, $user->id, $chapter->id, 'granted', $elapsed);

        return redirect()->to($chapterUrl.'?unlocked=1');
    }

    /**
     * Whether this reader has been refused often enough to be made to wait.
     *
     * With every refusal now wearing the same wording, the way to map the rules
     * is to try repeatedly and watch which attempts get through. That costs the
     * prober almost nothing today. Capping refusals puts a price on it while
     * staying clear of honest readers, who trip a refusal once and move on.
     *
     * Grants are excluded so a heavy but legitimate reader is never caught, and
     * so are 'started' rows, which are presses rather than verdicts.
     */
    private function throttled(User $user): bool
    {
        return ChapterUnlockAttempt::where('user_id', $user->id)
            ->whereNotIn('outcome', ['granted', ChapterUnlockAttempt::STARTED])
            ->where('created_at', '>=', now()->subMinutes(self::REFUSAL_WINDOW_MINUTES))
            ->count() >= self::REFUSAL_LIMIT;
    }

    /**
     * Records the attempt.
     *
     * Never allowed to break the claim: an audit row failing to write must not
     * cost a reader the access they just earned.
     */
    private function log(Request $request, ?int $userId, ?int $chapterId, string $outcome, ?int $elapsed = null): void
    {
        try {
            ChapterUnlockAttempt::create([
                'user_id' => $userId,
                'chapter_id' => $chapterId,
                'outcome' => $outcome,
                'elapsed_seconds' => $elapsed,
                'source' => $this->unlock->sandbox() ? 'sandbox' : 'shortlink',
                'ip' => $request->ip(),
                'created_at' => now(),
            ]);
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::warning('Unlock attempt not logged: '.$e->getMessage());
        }
    }
}
