<?php

use Illuminate\Support\Facades\Route;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

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
