<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Mail\PasswordResetOtp;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Validator;
use Inertia\Inertia;

class ForgotPasswordController extends Controller
{
    /**
     * Show the forgot password form (step 1: input email)
     */
    public function showForgotForm()
    {
        return Inertia::render('Auth/ForgotPassword');
    }

    /**
     * Show the reset password form (step 3: new password)
     */
    public function showResetForm()
    {
        if (!session('reset_user_id')) {
            return redirect()->route('password.forgot')
                ->withErrors(['session' => 'Session expired. Please start again.']);
        }

        return Inertia::render('Auth/ResetPassword');
    }

    /**
     * Send OTP to email (step 1 submit)
     */
    public function sendOtp(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
        ]);

        if ($validator->fails()) {
            return back()->withErrors($validator)->withInput();
        }

        $user = User::where('email', $request->email)->first();

        // Always return success to prevent email enumeration
        if (!$user) {
            return back()->with('otp_sent', true)->with('otp_email', $request->email);
        }

        // Delete any existing OTP for this email
        DB::table('password_reset_otps')->where('email', $request->email)->delete();

        // Generate 6-digit OTP
        $otp = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);

        // Store OTP with 10 minute expiry
        DB::table('password_reset_otps')->insert([
            'email'      => $request->email,
            'otp'        => $otp,
            'expires_at' => Carbon::now()->addMinutes(10),
            'created_at' => Carbon::now(),
            'updated_at' => Carbon::now(),
        ]);

        // Send OTP email
        Mail::to($request->email)->send(new PasswordResetOtp($otp, $user->display_name ?? $user->name ?? 'User'));

        return back()->with('otp_sent', true)->with('otp_email', $request->email);
    }

    /**
     * Verify OTP (step 2 submit)
     */
    public function verifyOtp(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
            'otp'   => 'required|string|size:6',
        ]);

        if ($validator->fails()) {
            return back()->withErrors($validator)->withInput();
        }

        $record = DB::table('password_reset_otps')
            ->where('email', $request->email)
            ->where('otp', $request->otp)
            ->first();

        if (!$record) {
            return back()->withErrors([
                'otp' => 'Invalid OTP code. Please check and try again.'
            ])->withInput();
        }

        if (Carbon::now()->isAfter($record->expires_at)) {
            DB::table('password_reset_otps')->where('email', $request->email)->delete();
            return back()->withErrors([
                'otp' => 'OTP has expired. Please request a new one.'
            ])->withInput();
        }

        $user = User::where('email', $request->email)->first();

        if (!$user) {
            return back()->withErrors(['otp' => 'Something went wrong. Please try again.']);
        }

        // OTP valid — delete it (single-use) and store user in session
        DB::table('password_reset_otps')->where('email', $request->email)->delete();
        session(['reset_user_id' => $user->id]);

        return redirect()->route('password.reset.form');
    }

    /**
     * Reset the password (step 3 submit)
     */
    public function resetPassword(Request $request)
    {
        if (!session('reset_user_id')) {
            return redirect()->route('password.forgot')
                ->withErrors(['session' => 'Session expired. Please start again.']);
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
                ->withErrors(['session' => 'Something went wrong. Please try again.']);
        }

        $user->update([
            'password' => Hash::make($request->password)
        ]);

        session()->forget('reset_user_id');

        return redirect()->route('login')
            ->with('success', 'Password reset successfully! You can now log in with your new password.');
    }

    /**
     * Legacy verifyUser — redirects to new flow
     */
    public function verifyUser(Request $request)
    {
        return redirect()->route('password.forgot');
    }
}
