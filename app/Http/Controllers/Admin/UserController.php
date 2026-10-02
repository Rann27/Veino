<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Transaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class UserController extends Controller
{
    /** Addresses listed per row before the rest collapse into "+N more". */
    private const IPS_SHOWN = 3;

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
        ];

        $sortKey = (string) $request->query('sort', 'joined');
        $sortKey = isset($sortable[$sortKey]) ? $sortKey : 'joined';
        $column = $sortable[$sortKey];
        $dir = $request->query('dir') === 'asc' ? 'asc' : 'desc';
        
        $users = User::select('id', 'display_name', 'email', 'role', 'coins', 'membership_tier', 'membership_expires_at', 'is_banned', 'created_at')
            ->when($search, function($query, $search) {
                return $query->where('display_name', 'like', "%{$search}%")
                           ->orWhere('email', 'like', "%{$search}%");
            })
            ->orderBy($column, $dir)
            // Keeps the sort and the search across page changes.
            ->paginate(20)
            ->withQueryString();

        // Sign-in addresses for the twenty rows on this page only, fetched in
        // one query and attached afterwards. Eager loading the relation would
        // pull every address a heavy account has ever used just to show three.
        $ips = DB::table('user_login_ips')
            ->whereIn('user_id', $users->pluck('id'))
            ->orderByDesc('last_seen_at')
            ->get(['user_id', 'ip', 'last_seen_at', 'logins'])
            ->groupBy('user_id');

        $users->through(function ($user) use ($ips) {
            $rows = $ips[$user->id] ?? collect();

            $user->ip_total = $rows->count();
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

        return redirect()->back()->with('success', "{$user->display_name} has been banned.");
    }

    public function unbanUser(User $user)
    {
        $user->update([
            'is_banned' => false,
            'ban_reason' => null,
            'banned_at' => null,
        ]);

        return redirect()->back()->with('success', "{$user->display_name} has been unbanned.");
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
}
