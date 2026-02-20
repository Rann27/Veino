<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Chapter;
use App\Models\EbookSeries;
use App\Models\Series;
use App\Models\User;
use App\Models\MembershipHistory;
use App\Models\MembershipPurchase;
use App\Models\Comment;
use Inertia\Inertia;
use Carbon\Carbon;

class DashboardController extends Controller
{
    public function index()
    {
        $now = Carbon::now();
        $currentMonth = $now->copy()->startOfMonth();
        $lastMonth = $now->copy()->subMonth()->startOfMonth();
        $lastMonthEnd = $now->copy()->subMonth()->endOfMonth();

        // Income statistics
        $monthlyIncome = MembershipHistory::where('status', 'completed')
            ->where('created_at', '>=', $currentMonth)
            ->sum('amount_usd');

        $lastMonthIncome = MembershipHistory::where('status', 'completed')
            ->whereBetween('created_at', [$lastMonth, $lastMonthEnd])
            ->sum('amount_usd');

        $totalIncome = MembershipHistory::where('status', 'completed')
            ->sum('amount_usd');

        // User statistics
        $totalUsers = User::count();
        $newUsersThisMonth = User::where('created_at', '>=', $currentMonth)->count();
        $newUsersLastMonth = User::whereBetween('created_at', [$lastMonth, $lastMonthEnd])->count();

        // Content statistics
        $totalSeries = Series::count();
        $totalChapters = Chapter::count();
        $premiumChapters = Chapter::where('is_premium', true)->count();
        $totalEbookSeries = class_exists(EbookSeries::class) ? EbookSeries::count() : 0;

        // Active memberships (non-expired)
        $activeMemberships = User::where('membership_tier', '!=', 'basic')
            ->where(function ($q) use ($now) {
                $q->whereNull('membership_expires_at')
                  ->orWhere('membership_expires_at', '>', $now);
            })->count();

        // Recent data
        $recentSeries = Series::with('nativeLanguage')->latest()->take(5)->get()
            ->map(fn($s) => [
                'id' => $s->id,
                'title' => $s->title,
                'status' => $s->status,
                'native_language' => ['name' => $s->nativeLanguage->name ?? 'Unknown'],
                'created_at' => $s->created_at,
                'cover_url' => $s->cover_url ?? null,
            ]);

        $recentChapters = Chapter::with('series')->latest()->take(5)->get()
            ->map(fn($c) => [
                'id' => $c->id,
                'title' => $c->title,
                'chapter_number' => $c->chapter_number,
                'is_premium' => $c->is_premium,
                'series' => ['title' => $c->series->title ?? 'Unknown'],
                'created_at' => $c->created_at,
            ]);

        $recentUsers = User::latest()->take(5)->get()
            ->map(fn($u) => [
                'id' => $u->id,
                'display_name' => $u->display_name,
                'email' => $u->email,
                'membership_tier' => $u->membership_tier,
                'created_at' => $u->created_at,
                'avatar_url' => $u->avatar_url ?? null,
            ]);

        $recentTransactions = MembershipHistory::with('user')
            ->where('status', 'completed')
            ->latest()
            ->take(5)
            ->get()
            ->map(fn($t) => [
                'id' => $t->id,
                'user_name' => $t->user->display_name ?? 'Unknown',
                'amount_usd' => (float) $t->amount_usd,
                'tier' => ucfirst($t->tier ?? 'Membership'),
                'payment_method' => $t->payment_method ?? '—',
                'created_at' => $t->created_at,
            ]);

        $stats = [
            'total_users' => $totalUsers,
            'new_users_this_month' => $newUsersThisMonth,
            'new_users_last_month' => $newUsersLastMonth,
            'total_series' => $totalSeries,
            'total_chapters' => $totalChapters,
            'premium_chapters' => $premiumChapters,
            'total_ebook_series' => $totalEbookSeries,
            'active_memberships' => $activeMemberships,
            'monthly_income' => (float) ($monthlyIncome ?? 0),
            'last_month_income' => (float) ($lastMonthIncome ?? 0),
            'total_income' => (float) ($totalIncome ?? 0),
            'recent_series' => $recentSeries,
            'recent_chapters' => $recentChapters,
            'recent_users' => $recentUsers,
            'recent_transactions' => $recentTransactions,
        ];

        return Inertia::render('Admin/Dashboard', [
            'stats' => $stats,
        ]);
    }
}
