<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Transaction;
use Illuminate\Http\Request;
use Inertia\Inertia;

class UserController extends Controller
{
    public function index(Request $request)
    {
        $search = $request->get('search');
        
        $users = User::select('id', 'display_name', 'email', 'role', 'coins', 'membership_tier', 'membership_expires_at', 'is_banned', 'created_at')
            ->when($search, function($query, $search) {
                return $query->where('display_name', 'like', "%{$search}%")
                           ->orWhere('email', 'like', "%{$search}%");
            })
            ->latest()
            ->paginate(20);

        return Inertia::render('Admin/Users/Index', [
            'users' => $users,
            'search' => $search,
        ]);
    }

    public function banUser(User $user)
    {
        $user->update(['is_banned' => true]);
        return redirect()->back()->with('success', 'User banned successfully');
    }

    public function unbanUser(User $user)
    {
        $user->update(['is_banned' => false]);
        return redirect()->back()->with('success', 'User unbanned successfully');
    }

    public function addMembership(Request $request, User $user)
    {
        $validated = $request->validate([
            'duration_days' => 'required|integer|min:1',
        ]);

        $durationDays = $validated['duration_days'];
        
        // Track if this is a new activation (not extension)
        $isNewActivation = !($user->membership_tier === 'premium' && $user->membership_expires_at && $user->membership_expires_at->isFuture());
        
        // If user already has premium, extend it; otherwise set new expiry
        if ($user->membership_tier === 'premium' && $user->membership_expires_at && $user->membership_expires_at->isFuture()) {
            // Extend existing membership
            $user->membership_expires_at = $user->membership_expires_at->addDays($durationDays);
        } else {
            // New membership or expired
            $user->membership_tier = 'premium';
            $user->membership_expires_at = now()->addDays($durationDays);
        }
        
        $user->save();
        
        // Create transaction record for admin-granted membership
        Transaction::create([
            'user_id' => $user->id,
            'type' => 'admin_membership_grant',
            'status' => 'completed',
            'payment_method' => 'admin',
            'description' => "Admin granted {$durationDays} days Premium membership",
        ]);
        
        // Set flash for congratulations modal (for user when they visit)
        session()->put("premium_granted_user_{$user->id}", [
            'days' => $durationDays,
            'package_name' => "Admin Grant ({$durationDays} Days)",
            'source' => 'admin_grant',
            'expires_at' => now()->addHours(24)->timestamp
        ]);
        
        return redirect()->back()->with('success', "Added {$durationDays} days of Premium membership to {$user->display_name}");
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
