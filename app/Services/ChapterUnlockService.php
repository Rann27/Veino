<?php

namespace App\Services;

use App\Models\Chapter;
use App\Models\ChapterPurchase;
use App\Models\ChapterTemporaryAccess;
use App\Models\ChapterUnlockToken;
use App\Models\PaymentSetting;
use App\Models\User;
use App\Services\Shortlinks\AdLinkFlyClient;
use App\Services\Shortlinks\BearerJsonClient;
use App\Services\Shortlinks\ShortlinkProvider;
use App\Services\Shortlinks\ShrinkEarnClient;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Rules for unlocking a premium chapter through the shortlink ad challenge.
 *
 * The shortener is pluggable (Move2Link, ShrinkEarn; see config/shortlink.php
 * and the admin's provider setting). Everything below applies to whichever is
 * live; only the timing floor and the accepted referers differ per provider.
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

    public function __construct(
        private Move2LinkClient $move2link,
        private ShrinkEarnClient $shrinkearn,
    ) {}

    /** The network asked most recently, so lastError() reports its reason. */
    private ?ShortlinkProvider $lastProvider = null;

    /** Why the last shortlink attempt failed, for showing in the admin. */
    public function lastError(): ?string
    {
        return ($this->lastProvider ?? $this->provider())->lastError();
    }

    // ─── Provider ────────────────────────────────────────────────────────────

    /** @var array<string, ShortlinkProvider>|null */
    private ?array $providerCache = null;

    /** Every network the free unlock knows how to use, keyed by name. */
    public function providers(): array
    {
        return $this->providerCache ??= [
            'shrinkearn' => $this->shrinkearn,
            'shrtfly' => new AdLinkFlyClient('shrtfly', 'ShrtFly'),
            'safelinku' => new BearerJsonClient('safelinku', 'SafelinkU'),
            'move2link' => $this->move2link,
            'nexolink' => new BearerJsonClient('nexolink', 'Nexolink'),
        ];
    }

    /**
     * The networks in rotation, in order: the admin's list (Series
     * Management → Settings), else config's. Networks without a token are
     * left out, so a missing credential never sends a reader to a dead gate.
     *
     * @return array<int, ShortlinkProvider>
     */
    public function rotation(): array
    {
        $saved = PaymentSetting::get('unlock_shortlink_rotation');
        $names = $saved !== null && $saved !== ''
            ? array_map('trim', explode(',', (string) $saved))
            : (array) config('shortlink.rotation', []);

        // Settings saved before rotation existed named a single provider.
        if (($saved === null || $saved === '') && ($single = PaymentSetting::get('unlock_shortlink_provider'))) {
            $names = array_values(array_unique(array_merge([(string) $single], $names)));
        }

        $all = $this->providers();
        $list = [];
        foreach ($names as $name) {
            if (isset($all[$name]) && $all[$name]->configured() && ! in_array($all[$name], $list, true)) {
                $list[] = $all[$name];
            }
        }

        return $list ?: [$this->move2link];
    }

    /** The first network in rotation: what a reader's first unlock of the day uses. */
    public function provider(): ShortlinkProvider
    {
        return $this->rotation()[0];
    }

    public function providerNamed(?string $name): ShortlinkProvider
    {
        return $this->providers()[(string) $name] ?? $this->provider();
    }

    /**
     * The network for a reader's next run.
     *
     * Networks pay for one view per IP per day, so the Nth unlock granted to
     * an address today goes through the Nth network in rotation: a reader
     * using all five of their daily unlocks earns five paid views rather than
     * one paid and four ignored. Counted per address rather than per account
     * because that is what the networks count, and several accounts behind
     * one address are one visitor to them.
     */
    public function providerForRun(?string $ip): ShortlinkProvider
    {
        $rotation = $this->rotation();

        $done = $ip
            ? \App\Models\ChapterUnlockAttempt::where('ip', $ip)
                ->where('outcome', 'granted')
                ->where('created_at', '>=', now()->startOfDay())
                ->count()
            : 0;

        return $rotation[$done % count($rotation)];
    }

    /** Per-network tuning from config/shortlink.php. */
    private function providerConfig(string $key, mixed $default = null, ?ShortlinkProvider $provider = null): mixed
    {
        $name = ($provider ?? $this->provider())->name();

        return config("shortlink.providers.{$name}.{$key}", $default);
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
        return $this->claimable() && ($this->sandbox() || $this->provider()->configured());
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

    public const IP_LIMIT_MODES = ['off', 'rotation', 'custom'];

    /**
     * How the per-address cap is set: off, matched to the rotation, or a
     * fixed number. Settings saved before the modes existed only held the
     * number, so a positive one there reads as custom.
     */
    public function ipLimitMode(): string
    {
        $mode = (string) PaymentSetting::get('unlock_ip_limit_mode', '');

        if (in_array($mode, self::IP_LIMIT_MODES, true)) {
            return $mode;
        }

        return (int) PaymentSetting::get('unlock_ip_daily_limit', 0) > 0 ? 'custom' : 'off';
    }

    /**
     * Free unlocks one address may earn per day, across every account behind
     * it. 0 means no cap.
     *
     * Every network pays for one view per IP per day, so with N networks in
     * rotation an address earns N paid views a day and each unlock past that
     * hands out a premium chapter for nothing: "rotation" caps it right there
     * and follows the rotation as networks are added or dropped. Off by
     * default because the cost lands on strangers too; a mobile carrier's
     * CGNAT can put many unrelated readers behind one address.
     */
    public function ipDailyLimit(): int
    {
        return match ($this->ipLimitMode()) {
            'rotation' => count($this->rotation()),
            'custom' => max(0, (int) PaymentSetting::get('unlock_ip_daily_limit', 0)),
            default => 0,
        };
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
    public function challengeUrlFor(Chapter $chapter, ?ShortlinkProvider $provider = null): ?string
    {
        $provider ??= $this->provider();

        if ($this->sandbox()) {
            $this->ensureToken($chapter);

            return route('chapters.unlock.sandbox', $chapter->unlock_token);
        }

        // Rotation happens here rather than at the moment of the grant. The
        // reader is already waiting on an API call at this point, so the cost
        // is hidden; doing it during the claim would put a Move2Link round trip
        // in front of the redirect that hands them their chapter.
        $this->rotateIfDue($chapter, $provider);

        return $this->shortlinkFor($chapter, false, $provider);
    }

    /**
     * Where the live provider's links are kept.
     *
     * Move2Link links that land on the main site stay in the original
     * chapters.unlock_shortlink column, exactly as before, so the main site
     * running Move2Link behaves the same as it always has (and code from
     * before this change can still read them). Any other provider, or a copy
     * of the app on another host, keeps its links in chapter_shortlinks: a
     * test subdomain sharing this database must never write a link into the
     * column the main site serves, because that link would land readers on
     * the test subdomain.
     */
    private function usesLegacyColumn(ShortlinkProvider $provider): bool
    {
        return $provider->name() === 'move2link'
            && $this->landingHost() === strtolower((string) parse_url((string) config('shortlink.legacy_url'), PHP_URL_HOST));
    }

    private function landingHost(): string
    {
        return strtolower((string) parse_url((string) config('app.url'), PHP_URL_HOST));
    }

    private function storedLink(Chapter $chapter, string $token, ?ShortlinkProvider $provider = null): ?string
    {
        $provider ??= $this->provider();

        if ($this->usesLegacyColumn($provider)) {
            return $chapter->unlock_shortlink ?: null;
        }

        return DB::table('chapter_shortlinks')
            ->where('chapter_id', $chapter->id)
            ->where('provider', $provider->name())
            ->where('token', $token)
            ->where('host', $this->landingHost())
            ->value('url');
    }

    /** Records a link for $token. The caller persists the chapter itself. */
    private function storeLink(Chapter $chapter, string $token, string $url, ?ShortlinkProvider $provider = null): void
    {
        $provider ??= $this->provider();

        if ($this->usesLegacyColumn($provider)) {
            $chapter->unlock_shortlink = $url;
            $chapter->unlock_shortlink_at = now();

            return;
        }

        DB::table('chapter_shortlinks')->upsert(
            [[
                'chapter_id' => $chapter->id,
                'provider' => $provider->name(),
                'token' => $token,
                'host' => $this->landingHost(),
                'url' => $url,
                'created_at' => now(),
            ]],
            ['chapter_id', 'provider', 'token', 'host'],
            ['url', 'created_at'],
        );
    }

    /**
     * The live provider's current link for each chapter, for the admin's
     * chapter list. Chapters without one are left out.
     *
     * @return array<int, string> chapter id => shortlink
     */
    public function currentShortlinks(iterable $chapters): array
    {
        $map = [];

        foreach ($chapters as $chapter) {
            if ($chapter->unlock_token && ($url = $this->storedLink($chapter, $chapter->unlock_token))) {
                $map[$chapter->id] = $url;
            }
        }

        return $map;
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
    private function rotateIfDue(Chapter $chapter, ShortlinkProvider $provider): void
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
            $shortlink = $this->createShortlink($fresh, $newToken, $provider);

            if (! $shortlink) {
                return;   // Nothing touched. The current link keeps working.
            }

            ChapterUnlockToken::firstOrCreate(
                ['token' => $retiring],
                ['chapter_id' => $fresh->id, 'retired_at' => now()],
            );

            $fresh->unlock_token = $newToken;
            $this->storeLink($fresh, $newToken, $shortlink, $provider);
            $fresh->unlock_claim_count = 0;
            $this->persist($fresh);

            // Keep the caller's copy in step so it serves the new link now.
            $chapter->unlock_token = $newToken;
            $chapter->unlock_shortlink = $fresh->unlock_shortlink;
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

    public function shortlinkFor(Chapter $chapter, bool $regenerate = false, ?ShortlinkProvider $provider = null): ?string
    {
        $provider ??= $this->provider();

        if (! $regenerate && $chapter->unlock_token && ($stored = $this->storedLink($chapter, $chapter->unlock_token, $provider))) {
            return $stored;
        }

        if (! $chapter->unlock_token) {
            $chapter->unlock_token = $this->freshToken();
        }

        $shortlink = $this->createShortlink($chapter, $chapter->unlock_token, $provider);

        if (! $shortlink) {
            // Persist the token anyway so a later retry reuses the same URL.
            $this->persist($chapter);

            return null;
        }

        $this->storeLink($chapter, $chapter->unlock_token, $shortlink, $provider);
        $this->persist($chapter);

        return $shortlink;
    }

    /**
     * Asks the live provider for a link pointing at one specific token.
     *
     * Takes the token as an argument rather than reading it off the chapter so
     * rotation can mint a link for its replacement before anything is written —
     * the chapter still holds the old token while this runs.
     */
    private function createShortlink(Chapter $chapter, string $token, ShortlinkProvider $provider): ?string
    {
        $this->lastProvider = $provider;

        $series = $chapter->series;

        // Pinned to APP_URL rather than the host serving this request. route()
        // would otherwise bake whatever domain the admin happened to be on into
        // the shortlink — generate one from a staging subdomain and Move2Link
        // stores that address forever, so every link dies with the subdomain.
        $claimUrl = rtrim((string) config('app.url'), '/')
            .route('chapters.unlock.claim', $token, false);

        return $provider->createLink(
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

    /**
     * A shortlink made for one run only.
     *
     * The claim URL behind it carries a random code for this run, stored with
     * the run and checked on the claim. The reader only learns the code at
     * the end of the gate, so starting a run and opening the claim URL
     * directly (with a URL saved from before, or shared by someone) gets
     * nothing: every run's URL is different and dies with the run. This is
     * what makes the timing floor a second line rather than the only one.
     *
     * One API call per run, which at the free unlock's volume is far inside
     * every network's rate limit.
     *
     * @return array{0: string, 1: string}|null the shortlink and the run code
     */
    public function oneTimeLink(Chapter $chapter, ShortlinkProvider $provider): ?array
    {
        $this->ensureToken($chapter);
        $this->lastProvider = $provider;
        $run = Str::lower(Str::random(24));

        if ($this->sandbox()) {
            return [route('chapters.unlock.sandbox', ['token' => $chapter->unlock_token, 'run' => $run]), $run];
        }

        // Pinned to APP_URL, like the shared links were: the destination must
        // be the site the reader is on, not whatever host made the request.
        $claimUrl = rtrim((string) config('app.url'), '/')
            .route('chapters.unlock.claim', $chapter->unlock_token, false)
            .'?run='.$run;

        $series = $chapter->series;
        $link = $provider->createLink(
            $claimUrl,
            $series ? Str::limit($series->title.' — '.($chapter->title ?: 'Chapter '.$chapter->chapter_number), 250, '') : null
        );

        return $link ? [$link, $run] : null;
    }

    /**
     * The run this reader has under way for this chapter: its network, code
     * and link. Null when there is none.
     *
     * @return array{at: int, provider: ?string, run: ?string, link: ?string}|null
     */
    public function pendingRun(User $user, Chapter $chapter): ?array
    {
        $pending = Cache::get($this->pendingKey($user->id, $chapter->id));

        if ($pending === null) {
            return null;
        }

        // Runs started before one-time links hold a bare timestamp.
        return is_array($pending)
            ? ['at' => (int) ($pending['at'] ?? 0), 'provider' => $pending['provider'] ?? null, 'run' => $pending['run'] ?? null, 'link' => $pending['link'] ?? null]
            : ['at' => (int) $pending, 'provider' => null, 'run' => null, 'link' => null];
    }

    private function pendingKey(int $userId, int $chapterId): string
    {
        return "unlock:pending:{$userId}:{$chapterId}";
    }

    /**
     * The floor a run has to clear. Per provider: Move2Link's gate takes two
     * minutes, ShrinkEarn's about fifteen seconds, and one floor for both
     * would either refuse every honest ShrinkEarn reader or wave Move2Link
     * skippers through.
     */
    public function minChallengeSeconds(?ShortlinkProvider $provider = null): int
    {
        return max(0, (int) $this->providerConfig('min_seconds', self::MIN_CHALLENGE_SECONDS, $provider));
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
    public function startChallenge(User $user, Chapter $chapter, ?ShortlinkProvider $provider = null, ?string $run = null, ?string $link = null): bool
    {
        // The network is kept with the start time: the claim is checked
        // against that network's timing floor and referers, whichever one
        // the rotation would pick by the time the reader comes back.
        return Cache::add(
            $this->pendingKey($user->id, $chapter->id),
            [
                'at' => now()->timestamp,
                'provider' => ($provider ?? $this->provider())->name(),
                'run' => $run,
                'link' => $link,
            ],
            now()->addMinutes(self::PENDING_TTL_MINUTES)
        );
    }

    /**
     * The network of the run this reader has under way for this chapter, if
     * any. Pressing the button again mid-run must send them back through the
     * same gate, not the next one in rotation.
     */
    public function pendingProvider(User $user, Chapter $chapter): ?ShortlinkProvider
    {
        $pending = Cache::get($this->pendingKey($user->id, $chapter->id));

        if ($pending === null) {
            return null;
        }

        // Runs started before rotation hold a bare timestamp.
        return is_array($pending) ? $this->providerNamed($pending['provider'] ?? null) : $this->provider();
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
    public function consumeChallenge(User $user, Chapter $chapter, ?string $referer, ?string $currentHost = null, ?string $run = null): array
    {
        $key = $this->pendingKey($user->id, $chapter->id);
        $pending = Cache::get($key);
        $provider = is_array($pending) ? $this->providerNamed($pending['provider'] ?? null) : $this->provider();
        $startedAt = is_array($pending) ? ($pending['at'] ?? null) : $pending;
        $expectedRun = is_array($pending) ? ($pending['run'] ?? null) : null;

        if ($startedAt === null) {
            return [false, 'not_started', null];
        }

        Cache::forget($key);

        $elapsed = max(0, now()->timestamp - (int) $startedAt);

        // The run's own code, only learnt at the end of its gate. A run from
        // before one-time links has none to compare and is let through on the
        // other checks.
        if ($expectedRun !== null && ! hash_equals($expectedRun, (string) $run)) {
            return [false, 'bad_run', $elapsed];
        }

        // The stand-in gate has no real countdown to sit through, so holding
        // sandbox to the live threshold would just mean waiting 45 seconds for
        // nothing. Everything else — the pending record, single use, the tie to
        // this reader — is enforced exactly as in live mode.
        if (! $this->sandbox() && $elapsed < $this->minChallengeSeconds($provider)) {
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

            // Recorded, no longer refused. With a code per run the referer
            // proves nothing the code does not, and networks forward readers
            // through domains nobody can list in advance; refusing on it only
            // ever turned away honest readers. The monitor still shows it.
            if (! $this->fromProvider($host, $provider) && ! $matchesOwnHost) {
                return [true, 'ok', $elapsed, $host];
            }
        }

        return [true, 'ok', $elapsed];
    }

    /** Whether a referer host belongs to the live provider (config/shortlink.php). */
    private function fromProvider(string $host, ShortlinkProvider $provider): bool
    {
        $hosts = $this->providerConfig('referer_hosts', [], $provider);

        // null: this network's gate hops through changing blog domains, so
        // its referer says nothing; the other checks still apply.
        if ($hosts === null) {
            return true;
        }

        foreach ((array) $hosts as $entry) {
            $entry = strtolower(trim((string) $entry));
            if ($entry === '') {
                continue;
            }

            $matches = str_contains($entry, '.')
                ? $host === $entry || str_ends_with($host, '.'.$entry)
                : str_contains($host, $entry);

            if ($matches) {
                return true;
            }
        }

        return false;
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
