<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Inertia\Inertia;

class RegisterController extends Controller
{
    public function showRegistrationForm()
    {
        return Inertia::render('Auth/Register');
    }

    public function register(Request $request)
    {
        $request->validate([
            'display_name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8|confirmed',
        ]);

        $user = User::create([
            'name' => $request->display_name, // Set name sama dengan display_name untuk requirement Laravel
            'display_name' => $request->display_name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'uid' => Str::upper(Str::random(8)), // Random 8-character UID
            'coins' => 0, // Changed from coin_balance to coins
            'role' => 'user',
            'is_banned' => false,
        ]);

        Auth::login($user);

        return redirect()->route('home')->with('success', 'Welcome to Veinovel!');
    }
}
