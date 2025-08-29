<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class AccountController extends Controller
{
    public function dashboard()
    {
        $user = Auth::user();
        
        // Mock data for now - in real implementation, you'd fetch from database
        $recentReadings = [
            // Example data structure
            [
                'series_slug' => 'example-series',
                'series_title' => 'Example Series',
                'chapter_number' => 5,
                'chapter_title' => 'The Beginning',
                'last_read' => now()->subHours(2)->toISOString(),
                'progress' => 75
            ]
        ];
        
        $readingStats = [
            'totalChaptersRead' => 42,
            'totalSeriesFollowed' => 5,
            'totalCoinsSpent' => 150,
            'readingStreak' => 7
        ];
        
        return Inertia::render('Account/Dashboard', [
            'user' => $user,
            'recentReadings' => $recentReadings,
            'readingStats' => $readingStats,
        ]);
    }
    
    public function library()
    {
        $user = Auth::user();
        
        // TODO: Fetch user's followed series
        $followedSeries = [];
        
        return Inertia::render('Account/Library', [
            'followedSeries' => $followedSeries,
        ]);
    }
    
    public function bookmarks()
    {
        $user = Auth::user();
        
        // TODO: Fetch user's bookmarked chapters
        $bookmarks = [];
        
        return Inertia::render('Account/Bookmarks', [
            'bookmarks' => $bookmarks,
        ]);
    }
    
    public function history()
    {
        $user = Auth::user();
        
        // TODO: Fetch user's reading history
        $readingHistory = [];
        
        return Inertia::render('Account/History', [
            'readingHistory' => $readingHistory,
        ]);
    }
    
    public function coins()
    {
        $user = Auth::user();
        
        // TODO: Fetch coin packages and transaction history
        $coinPackages = \App\Models\CoinPackage::orderBy('coins')->get();
        $transactions = [];
        
        return Inertia::render('Account/Coins', [
            'coinPackages' => $coinPackages,
            'transactions' => $transactions,
        ]);
    }
    
    public function settings()
    {
        $user = Auth::user();
        
        return Inertia::render('Account/Settings', [
            'user' => $user,
        ]);
    }
}
