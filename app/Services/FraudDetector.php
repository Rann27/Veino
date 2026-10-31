<?php

namespace App\Services;

use App\Models\User;
use App\Support\IpNetworks;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

/**
 * Scores accounts on how likely they are to be abused: one person's spare
 * accounts, or a paid membership passed around between people.
 *
 * The free unlock is the thing worth farming: every extra account is another
 * daily allowance of premium chapters, and Move2Link pays for one view per IP
 * per day, so the second account on a network earns nothing. A paid
 * membership is the thing worth sharing.
 *
 * Detection only. Nothing here acts on an account by itself; the score ranks
 * the Suspects panel and every consequence is an admin's call. No single
 * signal is proof, which is why they add up rather than trip anything.
 *
 * Deliberately not a signal on its own: many accounts behind one address.
 * Indonesian mobile carriers put thousands of subscribers behind a handful of
 * CGNAT addresses, so strangers share IPs all the time. What strangers do not
 * share is a registration minute, a mailbox, or a numbered username.
 */
class FraudDetector
{
    public const HIGH = 60;

    public const MEDIUM = 35;

    private const CACHE_KEY = 'fraud:analysis:v2';

    /** Short, so a farm made a minute ago is already on the list. */
    private const CACHE_SECONDS = 60;

    /**
     * Networks a paid member may have in use at once before it reads as a
     * shared account: phone, laptop, tablet at home, at work, on mobile data.
     * The owner's call; anything above it is flagged for review.
     */
    public const SHARING_TOLERANCE = 5;

    /** Accounts registered from one address this close together are linked. */
    private const BURST_HOURS = 24;

    /** Numbered look-alike names only count when made within this window. */
    private const NAME_WINDOW_DAYS = 7;

    /**
     * A first sign-in this soon after the account was created is the
     * registration itself (registration signs the reader straight in).
     * Accounts older than login tracking have no such row, and their earliest
     * address says nothing about where they signed up.
     */
    private const REGISTRATION_SLACK_MINUTES = 10;

    private const DISPOSABLE_DOMAINS = [
        'mailinator.com', 'guerrillamail.com', 'guerrillamail.net', 'sharklasers.com', 'grr.la',
        '10minutemail.com', 'temp-mail.org', 'tempmail.com', 'tempmail.net', 'tmpmail.org',
        'yopmail.com', 'yopmail.net', 'trashmail.com', 'getnada.com', 'dispostable.com',
        'maildrop.cc', 'mohmal.com', 'emailondeck.com', 'throwawaymail.com', 'fakeinbox.com',
        'mintemail.com', 'spamgourmet.com', 'mailnesia.com', 'tempail.com', 'moakt.com',
        'emailfake.com', 'tempr.email', 'discard.email', 'mail.tm', 'burnermail.io',
    ];

    /**
     * The verdict for one account, or null when nothing points at it.
     *
     * @return array{score: int, level: string, reasons: array<int, string>, linked: array<int, int>, cleared: bool}|null
     */
    public function for(int $userId): ?array
    {
        return $this->all()[$userId] ?? null;
    }

    /**
     * Every account with at least one signal, keyed by user id.
     *
     * @return array<int, array{score: int, level: string, reasons: array<int, string>, linked: array<int, int>, cleared: bool}>
     */
    public function all(): array
    {
        return Cache::remember(self::CACHE_KEY, self::CACHE_SECONDS, fn () => $this->analyse());
    }

    /** Called after a ban, unban or clearance, so the list never lags an admin's own action. */
    public function forget(): void
    {
        Cache::forget(self::CACHE_KEY);
    }

    /**
     * The whole analysis in one pass over three tables.
     *
     * Everything is loaded once and joined in memory. Each table holds one row
     * per account-and-thing rather than one per event, so this stays small for
     * as long as the user base does, and it is cheaper than the dozens of
     * per-account queries the same answers would take in SQL.
     */
    private function analyse(): array
    {
        $users = DB::table('users')
            ->get(['id', 'email', 'display_name', 'role', 'created_at', 'is_banned', 'fraud_cleared_at', 'membership_tier', 'membership_expires_at'])
            ->keyBy('id');

        $ips = DB::table('user_login_ips')
            ->get(['user_id', 'ip', 'first_seen_at', 'last_seen_at'])
            ->groupBy('user_id');

        $grants = DB::table('chapter_temporary_access')
            ->where('source', '!=', 'sandbox')
            ->get(['user_id', 'chapter_id'])
            ->groupBy('user_id')
            ->map(fn ($rows) => $rows->pluck('chapter_id')->unique()->all());

        $created = $users->map(fn ($u) => strtotime((string) $u->created_at));

        // ── Who is linked to whom, and how ─────────────────────────────────
        $burst = $this->registrationBursts($users, $ips, $created);
        $inbox = $this->sameInbox($users);
        $names = $this->numberedNames($users, $created);
        $shared = $this->sharedAddresses($ips);

        $results = [];

        foreach ($users as $id => $user) {
            if ($user->role === 'admin') {
                continue;
            }

            $score = 0;
            $reasons = [];
            $linked = [];

            if ($ids = $burst[$id] ?? []) {
                $score += min(55, 35 + 10 * (count($ids) - 1));
                $reasons[] = sprintf('Registered from the same address as %d other account%s within %dh', count($ids), count($ids) === 1 ? '' : 's', self::BURST_HOURS);
                $linked = array_merge($linked, $ids);
            }

            // Near-certain on its own: these addresses deliver to one inbox.
            if ($ids = $inbox[$id] ?? []) {
                $score += 60;
                $reasons[] = sprintf('Same mailbox as %d other account%s (Gmail dots/+tags)', count($ids), count($ids) === 1 ? '' : 's');
                $linked = array_merge($linked, $ids);
            }

            if ($ids = $names[$id] ?? []) {
                $score += min(50, 30 + 10 * (count($ids) - 1));
                $reasons[] = sprintf('Numbered look-alike name with %d other account%s made within %d days', count($ids), count($ids) === 1 ? '' : 's', self::NAME_WINDOW_DAYS);
                $linked = array_merge($linked, $ids);
            }

            // Weak on its own (CGNAT), so capped low; it mostly matters for
            // what it adds to the linked set below.
            $sharedOnly = array_values(array_diff($shared[$id] ?? [], $linked));
            if ($sharedOnly) {
                $score += min(16, 8 * count($sharedOnly));
                $reasons[] = sprintf('Signed in from an address also used by %d other account%s', count($sharedOnly), count($sharedOnly) === 1 ? '' : 's');
                $linked = array_merge($linked, $sharedOnly);
            }

            $linked = array_values(array_unique($linked));

            // Spare accounts are worth making for the free unlock; the giveaway
            // is two linked accounts pulling the same chapter.
            if ($linked && ($mine = $grants[$id] ?? [])) {
                $theirs = collect($linked)->flatMap(fn ($l) => $grants[$l] ?? [])->unique()->all();
                $same = count(array_intersect($mine, $theirs));
                if ($same > 0) {
                    $score += min(40, 25 + 5 * ($same - 1));
                    $reasons[] = sprintf('Unlocked %d chapter%s that a linked account also unlocked for free', $same, $same === 1 ? '' : 's');
                }
            }

            $bannedLinks = collect($linked)->filter(fn ($l) => (bool) ($users[$l]->is_banned ?? false))->count();
            if ($bannedLinks > 0) {
                $score += 20;
                $reasons[] = sprintf('Linked to %d banned account%s', $bannedLinks, $bannedLinks === 1 ? '' : 's');
            }

            // Only a paid membership is worth sharing, so free accounts are
            // left alone however many places they read from.
            if ($this->paid($user)) {
                [, $peak] = IpNetworks::stats($ips[$id] ?? collect());
                if ($peak > self::SHARING_TOLERANCE) {
                    $score += $peak >= self::SHARING_TOLERANCE + 3 ? 65 : 45;
                    $reasons[] = "Paid membership used from {$peak} networks at once (tolerance ".self::SHARING_TOLERANCE.'): possibly shared';
                }
            }

            $domain = strtolower(substr(strrchr((string) $user->email, '@') ?: '', 1));
            if (in_array($domain, self::DISPOSABLE_DOMAINS, true)) {
                $score += 15;
                $reasons[] = "Disposable email domain ({$domain})";
            }

            if ($score === 0) {
                continue;
            }

            $results[$id] = [
                'score' => $score,
                'level' => $score >= self::HIGH ? 'high' : ($score >= self::MEDIUM ? 'medium' : 'low'),
                'reasons' => $reasons,
                'linked' => $linked,
                'cleared' => $this->clearanceHolds($user, $linked, $created),
            ];
        }

        return $results;
    }

    /** Same test as User::hasActiveMembership(), on a plain row. */
    private function paid(object $user): bool
    {
        return in_array($user->membership_tier, User::PAID_TIERS, true)
            && $user->membership_expires_at
            && strtotime((string) $user->membership_expires_at) > time();
    }

    /**
     * A clearance covers the evidence an admin actually looked at. A new
     * linked account made after it reopens the case, so "cleared once" cannot
     * become a permanent shelter for a farm that keeps growing.
     */
    private function clearanceHolds(object $user, array $linked, Collection $created): bool
    {
        if (! $user->fraud_cleared_at) {
            return false;
        }

        $clearedAt = strtotime((string) $user->fraud_cleared_at);
        $newest = collect($linked)->map(fn ($l) => $created[$l] ?? 0)->max() ?? 0;

        return $newest <= $clearedAt;
    }

    /** @return array<int, array<int, int>> accounts registered from one address close together */
    private function registrationBursts(Collection $users, Collection $ips, Collection $created): array
    {
        $registeredFrom = [];

        foreach ($ips as $userId => $rows) {
            if (! isset($created[$userId])) {
                continue;
            }
            $first = $rows->sortBy('first_seen_at')->first();
            $gap = strtotime((string) $first->first_seen_at) - $created[$userId];

            if ($gap >= 0 && $gap <= self::REGISTRATION_SLACK_MINUTES * 60) {
                $registeredFrom[$first->ip][] = $userId;
            }
        }

        $links = [];
        foreach ($registeredFrom as $group) {
            foreach ($group as $a) {
                foreach ($group as $b) {
                    if ($a !== $b && abs($created[$a] - $created[$b]) <= self::BURST_HOURS * 3600) {
                        $links[$a][] = $b;
                    }
                }
            }
        }

        return $links;
    }

    /**
     * Gmail ignores dots and anything after a "+", so j.o.h.n+1@gmail.com and
     * john@gmail.com are one inbox. A classic way to mint accounts from one
     * address, and impossible to arrive at by accident.
     *
     * @return array<int, array<int, int>>
     */
    private function sameInbox(Collection $users): array
    {
        $groups = [];

        foreach ($users as $id => $user) {
            [$local, $domain] = array_pad(explode('@', strtolower((string) $user->email), 2), 2, '');

            if (! in_array($domain, ['gmail.com', 'googlemail.com'], true)) {
                continue;
            }

            $groups[str_replace('.', '', explode('+', $local)[0])][] = $id;
        }

        return $this->pairUp($groups);
    }

    /**
     * masdanmis11 and masdanmis12: the same stem with a counter on the end,
     * made within days of each other. Checked on both the email's local part
     * and the display name, since farmers often vary only one of them.
     *
     * @return array<int, array<int, int>>
     */
    private function numberedNames(Collection $users, Collection $created): array
    {
        $groups = [];

        foreach ($users as $id => $user) {
            $candidates = [
                strtolower(explode('@', (string) $user->email)[0]),
                strtolower((string) $user->display_name),
            ];

            foreach (array_unique($candidates) as $raw) {
                $clean = preg_replace('/[^a-z0-9]/', '', $raw);

                // A counter is required: two readers both called "rizky" are
                // just two readers called Rizky.
                if (! preg_match('/^(.*?[a-z])(\d+)$/', $clean, $m) || strlen($m[1]) < 4) {
                    continue;
                }

                $groups[$m[1]][$id] = true;
            }
        }

        $links = [];
        foreach ($groups as $members) {
            $members = array_keys($members);
            foreach ($members as $a) {
                foreach ($members as $b) {
                    if ($a !== $b && abs($created[$a] - $created[$b]) <= self::NAME_WINDOW_DAYS * 86400) {
                        $links[$a][$b] = $b;
                    }
                }
            }
        }

        return array_map('array_values', $links);
    }

    /** @return array<int, array<int, int>> accounts that signed in from an identical address */
    private function sharedAddresses(Collection $ips): array
    {
        $byIp = [];

        foreach ($ips as $userId => $rows) {
            foreach ($rows as $row) {
                $byIp[$row->ip][$userId] = $userId;
            }
        }

        return $this->pairUp(array_map('array_values', $byIp));
    }

    /**
     * @param  array<string, array<int, int>>  $groups
     * @return array<int, array<int, int>>
     */
    private function pairUp(array $groups): array
    {
        $links = [];

        foreach ($groups as $members) {
            $members = array_values(array_unique($members));
            if (count($members) < 2) {
                continue;
            }
            foreach ($members as $a) {
                foreach ($members as $b) {
                    if ($a !== $b) {
                        $links[$a][$b] = $b;
                    }
                }
            }
        }

        return array_map('array_values', $links);
    }
}
