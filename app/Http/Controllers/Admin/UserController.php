<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Transaction;
use App\Services\FraudDetector;
use App\Support\IpNetworks;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class UserController extends Controller
{
    /** Addresses listed per row before the rest collapse into "+N more". */
    private const IPS_SHOWN = 3;

    /**
     * The network an address belongs to, in SQL: the /24 for IPv4, the /64 for
     * IPv6. Mirrors IpNetworks::network(), which does the same in PHP.
     *
     * Counting networks instead of raw addresses is what keeps an honest
     * reader off the top of the "most IPs" list. A home connection's address
     * is reshuffled by the ISP within its pool, and IPv6 privacy extensions
     * hand a phone a fresh address inside the same /64 every day; all of that
     * churn collapses into one network here.
     */
    private const NETWORK_SQL = "COALESCE(CASE WHEN IS_IPV4(ip) THEN SUBSTRING_INDEX(ip, '.', 3) ELSE HEX(LEFT(INET6_ATON(ip), 8)) END, ip)";

    public function index(Request $request)
    {
        $search = $request->get('search');

        // Ordered in SQL so "most coins" means most across every user, not just
        // the twenty on the current page.
        $sortable = [
            'user' => 'display_name',
            'email' => 'email',
            'role' => 'role',
            'coins' => 'coins',
            'membership' => 'membership_tier',
            'status' => 'is_banned',
            'joined' => 'created_at',
            // Peak networks at once, then distinct networks, then raw
            // addresses. Joined in only when asked for, see ipRanking().
            'ips' => null,
        ];

        $sortKey = (string) $request->query('sort', 'joined');
        $sortKey = array_key_exists($sortKey, $sortable) ? $sortKey : 'joined';
        $column = $sortable[$sortKey];
        $dir = $request->query('dir') === 'asc' ? 'asc' : 'desc';
        
        $users = User::select('users.id', 'users.display_name', 'users.email', 'users.role', 'users.coins', 'users.membership_tier', 'users.membership_expires_at', 'users.is_banned', 'users.created_at')
            ->when($search, function($query, $search) {
                return $query->where(fn ($q) => $q->where('users.display_name', 'like', "%{$search}%")
                    ->orWhere('users.email', 'like', "%{$search}%"));
            })
            ->when($sortKey === 'ips', function ($query) use ($dir) {
                $query->leftJoinSub($this->ipRanking(), 'ipr', 'ipr.user_id', '=', 'users.id')
                    ->orderByRaw('COALESCE(ipr.peak, 0) '.$dir)
                    ->orderByRaw('COALESCE(ipr.networks, 0) '.$dir)
                    ->orderByRaw('COALESCE(ipr.addresses, 0) '.$dir)
                    ->orderByDesc('users.id');
            }, fn ($query) => $query->orderBy('users.'.$column, $dir))
            // Keeps the sort and the search across page changes.
            ->paginate(20)
            ->withQueryString();

        // Sign-in addresses for the twenty rows on this page only, fetched in
        // one query and attached afterwards. Eager loading the relation would
        // pull every address a heavy account has ever used just to show three.
        $ips = DB::table('user_login_ips')
            ->whereIn('user_id', $users->pluck('id'))
            ->orderByDesc('last_seen_at')
            ->get(['user_id', 'ip', 'first_seen_at', 'last_seen_at', 'logins'])
            ->groupBy('user_id');

        $fraud = app(FraudDetector::class)->all();

        $users->through(function ($user) use ($ips, $fraud) {
            $rows = $ips[$user->id] ?? collect();

            // Only the headline goes on the row; the reasons live in the
            // Suspects panel, which has room to explain them.
            $verdict = $fraud[$user->id] ?? null;
            $user->risk = $verdict && $verdict['level'] !== 'low'
                ? ['level' => $verdict['level'], 'score' => $verdict['score'], 'cleared' => $verdict['cleared']]
                : null;

            $user->ip_total = $rows->count();
            [$user->ip_networks, $user->ip_peak] = IpNetworks::stats($rows);
            // Sharing only matters on a paid membership; the table flags it there.
            $user->paid_active = $user->hasActiveMembership();
            $user->ips = $rows->take(self::IPS_SHOWN)->map(fn ($r) => [
                'ip' => $r->ip,
                'last_seen' => $r->last_seen_at,
                'logins' => (int) $r->logins,
            ])->values();

            return $user;
        });

        return Inertia::render('Admin/Users/Index', [
            'users' => $users,
            'search' => $search,
            'sort' => ['key' => $sortKey, 'dir' => $dir],
        ]);
    }

    public function banUser(Request $request, User $user)
    {
        // An admin locking out a colleague is not worth supporting. The button
        // is disabled in the UI; this is the half that cannot be bypassed by
        // posting to the route directly.
        if ($user->role === 'admin') {
            return redirect()->back()->with('error', 'Admin accounts cannot be banned.');
        }

        $validated = $request->validate([
            'reason' => 'required|string|min:3|max:1000',
        ]);

        $user->update([
            'is_banned' => true,
            // Shown to the reader on the notice page, so it is written for
            // them rather than filed as an internal note.
            'ban_reason' => $validated['reason'],
            'banned_at' => now(),
        ]);

        app(FraudDetector::class)->forget();

        return redirect()->back()->with('success', "{$user->display_name} has been banned.");
    }

    public function unbanUser(User $user)
    {
        $user->update([
            'is_banned' => false,
            'ban_reason' => null,
            'banned_at' => null,
        ]);

        app(FraudDetector::class)->forget();

        return redirect()->back()->with('success', "{$user->display_name} has been unbanned.");
    }

    /**
     * Accounts the fraud check thinks are one person's spares, worst first.
     *
     * Loaded on demand by the Suspects panel, like the shared-address list.
     * Each suspect comes with the accounts it is linked to, since the useful
     * question is rarely "is this account bad" but "are these five accounts
     * the same person".
     */
    public function suspects(Request $request, FraudDetector $detector)
    {
        $includeLow = $request->boolean('all');
        $verdicts = collect($detector->all())
            ->filter(fn ($v) => $includeLow || $v['level'] !== 'low');

        $ids = $verdicts->keys()->merge($verdicts->pluck('linked')->flatten())->unique()->values();

        $people = User::whereIn('id', $ids)
            ->get(['id', 'display_name', 'email', 'is_banned', 'membership_tier', 'membership_expires_at', 'created_at', 'fraud_cleared_at'])
            ->keyBy('id');

        $grants = DB::table('chapter_temporary_access')
            ->whereIn('user_id', $ids)
            ->where('source', '!=', 'sandbox')
            ->select('user_id', DB::raw('COUNT(*) as n'))
            ->groupBy('user_id')
            ->pluck('n', 'user_id');

        $card = fn (User $u) => [
            'id' => $u->id,
            'display_name' => $u->display_name,
            'email' => $u->email,
            'is_banned' => (bool) $u->is_banned,
            'paid' => $u->hasActiveMembership(),
            'joined' => $u->created_at?->toISOString(),
            'free_unlocks' => (int) ($grants[$u->id] ?? 0),
        ];

        $suspects = $verdicts
            ->map(function ($v, $id) use ($people, $card) {
                $user = $people[$id] ?? null;
                if (! $user) {
                    return null;
                }

                return $card($user) + [
                    'score' => $v['score'],
                    'level' => $v['level'],
                    'reasons' => $v['reasons'],
                    'cleared' => $v['cleared'],
                    'cleared_at' => $user->fraud_cleared_at?->toISOString(),
                    'linked' => collect($v['linked'])
                        ->map(fn ($l) => isset($people[$l]) ? $card($people[$l]) : null)
                        ->filter()->values(),
                ];
            })
            ->filter()
            // Banned accounts are done with; keep them out of the way unless
            // they are the reason someone else is on the list.
            ->reject(fn ($s) => $s['is_banned'] && ! $includeLow)
            ->sortByDesc('score')
            ->values();

        return response()->json([
            'suspects' => $suspects,
            'thresholds' => ['high' => FraudDetector::HIGH, 'medium' => FraudDetector::MEDIUM],
        ]);
    }

    /**
     * "Looked at it, it's fine." Marks the account as reviewed until a new
     * linked account turns up. Changes nothing for the reader.
     */
    public function clearSuspect(User $user, FraudDetector $detector)
    {
        $user->forceFill(['fraud_cleared_at' => now()])->saveQuietly();
        $detector->forget();

        return response()->json(['ok' => true]);
    }

    public function unclearSuspect(User $user, FraudDetector $detector)
    {
        $user->forceFill(['fraud_cleared_at' => null])->saveQuietly();
        $detector->forget();

        return response()->json(['ok' => true]);
    }

    /**
     * Bans a suspect together with the accounts linked to it, under one reason.
     * Admins in the selection are skipped, matching banUser().
     */
    public function banSuspects(Request $request, FraudDetector $detector)
    {
        $validated = $request->validate([
            'ids' => 'required|array|min:1|max:200',
            'ids.*' => 'integer',
            'reason' => 'required|string|min:3|max:1000',
        ]);

        $banned = User::whereIn('id', $validated['ids'])
            ->where('role', '!=', 'admin')
            ->where('is_banned', false)
            ->update([
                'is_banned' => true,
                'ban_reason' => $validated['reason'],
                'banned_at' => now(),
            ]);

        $detector->forget();

        return response()->json(['banned' => $banned]);
    }

    /**
     * Accounts that have signed in from the same address.
     *
     * Answers the question the per-user column cannot: not "where has this
     * person been" but "who else is behind this address". A household shares
     * an address legitimately, so a pair is noise — it is the groups of four
     * and five that are worth a look.
     */
    public function sharedIps(Request $request)
    {
        $minimum = max(2, (int) $request->query('min', 2));

        $shared = DB::table('user_login_ips')
            ->select('ip', DB::raw('COUNT(DISTINCT user_id) as accounts'), DB::raw('MAX(last_seen_at) as last_seen'))
            ->groupBy('ip')
            ->havingRaw('COUNT(DISTINCT user_id) >= ?', [$minimum])
            ->orderByDesc('accounts')
            ->orderByDesc('last_seen')
            ->limit(50)
            ->get();

        if ($shared->isEmpty()) {
            return response()->json(['groups' => []]);
        }

        // One query for every account across every group, rather than one per
        // group — fifty groups would otherwise be fifty round trips.
        $rows = DB::table('user_login_ips')
            ->join('users', 'users.id', '=', 'user_login_ips.user_id')
            ->whereIn('user_login_ips.ip', $shared->pluck('ip'))
            ->select(
                'user_login_ips.ip',
                'users.id',
                'users.display_name',
                'users.email',
                'users.is_banned',
                'users.created_at',
                'user_login_ips.last_seen_at',
                'user_login_ips.logins',
            )
            ->orderByDesc('user_login_ips.last_seen_at')
            ->get()
            ->groupBy('ip');

        return response()->json([
            'groups' => $shared->map(fn ($g) => [
                'ip' => $g->ip,
                'accounts' => (int) $g->accounts,
                'last_seen' => $g->last_seen,
                'users' => ($rows[$g->ip] ?? collect())->map(fn ($u) => [
                    'id' => $u->id,
                    'display_name' => $u->display_name,
                    'email' => $u->email,
                    'is_banned' => (bool) $u->is_banned,
                    'joined' => $u->created_at,
                    'last_seen' => $u->last_seen_at,
                    'logins' => (int) $u->logins,
                ])->values(),
            ])->values(),
        ]);
    }

    public function addMembership(Request $request, User $user)
    {
        $validated = $request->validate([
            'duration_days' => 'required|integer|min:1',
            'tier' => ['nullable', Rule::in(User::PAID_TIERS)],
        ]);

        $durationDays = $validated['duration_days'];

        // Default to whatever paid tier the user already holds, so granting
        // extra days to an Exclusive member never quietly demotes them.
        $tier = $validated['tier']
            ?? ($user->hasActiveMembership() ? $user->membership_tier : 'premium');

        $user->grantMembership($tier, $durationDays);

        $tierLabel = $tier === 'exclusive' ? 'Premium Exclusive' : 'Premium';

        // Create transaction record for admin-granted membership
        Transaction::create([
            'user_id' => $user->id,
            'type' => 'admin_membership_grant',
            'status' => 'completed',
            'payment_method' => 'admin',
            'description' => "Admin granted {$durationDays} days {$tierLabel} membership",
        ]);
        
        // Set flash for congratulations modal (for user when they visit)
        session()->put("premium_granted_user_{$user->id}", [
            'days' => $durationDays,
            'package_name' => "Admin Grant ({$durationDays} Days)",
            'tier' => $tier,
            'source' => 'admin_grant',
            'expires_at' => now()->addHours(24)->timestamp
        ]);
        
        return redirect()->back()->with('success', "Added {$durationDays} days of {$tierLabel} membership to {$user->display_name}");
    }

    public function addCoins(Request $request, User $user)
    {
        $validated = $request->validate([
            'amount' => 'required|integer|min:1|max:1000000',
            'reason' => 'nullable|string|max:255',
        ]);

        $amount = $validated['amount'];
        $reason = $validated['reason'] ?? 'Admin Grant';
        
        // Add coins to user
        $user->increment('coins', $amount);
        
        // Create transaction record
        Transaction::create([
            'user_id' => $user->id,
            'type' => 'admin_grant',
            'coins_received' => $amount,
            'status' => 'completed',
            'payment_method' => 'admin',
            'description' => $reason,
        ]);
        
        return redirect()->back()->with('success', "Added {$amount} coins to {$user->display_name}");
    }

    public function deductCoins(Request $request, User $user)
    {
        $validated = $request->validate([
            'amount' => 'required|integer|min:1',
            'reason' => 'nullable|string|max:255',
        ]);

        $amount = $validated['amount'];
        $reason = $validated['reason'] ?? 'Admin Deduction';
        
        // Check if user has enough coins
        if ($user->coins < $amount) {
            return redirect()->back()->withErrors([
                'amount' => "User only has {$user->coins} coins. Cannot deduct {$amount} coins."
            ]);
        }
        
        // Deduct coins from user
        $user->decrement('coins', $amount);
        
        // Create transaction record
        Transaction::create([
            'user_id' => $user->id,
            'type' => 'admin_deduction',
            'coins_spent' => $amount,
            'status' => 'completed',
            'payment_method' => 'admin',
            'description' => $reason,
        ]);
        
        return redirect()->back()->with('success', "Deducted {$amount} coins from {$user->display_name}");
    }

    /**
     * IpNetworks::stats() for every account at once, in SQL, so "most IPs" ranks
     * the whole user base rather than the twenty rows on the current page.
     *
     * The peak always falls on the moment some span opens, so it is enough to
     * count, at each span's start, how many of the same account's spans are
     * open (started at or before it, not yet ended). Opens-before-closes at
     * the same instant, as in the PHP sweep.
     */
    private function ipRanking()
    {
        $spans = fn () => DB::table('user_login_ips')
            ->select('user_id')
            ->selectRaw(self::NETWORK_SQL.' as net, MIN(first_seen_at) as s, MAX(last_seen_at) as e, COUNT(*) as addresses')
            ->groupBy('user_id', 'net');

        $openAtStart = DB::query()
            ->fromSub($spans(), 'a')
            ->joinSub($spans(), 'b', fn ($j) => $j->on('b.user_id', '=', 'a.user_id')
                ->on('b.s', '<=', 'a.s')
                ->on('b.e', '>=', 'a.s'))
            ->select('a.user_id', 'a.net', 'a.addresses')
            ->selectRaw('COUNT(*) as open_count')
            ->groupBy('a.user_id', 'a.net', 'a.addresses');

        return DB::query()
            ->fromSub($openAtStart, 'o')
            ->select('user_id')
            ->selectRaw('MAX(open_count) as peak, COUNT(*) as networks, SUM(addresses) as addresses')
            ->groupBy('user_id');
    }
}
