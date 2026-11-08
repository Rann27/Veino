<?php

namespace App\Services;

use App\Models\Chapter;
use App\Models\ChapterPurchase;
use App\Models\ChapterTemporaryAccess;
use App\Models\ChapterUnlockToken;
use App\Models\PaymentSetting;
use App\Models\User;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Rules for unlocking a premium chapter through the Move2Link challenge.
 *
 * The security model, in short: the shortlink destination is the same URL for
 * everybody, so it guarantees nothing on its own. What authorises a grant is a
 * short-lived *pending* record created when the reader presses the button. A
 * claim only succeeds for the reader who started it, once, and only within the
 * window — so the landing URL cannot be shared, bookmarked, or replayed.
 *
 * Known limit: without a server-to-server postback from Move2Link there is no
 * way to *prove* the ad gate was completed. A reader who starts the flow and
 * then types the landing URL directly can skip it. The referer and minimum
 * elapsed-time checks below make that inconvenient rather than impossible.
 */
class ChapterUnlockService
{
    /** How long a started challenge stays claimable. */
    private const PENDING_TTL_MINUTES = 30;

    /**
     * Fastest a genuine run can finish.
     *
     * Originally 45, guessed from an assumption that the gate took about a
     * minute. Live data says otherwise: across the first several dozen honest
     * runs the quickest was 126 seconds and none came close to the old floor,
     * so 45 was leaving a wide corridor open for anyone jumping straight to the
     * landing URL. 90 sits roughly 30% under the fastest run ever observed —
     * tight enough to be worth something, loose enough that a reader on a fast
     * connection is not punished for it.
     */
    private const MIN_CHALLENGE_SECONDS = 90;

    public function __construct(private Move2LinkClient $move2link) {}

    /** Why the last shortlink attempt failed, for showing in the admin. */
    public function lastError(): ?string
    {
        return $this->move2link->lastError();
    }

    // ─── Settings ────────────────────────────────────────────────────────────

    /**
     * Sandbox replaces Move2Link with a local stand-in so the rest of the flow
     * can be exercised without a public URL or a real ad view.
     *
     * It is deliberately incapable of contaminating live mode: a sandbox URL is
     * built per request and never written to `chapters.unlock_shortlink`, so
     * switching back cannot leave a fake link cached anywhere. Grants it makes
     * are tagged `sandbox` so they can be told apart later.
     */
    public function sandbox(): bool
    {
        return $this->sandboxAllowed()
            && (bool) PaymentSetting::get('unlock_challenge_sandbox', false);
    }

    /**
     * Sandbox is a local-development tool and nothing else.
     *
     * The setting lives in the database, so it can survive a database copy or a
     * stray toggle and reach the live site — where it would hand out every
     * premium chapter for free, silently. Environment decides, not the setting:
     * outside `local` the switch simply has no effect, whatever it says.
     */
    public function sandboxAllowed(): bool
    {
        return app()->environment('local');
    }

    /** Whether the challenge can be *offered*. Live mode needs the API token. */
    public function enabled(): bool
    {
        return $this->claimable() && ($this->sandbox() || $this->move2link->configured());
    }

    /**
     * Whether a challenge already under way may still be honoured.
     *
     * Claiming never touches the Move2Link API, so a missing token must not
     * void a reader's attempt — they have already sat through the ad by then.
     * Only the admin switch stops a claim.
     */
    public function claimable(): bool
    {
        return (bool) PaymentSetting::get('unlock_challenge_enabled', true);
    }

    public function accessDays(): int
    {
        return max(1, (int) PaymentSetting::get('unlock_challenge_days', 7));
    }

    public function dailyLimit(): int
    {
        return max(0, (int) PaymentSetting::get('unlock_challenge_daily_limit', 10));
    }

    /**
     * Grants a token may serve before it is replaced. 0 turns rotation off.
     *
     * The claim URL is the one secret in this flow that a reader can keep. It
     * is reachable from the gate's own "continue" button, so anyone who has
     * finished the gate once can save it and reuse it later without watching
     * anything. Retiring the token after a set number of grants means a saved
     * URL stops working, and the only way to learn the replacement is to reach
     * the end of the gate again.
     *
     * Lower is tighter and costs more: at 1 no reuse is possible at all, but
     * every grant spends a Move2Link API call, and that rate limit is per
     * server IP — one bucket shared by every reader.
     */
    public function rotateAfter(): int
    {
        return max(0, (int) PaymentSetting::get('unlock_rotate_after', 0));
    }

    public function rotationEnabled(): bool
    {
        return $this->rotateAfter() > 0 && ! $this->sandbox();
    }

    // ─── Eligibility ─────────────────────────────────────────────────────────

    /** Whether to offer the challenge button on this chapter for this reader. */
    public function availableFor(?User $user, Chapter $chapter): bool
    {
        if (! $this->enabled() || ! $chapter->is_premium) {
            return false;
        }

        // Guests are offered the button too — the page sends them to log in
        // first, since a grant has to belong to an account.
        if (! $user) {
            return true;
        }

        if ($user->hasActiveMembership()) {
            return false;
        }

        if (ChapterPurchase::where('user_id', $user->id)->where('chapter_id', $chapter->id)->exists()) {
            return false;
        }

        return ! $this->hasActiveAccess($user, $chapter);
    }

    public function hasActiveAccess(User $user, Chapter $chapter): bool
    {
        return ChapterTemporaryAccess::where('user_id', $user->id)
            ->where('chapter_id', $chapter->id)
            ->active()
            ->exists();
    }

    /** Grants made today, against the configured daily cap. */
    public function grantsToday(User $user): int
    {
        return ChapterTemporaryAccess::where('user_id', $user->id)
            ->where('granted_at', '>=', now()->startOfDay())
            ->count();
    }

    public function reachedDailyLimit(User $user): bool
    {
        $limit = $this->dailyLimit();

        return $limit > 0 && $this->grantsToday($user) >= $limit;
    }

    /**
     * Days a premium chapter stays members-only before the free unlock opens.
     * 0 turns early access off. Coins and membership are unaffected.
     */
    public function earlyAccessDays(): int
    {
        return max(0, (int) PaymentSetting::get('unlock_early_access_days', 0));
    }

    /**
     * When the free unlock opens for this chapter, or null once it is open.
     *
     * Counted from created_at: chapters are published the moment they are
     * created (there is no draft step), so that is the release time.
     */
    public function freeUnlockOpensAt(Chapter $chapter): ?\Illuminate\Support\Carbon
    {
        $days = $this->earlyAccessDays();

        if ($days === 0 || ! $chapter->is_premium || ! $chapter->created_at) {
            return null;
        }

        $opens = $chapter->created_at->copy()->addDays($days);

        return $opens->isFuture() ? $opens : null;
    }

    /**
     * Seconds until the free unlock opens, for each premium chapter still in
     * early access — the series page badges these without a query per row.
     *
     * Seconds rather than a timestamp so the countdown runs off the page's
     * own clock: a reader whose device is a few minutes out would otherwise
     * see the button unlock early and then be refused.
     *
     * @return array<int, int> chapter id => seconds left
     */
    public function earlyAccessMap(iterable $chapters): array
    {
        if ($this->earlyAccessDays() === 0 || ! $this->enabled()) {
            return [];
        }

        $map = [];
        foreach ($chapters as $chapter) {
            if ($opens = $this->freeUnlockOpensAt($chapter)) {
                $map[$chapter->id] = (int) now()->diffInSeconds($opens);
            }
        }

        return $map;
    }

    /**
     * Free unlocks one address may earn per day, across every account behind
     * it. 0 turns the cap off.
     *
     * Mirrors Move2Link, which pays for one view per IP per day: past that,
     * each extra unlock from the same address hands out a premium chapter for
     * nothing. Off by default because the cost lands on strangers too; a
     * mobile carrier's CGNAT can put many unrelated readers behind one address.
     */
    public function ipDailyLimit(): int
    {
        return max(0, (int) PaymentSetting::get('unlock_ip_daily_limit', 0));
    }

    public function reachedIpDailyLimit(?string $ip): bool
    {
        $limit = $this->ipDailyLimit();

        if ($limit === 0 || ! $ip) {
            return false;
        }

        return \App\Models\ChapterUnlockAttempt::where('ip', $ip)
            ->where('outcome', 'granted')
            ->where('created_at', '>=', now()->startOfDay())
            ->count() >= $limit;
    }

    // ─── Shortlink ───────────────────────────────────────────────────────────

    /**
     * The chapter's shortlink, created on first use.
     *
     * Deliberately lazy rather than generated when a chapter is published: a
     * batch import of fifty chapters would fire fifty API calls in a burst and
     * hit the rate limit, and most chapters are never unlocked this way.
     */
    /**
     * Where to send the reader after they press the button.
     *
     * In sandbox this is our own stand-in gate, computed fresh every time and
     * never stored — the whole point is that turning sandbox off leaves no
     * trace behind.
     */
    public function challengeUrlFor(Chapter $chapter): ?string
    {
        if ($this->sandbox()) {
            $this->ensureToken($chapter);

            return route('chapters.unlock.sandbox', $chapter->unlock_token);
        }

        // Rotation happens here rather than at the moment of the grant. The
        // reader is already waiting on an API call at this point, so the cost
        // is hidden; doing it during the claim would put a Move2Link round trip
        // in front of the redirect that hands them their chapter.
        $this->rotateIfDue($chapter);

        return $this->shortlinkFor($chapter);
    }

    /**
     * Replaces the token once it has served its allotted grants.
     *
     * Ordered so a failure changes nothing: the replacement shortlink has to
     * come back from Move2Link before the old token is retired. Rotate first
     * and a rate-limited API would leave the chapter holding a token with no
     * link pointing at it — the free route dead until someone noticed.
     *
     * The lock is non-blocking on purpose. Two readers arriving together should
     * not queue behind each other for a housekeeping task; whoever misses it
     * simply serves the current link and the rotation happens on the next press.
     */
    private function rotateIfDue(Chapter $chapter): void
    {
        if (! $this->rotationEnabled() || ! $chapter->unlock_token) {
            return;
        }

        if ($chapter->unlock_claim_count < $this->rotateAfter()) {
            return;
        }

        $lock = Cache::lock('unlock:rotate:'.$chapter->id, 30);

        if (! $lock->get()) {
            return;
        }

        try {
            // Re-read under the lock: the chapter in hand may have been loaded
            // before another request rotated it.
            $fresh = Chapter::find($chapter->id);

            if (! $fresh || $fresh->unlock_claim_count < $this->rotateAfter()) {
                return;
            }

            $retiring = $fresh->unlock_token;
            $newToken = $this->freshToken();
            $shortlink = $this->createShortlink($fresh, $newToken);

            if (! $shortlink) {
                return;   // Nothing touched. The current link keeps working.
            }

            ChapterUnlockToken::firstOrCreate(
                ['token' => $retiring],
                ['chapter_id' => $fresh->id, 'retired_at' => now()],
            );

            $fresh->unlock_token = $newToken;
            $fresh->unlock_shortlink = $shortlink;
            $fresh->unlock_shortlink_at = now();
            $fresh->unlock_claim_count = 0;
            $this->persist($fresh);

            // Keep the caller's copy in step so it serves the new link now.
            $chapter->unlock_token = $newToken;
            $chapter->unlock_shortlink = $shortlink;
            $chapter->unlock_claim_count = 0;
        } finally {
            $lock->release();
        }
    }

    /**
     * Finds the chapter a claim token belongs to, live or retired.
     *
     * Retired tokens still resolve so the controller can answer them exactly as
     * it answers anything else. Returning null for them would turn the reply
     * into a liveness test: a saved URL that 404s is known-dead, one that
     * reaches the chapter page is known-good, and that is free reconnaissance.
     *
     * @return array{0: ?Chapter, 1: bool} the chapter, and whether the token is
     *                                     still honourable
     */
    public function resolveToken(string $token): array
    {
        if ($chapter = Chapter::where('unlock_token', $token)->first()) {
            return [$chapter, true];
        }

        $retired = ChapterUnlockToken::with('chapter')->where('token', $token)->first();

        if (! $retired || ! $retired->chapter) {
            return [null, false];
        }

        // A reader part-way through the gate when rotation happened has done
        // nothing wrong, and the pending record they hold is still the real
        // proof. Honouring the old token for the length of that record's life
        // means rotation never costs anyone the ad they already sat through.
        $withinGrace = $retired->retired_at->gt(now()->subMinutes(self::PENDING_TTL_MINUTES));

        return [$retired->chapter, $withinGrace];
    }

    /** Assigns and persists a token if the chapter has none. */
    private function ensureToken(Chapter $chapter): void
    {
        if ($chapter->unlock_token) {
            return;
        }

        $chapter->unlock_token = $this->freshToken();
        $this->persist($chapter);
    }

    /**
     * Saves without touching updated_at.
     *
     * Latest Updates orders series by MAX(chapters.updated_at), so a plain save
     * here would advertise a chapter as freshly updated merely because an admin
     * minted its shortlink — quietly reshuffling the homepage feed.
     */
    private function persist(Chapter $chapter): void
    {
        Chapter::withoutTimestamps(fn () => $chapter->saveQuietly());
    }

    public function shortlinkFor(Chapter $chapter, bool $regenerate = false): ?string
    {
        if (! $regenerate && $chapter->unlock_shortlink) {
            return $chapter->unlock_shortlink;
        }

        if (! $chapter->unlock_token) {
            $chapter->unlock_token = $this->freshToken();
        }

        $shortlink = $this->createShortlink($chapter, $chapter->unlock_token);

        if (! $shortlink) {
            // Persist the token anyway so a later retry reuses the same URL.
            $this->persist($chapter);

            return null;
        }

        $chapter->unlock_shortlink = $shortlink;
        $chapter->unlock_shortlink_at = now();
        $this->persist($chapter);

        return $shortlink;
    }

    /**
     * Asks Move2Link for a link pointing at one specific token.
     *
     * Takes the token as an argument rather than reading it off the chapter so
     * rotation can mint a link for its replacement before anything is written —
     * the chapter still holds the old token while this runs.
     */
    private function createShortlink(Chapter $chapter, string $token): ?string
    {
        $series = $chapter->series;

        // Pinned to APP_URL rather than the host serving this request. route()
        // would otherwise bake whatever domain the admin happened to be on into
        // the shortlink — generate one from a staging subdomain and Move2Link
        // stores that address forever, so every link dies with the subdomain.
        $claimUrl = rtrim((string) config('app.url'), '/')
            .route('chapters.unlock.claim', $token, false);

        return $this->move2link->createLink(
            $claimUrl,
            $series ? Str::limit($series->title.' — '.($chapter->title ?: 'Chapter '.$chapter->chapter_number), 250, '') : null
        );
    }

    private function freshToken(): string
    {
        do {
            $token = Str::lower(Str::random(32));
            $taken = Chapter::where('unlock_token', $token)->exists()
                || ChapterUnlockToken::where('token', $token)->exists();
        } while ($taken);

        return $token;
    }

    // ─── Pending challenge ───────────────────────────────────────────────────

    private function pendingKey(int $userId, int $chapterId): string
    {
        return "unlock:pending:{$userId}:{$chapterId}";
    }

    /** The floor a run has to clear, for showing in the admin. */
    public function minChallengeSeconds(): int
    {
        return self::MIN_CHALLENGE_SECONDS;
    }

    /**
     * Records that this reader has set off towards the ad gate.
     *
     * add() rather than put() so a second press cannot restart the clock. The
     * button stays on screen while the gate runs in another tab, and a reader
     * who presses it again mid-run used to have their elapsed time recomputed
     * from that moment — turning a completed run into a "too_fast" refusal and
     * writing a false accusation into the log. The first press is the honest
     * start; later ones during the same run are noise.
     *
     * @return bool true when this press began a new run, false when one was
     *              already under way
     */
    public function startChallenge(User $user, Chapter $chapter): bool
    {
        return Cache::add(
            $this->pendingKey($user->id, $chapter->id),
            now()->timestamp,
            now()->addMinutes(self::PENDING_TTL_MINUTES)
        );
    }

    /**
     * Consumes the pending record.
     *
     * The elapsed time comes back with the verdict rather than being discarded:
     * a single run tells you nothing, but the spread across many runs is what
     * exposes a bypass doing the rounds.
     *
     * @return array{0: bool, 1: string, 2: ?int} success, reason, elapsed seconds
     */
    public function consumeChallenge(User $user, Chapter $chapter, ?string $referer, ?string $currentHost = null): array
    {
        $key = $this->pendingKey($user->id, $chapter->id);
        $startedAt = Cache::get($key);

        if ($startedAt === null) {
            return [false, 'not_started', null];
        }

        Cache::forget($key);

        $elapsed = max(0, now()->timestamp - (int) $startedAt);

        // The stand-in gate has no real countdown to sit through, so holding
        // sandbox to the live threshold would just mean waiting 45 seconds for
        // nothing. Everything else — the pending record, single use, the tie to
        // this reader — is enforced exactly as in live mode.
        if (! $this->sandbox() && $elapsed < self::MIN_CHALLENGE_SECONDS) {
            return [false, 'too_fast', $elapsed];
        }

        // In sandbox the gate is our own page, so there is nothing to vouch for.
        if ($this->sandbox()) {
            return [true, 'ok', $elapsed];
        }

        // Best effort. Shorteners routinely strip the referer, so a missing one
        // cannot be treated as failure — only a clearly foreign one is.
        //
        // The comparison accepts the host actually serving the request as well
        // as APP_URL: they legitimately differ across www/non-www, a staging
        // domain, or a local address, and rejecting those would turn away
        // readers who did nothing wrong.
        if ($referer) {
            $host = strtolower(parse_url($referer, PHP_URL_HOST) ?: '');

            $allowed = array_filter([
                strtolower((string) parse_url(config('app.url'), PHP_URL_HOST)),
                $currentHost ? strtolower($currentHost) : null,
            ]);

            $matchesOwnHost = in_array($host, $allowed, true)
                || collect($allowed)->contains(fn ($own) => $own !== '' && str_ends_with($host, '.'.$own));

            if (! str_contains($host, 'move2link') && ! $matchesOwnHost) {
                return [false, 'bad_referer', $elapsed];
            }
        }

        return [true, 'ok', $elapsed];
    }

    // ─── Granting ────────────────────────────────────────────────────────────

    public function grant(User $user, Chapter $chapter): ChapterTemporaryAccess
    {
        // Incremented in SQL, never read-then-written: two readers claiming the
        // same chapter at once would otherwise both see the same count and both
        // write the same successor, and the token would serve one grant more
        // than it was allowed to.
        //
        // Deliberately the query builder rather than Eloquent. Eloquent's
        // increment() quietly folds in updated_at, and Latest Updates ranks
        // series by MAX(chapters.updated_at) — so every free unlock was
        // shoving its series to the top of the homepage as though a new
        // chapter had been posted.
        //
        // Chapter::withoutTimestamps() would also have worked; this is the
        // blunter version, chosen because it cannot be defeated by someone
        // later calling the increment from outside that closure.
        DB::table('chapters')->where('id', $chapter->id)->increment('unlock_claim_count');

        return ChapterTemporaryAccess::updateOrCreate(
            ['user_id' => $user->id, 'chapter_id' => $chapter->id],
            [
                'granted_at' => now(),
                'expires_at' => now()->addDays($this->accessDays()),
                // Tagged so test grants can be found and cleared later.
                'source' => $this->sandbox() ? 'sandbox' : 'shortlink',
            ],
        );
    }

    /**
     * Active grants for a set of chapters, keyed by chapter id — used to badge
     * the series chapter list without a query per row.
     *
     * @return array<int, string> chapter id => ISO expiry
     */
    public function activeAccessMap(?User $user, array $chapterIds): array
    {
        if (! $user || ! $chapterIds) {
            return [];
        }

        return ChapterTemporaryAccess::where('user_id', $user->id)
            ->whereIn('chapter_id', $chapterIds)
            ->active()
            ->pluck('expires_at', 'chapter_id')
            ->map(fn ($expiresAt) => $expiresAt->toIso8601String())
            ->all();
    }
}
