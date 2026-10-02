<?php

use Illuminate\Support\Facades\Route;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

// Local development only.
//
// This is an unauthenticated GET that mints an account with 100 coins on every
// hit — no rate limit, no token, nothing. Left reachable in production it is a
// one-URL account farm, which is the exact problem the ban and shared-address
// tooling exists to fight. Environment decides, matching how sandbox mode is
// gated in ChapterUnlockService.
if (app()->environment('local')) {

Route::get('/test-register', function () {
    try {
        $user = User::create([
            'name' => 'Test User',
            'display_name' => 'Test User',
            'email' => 'test' . time() . '@example.com', // Unique email
            'password' => Hash::make('password123'),
            'uid' => Str::upper(Str::random(8)),
            'coins' => 100,
            'role' => 'user',
            'is_banned' => false,
        ]);
        
        return response()->json([
            'success' => true,
            'user_id' => $user->id,
            'message' => 'User created successfully'
        ]);
    } catch (\Exception $e) {
        return response()->json([
            'success' => false,
            'error' => $e->getMessage(),
            'trace' => $e->getTraceAsString()
        ], 500);
    }
});

}
