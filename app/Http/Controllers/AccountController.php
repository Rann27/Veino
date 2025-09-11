<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rules\Password;
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
            'user' => $user->append('avatar_url'),
        ]);
    }

    public function updateProfile(Request $request)
    {
        $user = Auth::user();

        $validated = $request->validate([
            'display_name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email,' . $user->id,
            'bio' => 'nullable|string|max:500',
            'avatar' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
        ]);

        // Handle avatar upload if provided
        if ($request->hasFile('avatar')) {
            // Delete old avatar if exists
            if ($user->avatar) {
                Storage::disk('public')->delete($user->avatar);
            }

            $avatarPath = $request->file('avatar')->store('avatars', 'public');
            $validated['avatar'] = $avatarPath;
        }

        $user->update($validated);

        return back()->with('success', 'Profile updated successfully!');
    }

    public function updatePassword(Request $request)
    {
        $request->validate([
            'current_password' => 'required|string',
            'new_password' => ['required', 'confirmed', Password::defaults()],
        ]);

        $user = Auth::user();

        // Check if current password is correct
        if (!Hash::check($request->current_password, $user->password)) {
            return back()->withErrors([
                'current_password' => 'The current password is incorrect.',
            ]);
        }

        $user->update([
            'password' => Hash::make($request->new_password),
        ]);

        return back()->with('success', 'Password updated successfully!');
    }

    public function deleteAccount(Request $request)
    {
        $user = Auth::user();

        // Optional: Add password confirmation for additional security
        $request->validate([
            'password' => 'required|string',
        ]);

        if (!Hash::check($request->password, $user->password)) {
            return back()->withErrors([
                'password' => 'The password is incorrect.',
            ]);
        }

        // Delete user's avatar if exists
        if ($user->avatar) {
            Storage::disk('public')->delete($user->avatar);
        }

        // Log out the user
        Auth::logout();

        // Delete the user account
        $user->delete();

        // Invalidate the session
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/')->with('success', 'Your account has been deleted successfully.');
    }
}
