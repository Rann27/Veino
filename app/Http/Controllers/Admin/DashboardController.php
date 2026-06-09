<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Chapter;
use App\Models\CoinPurchase;
use App\Models\EbookSeries;
use App\Models\MembershipHistory;
use App\Models\RequestCommission;
use App\Models\Series;
use App\Models\Transaction;
use App\Models\User;
use Carbon\Carbon;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index()
    {
        $now           = Carbon::now();
        $currentMonth  = $now->copy()->startOfMonth();
        $lastMonth     = $now->copy()->subMonth()->startOfMonth();
        $lastMonthEnd  = $now->copy()->subMonth()->endOfMonth();

        // ── Revenue breakdown ──────────────────────────────────────────────────

        // Coin package sales (USD)
        $monthlyCoinSalesUsd = (float) CoinPurchase::where('status', 'completed')
            ->where('created_at', '>=', $currentMonth)->sum('price_usd');
        $lastMonthCoinSalesUsd = (float) CoinPurchase::where('status', 'completed')
            ->whereBetween('created_at', [$lastMonth, $lastMonthEnd])->sum('price_usd');
        $totalCoinSalesUsd = (float) CoinPurchase::where('status', 'completed')->sum('price_usd');

        // Membership via real money (PayPal / OxaPay)
        $monthlyMembershipUsd = (float) MembershipHistory::where('status', 'completed')
            ->whereIn('payment_method', ['paypal', 'oxapay'])
            ->where('created_at', '>=', $currentMonth)->sum('amount_usd');
        $lastMonthMembershipUsd = (float) MembershipHistory::where('status', 'completed')
            ->whereIn('payment_method', ['paypal', 'oxapay'])
            ->whereBetween('created_at', [$lastMonth, $lastMonthEnd])->sum('amount_usd');
        $totalMembershipUsd = (float) MembershipHistory::where('status', 'completed')
            ->whereIn('payment_method', ['paypal', 'oxapay'])->sum('amount_usd');

        // Membership via coins (coin count)
        $monthlyMembershipCoins = (int) MembershipHistory::where('status', 'completed')
            ->where('payment_method', 'coins')
            ->where('created_at', '>=', $currentMonth)->sum('coin_price');
        $totalMembershipCoins = (int) MembershipHistory::where('status', 'completed')
            ->where('payment_method', 'coins')->sum('coin_price');

        // Epub revenue (coins spent on ebook purchases)
        $monthlyEbookCoins = (int) Transaction::where('type', 'ebook_purchase')
            ->where('status', 'completed')
            ->where('created_at', '>=', $currentMonth)->sum('coins_spent');
        $totalEbookCoins = (int) Transaction::where('type', 'ebook_purchase')
            ->where('status', 'completed')->sum('coins_spent');

        // Combined monthly/total USD
        $monthlyUsdTotal    = $monthlyCoinSalesUsd + $monthlyMembershipUsd;
        $lastMonthUsdTotal  = $lastMonthCoinSalesUsd + $lastMonthMembershipUsd;
        $totalUsd           = $totalCoinSalesUsd + $totalMembershipUsd;

        // ── Users ──────────────────────────────────────────────────────────────
        $totalUsers         = User::count();
        $newUsersThisMonth  = User::where('created_at', '>=', $currentMonth)->count();
        $newUsersLastMonth  = User::whereBetween('created_at', [$lastMonth, $lastMonthEnd])->count();

        $activeMemberships = User::where('membership_tier', '!=', 'basic')
            ->where(function ($q) use ($now) {
                $q->whereNull('membership_expires_at')
                  ->orWhere('membership_expires_at', '>', $now);
            })->count();

        // ── Requests ──────────────────────────────────────────────────────────
        $pendingRequests = RequestCommission::where('status', RequestCommission::STATUS_PENDING)->count();

        // ── Content ───────────────────────────────────────────────────────────
        $totalSeries      = Series::count();
        $totalChapters    = Chapter::count();
        $premiumChapters  = Chapter::where('is_premium', true)->count();
        $totalEbookSeries = class_exists(EbookSeries::class) ? EbookSeries::count() : 0;

        // ── Recent data ───────────────────────────────────────────────────────
        $recentSeries = Series::with('nativeLanguage')->latest()->take(5)->get()
            ->map(fn($s) => [
                'id'              => $s->id,
                'title'           => $s->title,
                'status'          => $s->status,
                'native_language' => ['name' => $s->nativeLanguage->name ?? 'Unknown'],
                'created_at'      => $s->created_at,
                'cover_url'       => $s->cover_url ?? null,
            ]);

        $recentChapters = Chapter::with('series')->latest()->take(5)->get()
            ->map(fn($c) => [
                'id'             => $c->id,
                'title'          => $c->title,
                'chapter_number' => $c->chapter_number,
                'is_premium'     => $c->is_premium,
                'series'         => ['title' => $c->series->title ?? 'Unknown'],
                'created_at'     => $c->created_at,
            ]);

        $recentUsers = User::latest()->take(5)->get()
            ->map(fn($u) => [
                'id'              => $u->id,
                'display_name'    => $u->display_name,
                'email'           => $u->email,
                'membership_tier' => $u->membership_tier,
                'created_at'      => $u->created_at,
                'avatar_url'      => $u->avatar_url ?? null,
            ]);

        // ── Chart history: last 12 months ─────────────────────────────────────
        $chartMonths = collect(range(11, 0))->map(function ($i) use ($now) {
            $month = $now->copy()->subMonths($i)->startOfMonth();
            return [
                'label'      => $month->format('M y'),
                'start'      => $month->copy(),
                'end'        => $month->copy()->endOfMonth(),
            ];
        });

        $chartData = $chartMonths->map(function ($m) {
            $coinUsd        = (float) CoinPurchase::where('status', 'completed')
                ->whereBetween('created_at', [$m['start'], $m['end']])->sum('price_usd');
            $membershipUsd  = (float) MembershipHistory::where('status', 'completed')
                ->whereIn('payment_method', ['paypal', 'oxapay'])
                ->whereBetween('created_at', [$m['start'], $m['end']])->sum('amount_usd');
            $newUsers       = User::whereBetween('created_at', [$m['start'], $m['end']])->count();
            $newChapters    = \App\Models\Chapter::whereBetween('created_at', [$m['start'], $m['end']])->count();
            $ebookCoins     = (int) Transaction::where('type', 'ebook_purchase')->where('status', 'completed')
                ->whereBetween('created_at', [$m['start'], $m['end']])->sum('coins_spent');
            $memberCoins    = (int) MembershipHistory::where('status', 'completed')
                ->where('payment_method', 'coins')
                ->whereBetween('created_at', [$m['start'], $m['end']])->sum('coin_price');

            return [
                'month'          => $m['label'],
                'coin_sales'     => $coinUsd,
                'membership_usd' => $membershipUsd,
                'total_usd'      => round($coinUsd + $membershipUsd, 2),
                'new_users'      => $newUsers,
                'new_chapters'   => $newChapters,
                'ebook_coins'    => $ebookCoins,
                'member_coins'   => $memberCoins,
                'total_coins'    => $ebookCoins + $memberCoins,
            ];
        })->values()->toArray();

        // Revenue by method (all time) — for pie chart
        $revenuePie = [
            ['name' => 'Coin Packages',     'value' => round($totalCoinSalesUsd, 2)],
            ['name' => 'Membership (USD)',   'value' => round($totalMembershipUsd, 2)],
            ['name' => 'Membership (Coins)', 'value' => $totalMembershipCoins],
            ['name' => 'Epub (Coins)',       'value' => $totalEbookCoins],
        ];

        $recentTransactions = MembershipHistory::with('user')
            ->where('status', 'completed')
            ->latest()->take(5)->get()
            ->map(fn($t) => [
                'id'             => $t->id,
                'user_name'      => $t->user->display_name ?? 'Unknown',
                'amount_usd'     => (float) $t->amount_usd,
                'coin_price'     => (int) $t->coin_price,
                'tier'           => ucfirst($t->tier ?? 'Membership'),
                'payment_method' => $t->payment_method ?? '—',
                'created_at'     => $t->created_at,
            ]);

        return Inertia::render('Admin/Dashboard', [
            'stats' => [
                // Users
                'total_users'          => $totalUsers,
                'new_users_this_month' => $newUsersThisMonth,
                'new_users_last_month' => $newUsersLastMonth,
                'active_memberships'   => $activeMemberships,
                // Requests
                'pending_requests'     => $pendingRequests,
                // Content
                'total_series'         => $totalSeries,
                'total_chapters'       => $totalChapters,
                'premium_chapters'     => $premiumChapters,
                'total_ebook_series'   => $totalEbookSeries,
                // Revenue — USD
                'monthly_coin_sales_usd'    => $monthlyCoinSalesUsd,
                'last_month_coin_sales_usd' => $lastMonthCoinSalesUsd,
                'total_coin_sales_usd'      => $totalCoinSalesUsd,
                'monthly_membership_usd'    => $monthlyMembershipUsd,
                'last_month_membership_usd' => $lastMonthMembershipUsd,
                'total_membership_usd'      => $totalMembershipUsd,
                'monthly_usd_total'         => $monthlyUsdTotal,
                'last_month_usd_total'      => $lastMonthUsdTotal,
                'total_usd'                 => $totalUsd,
                // Revenue — Coins
                'monthly_membership_coins' => $monthlyMembershipCoins,
                'total_membership_coins'   => $totalMembershipCoins,
                'monthly_ebook_coins'      => $monthlyEbookCoins,
                'total_ebook_coins'        => $totalEbookCoins,
                // Charts
                'chart_data'  => $chartData,
                'revenue_pie' => $revenuePie,
                // Recent
                'recent_series'       => $recentSeries,
                'recent_chapters'     => $recentChapters,
                'recent_users'        => $recentUsers,
                'recent_transactions' => $recentTransactions,
            ],
        ]);
    }
}
