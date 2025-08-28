<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Chapter;
use App\Models\Series;
use App\Models\User;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index()
    {
        $stats = [
            'total_users' => User::count(),
            'total_series' => Series::count(),
            'total_chapters' => Chapter::count(),
            'premium_chapters' => Chapter::where('is_premium', true)->count(),
            'recent_series' => Series::with('nativeLanguage')->latest()->take(5)->get(),
            'recent_chapters' => Chapter::with('series')->latest()->take(5)->get(),
        ];

        return Inertia::render('Admin/Dashboard', [
            'stats' => $stats,
        ]);
    }
}
