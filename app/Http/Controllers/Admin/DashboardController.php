<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Chapter;
use App\Models\Series;
use App\Models\User;
use App\Models\CoinPurchase;
use App\Models\ChapterPurchase;
use Inertia\Inertia;
use Carbon\Carbon;

class DashboardController extends Controller
{
    public function index()
    {
        // Calculate income statistics
        $currentMonth = Carbon::now()->startOfMonth();
        
        // Monthly income from coin purchases (completed only)
        $monthlyIncome = CoinPurchase::where('status', 'completed')
            ->where('created_at', '>=', $currentMonth)
            ->sum('price_usd');
        
        // Total income from coin purchases (completed only)
        $totalIncome = CoinPurchase::where('status', 'completed')
            ->sum('price_usd');

        $stats = [
            'total_users' => User::count(),
            'total_series' => Series::count(),
            'total_chapters' => Chapter::count(),
            'premium_chapters' => Chapter::where('is_premium', true)->count(),
            'monthly_income' => (float) ($monthlyIncome ?? 0),
            'total_income' => (float) ($totalIncome ?? 0),
            'recent_series' => Series::with('nativeLanguage')->latest()->take(5)->get(),
            'recent_chapters' => Chapter::with('series')->latest()->take(5)->get(),
        ];

        return Inertia::render('Admin/Dashboard', [
            'stats' => $stats,
        ]);
    }
}
