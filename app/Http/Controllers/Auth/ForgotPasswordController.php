<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Inertia\Inertia;

class ForgotPasswordController extends Controller
{
    /**
     * Show the forgot password form
     */
    public function showForgotForm()
    {
        return Inertia::render('Auth/ForgotPassword');
    }

    /**
     * Show the reset password form
     */
    public function showResetForm()
    {
        return Inertia::render('Auth/ResetPassword');
    }

    /**
     * Verify email + UID combination
     */
    public function verifyUser(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
            'uid' => 'required|string|size:8',
        ]);

        if ($validator->fails()) {
            return back()->withErrors($validator)->withInput();
        }

        $user = User::where('email', $request->email)
                   ->where('uid', strtoupper($request->uid))
                   ->first();

        if (!$user) {
            return back()->withErrors([
                'verification' => 'The email and UID combination is invalid. Please check your credentials.'
            ])->withInput();
        }

        // Store user ID in session for password reset
        session(['reset_user_id' => $user->id]);

        return redirect()->route('password.reset.form')->with('success', 'User verified! Please enter your new password.');
    }

    /**
     * Reset the password
     */
    public function resetPassword(Request $request)
    {
        // Check if user verification is in session
        if (!session('reset_user_id')) {
            return redirect()->route('password.forgot')
                           ->withErrors(['session' => 'Session expired. Please verify your credentials again.']);
        }

        $validator = Validator::make($request->all(), [
            'password' => 'required|string|min:8|confirmed',
        ]);

        if ($validator->fails()) {
            return back()->withErrors($validator);
        }

        $user = User::find(session('reset_user_id'));

        if (!$user) {
            session()->forget('reset_user_id');
            return redirect()->route('password.forgot')
                           ->withErrors(['user' => 'User not found. Please try again.']);
        }

        // Update password
        $user->update([
            'password' => Hash::make($request->password)
        ]);

        // Clear session
        session()->forget('reset_user_id');

        return redirect()->route('login')->with('success', 'Password has been reset successfully! You can now login with your new password.');
    }
}
