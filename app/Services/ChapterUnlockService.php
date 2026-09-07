<?php

namespace App\Services;

use App\Models\Chapter;
use App\Models\ChapterPurchase;
use App\Models\ChapterTemporaryAccess;
use App\Models\PaymentSetting;
use App\Models\User;
use Illuminate\Support\Facades\Cache;
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
     * Fastest a genuine run can finish. The Move2Link gate takes about a
     * minute, so anything materially quicker is someone who jumped straight to
     * the landing URL. Set below 60 on purpose — the clock starts when our
     * button is pressed, and shaving the threshold absorbs clock drift and
     * redirect overhead rather than punishing an honest reader.
     */
    private const MIN_CHALLENGE_SECONDS = 45;

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

        return $this->shortlinkFor($chapter);
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

        $series = $chapter->series;

        // Pinned to APP_URL rather than the host serving this request. route()
        // would otherwise bake whatever domain the admin happened to be on into
        // the shortlink — generate one from a staging subdomain and Move2Link
        // stores that address forever, so every link dies with the subdomain.
        $claimUrl = rtrim((string) config('app.url'), '/')
            .route('chapters.unlock.claim', $chapter->unlock_token, false);

        $shortlink = $this->move2link->createLink(
            $claimUrl,
            $series ? Str::limit($series->title.' — '.($chapter->title ?: 'Chapter '.$chapter->chapter_number), 250, '') : null
        );

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

    private function freshToken(): string
    {
        do {
            $token = Str::lower(Str::random(32));
        } while (Chapter::where('unlock_token', $token)->exists());

        return $token;
    }

    // ─── Pending challenge ───────────────────────────────────────────────────

    private function pendingKey(int $userId, int $chapterId): string
    {
        return "unlock:pending:{$userId}:{$chapterId}";
    }

    /** Records that this reader has set off towards the ad gate. */
    public function startChallenge(User $user, Chapter $chapter): void
    {
        Cache::put(
            $this->pendingKey($user->id, $chapter->id),
            now()->timestamp,
            now()->addMinutes(self::PENDING_TTL_MINUTES)
        );
    }

    /**
     * Consumes the pending record.
     *
     * @return array{0: bool, 1: string} success and a reason when it failed
     */
    public function consumeChallenge(User $user, Chapter $chapter, ?string $referer, ?string $currentHost = null): array
    {
        $key = $this->pendingKey($user->id, $chapter->id);
        $startedAt = Cache::get($key);

        if ($startedAt === null) {
            return [false, 'not_started'];
        }

        Cache::forget($key);

        // The stand-in gate has no real countdown to sit through, so holding
        // sandbox to the live threshold would just mean waiting 45 seconds for
        // nothing. Everything else — the pending record, single use, the tie to
        // this reader — is enforced exactly as in live mode.
        if (! $this->sandbox() && now()->timestamp - (int) $startedAt < self::MIN_CHALLENGE_SECONDS) {
            return [false, 'too_fast'];
        }

        // In sandbox the gate is our own page, so there is nothing to vouch for.
        if ($this->sandbox()) {
            return [true, 'ok'];
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
                return [false, 'bad_referer'];
            }
        }

        return [true, 'ok'];
    }

    // ─── Granting ────────────────────────────────────────────────────────────

    public function grant(User $user, Chapter $chapter): ChapterTemporaryAccess
    {
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
