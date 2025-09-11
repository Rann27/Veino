<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class UserController extends Controller
{
    public function index(Request $request)
    {
        $search = $request->get('search');
        
        $users = User::when($search, function($query, $search) {
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

    public function addCoins(Request $request, User $user)
    {
        $validated = $request->validate([
            'coins' => 'required|integer|min:1',
        ]);

        $user->increment('coins', $validated['coins']);
        
        return redirect()->back()->with('success', "Added {$validated['coins']} coins to {$user->display_name}");
    }
}
