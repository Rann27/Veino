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
        
        // Get membership status
        $membershipStatus = [
            'is_premium' => $user->hasActiveMembership(),
            'tier' => $user->hasActiveMembership() ? ucfirst($user->membership_tier) : null,
            'expires_at' => $user->membership_expires_at ? $user->membership_expires_at->toISOString() : null,
        ];
        
        // Get membership transactions (completed only)
        $membershipTransactions = \App\Models\MembershipHistory::where('user_id', $user->id)
            ->where('status', 'completed')
            ->orderBy('completed_at', 'desc')
            ->limit(10)
            ->get()
            ->map(function ($transaction) {
                return [
                    'id' => $transaction->id,
                    'invoice_number' => $transaction->invoice_number,
                    'tier' => ucfirst($transaction->tier),
                    'duration_days' => $transaction->duration_days,
                    'amount_usd' => $transaction->amount_usd,
                    'payment_method' => $transaction->payment_method,
                    'status' => $transaction->status,
                    'purchased_at' => $transaction->completed_at ? $transaction->completed_at->toISOString() : $transaction->created_at->toISOString(),
                    'starts_at' => $transaction->starts_at ? $transaction->starts_at->toISOString() : null,
                    'expires_at' => $transaction->expires_at ? $transaction->expires_at->toISOString() : null,
                ];
            });
        
        // Get reading history (last 10)
        $readingHistory = \App\Models\ReadingHistory::where('user_id', $user->id)
            ->with(['series', 'chapter'])
            ->orderBy('last_read_at', 'desc')
            ->limit(10)
            ->get()
            ->map(function ($history) {
                return [
                    'series_id' => $history->series_id,
                    'series_title' => $history->series->title,
                    'series_slug' => $history->series->slug,
                    'series_cover_url' => $history->series->cover_image_url,
                    'chapter_id' => $history->chapter_id,
                    'chapter_number' => $history->chapter->chapter_number,
                    'chapter_title' => $history->chapter->title,
                    'last_read_at' => $history->last_read_at->toISOString(),
                ];
            });
        
        return Inertia::render('Account/UserDashboard', [
            'user' => $user->append('avatar_url'),
            'membershipStatus' => $membershipStatus,
            'membershipTransactions' => $membershipTransactions,
            'readingHistory' => $readingHistory,
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
        
        // Fetch coin packages
        $coinPackages = \App\Models\CoinPackage::where('is_active', true)
            ->orderBy('coin_amount')
            ->get()
            ->map(function ($package) {
                return [
                    'id' => $package->id,
                    'name' => $package->name,
                    'coin_amount' => $package->coin_amount,
                    'bonus_premium_days' => $package->bonus_premium_days,
                    'price_usd' => $package->price_usd,
                    'is_active' => $package->is_active,
                ];
            });
        
        // Fetch coin purchase transactions
        $transactions = \App\Models\CoinPurchase::where('user_id', $user->id)
            ->where('status', 'completed')
            ->orderBy('created_at', 'desc')
            ->limit(20)
            ->get()
            ->map(function ($transaction) {
                return [
                    'id' => $transaction->id,
                    'coins_amount' => $transaction->coins_amount,
                    'price_usd' => $transaction->price_usd,
                    'payment_method' => $transaction->payment_method,
                    'transaction_id' => $transaction->transaction_id,
                    'status' => $transaction->status,
                    'purchased_at' => $transaction->created_at->toISOString(),
                ];
            });
        
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
