<?php

use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\HomeController;
use App\Http\Controllers\ExploreController;
use App\Http\Controllers\UserSeriesController;
use App\Http\Controllers\UserChapterController;
use App\Http\Controllers\Auth\RegisterController;
use App\Http\Controllers\Auth\ForgotPasswordController;
use App\Http\Controllers\AccountController;
use App\Http\Controllers\BookmarkController;
use App\Http\Controllers\PaymentController;
use App\Http\Controllers\SearchController;
use App\Http\Controllers\Admin\ChapterController;
use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\PaymentController as AdminPaymentController;
use App\Http\Controllers\Admin\SeriesController;
use App\Http\Controllers\Admin\TransactionHistoryController;
use App\Http\Controllers\Admin\UserController;
use Illuminate\Support\Facades\Auth;

// Authentication Routes
Route::get('/login', function () {
    return Inertia::render('Auth/Login');
})->name('login')->middleware('guest');

Route::post('/login', function (Illuminate\Http\Request $request) {
    $credentials = $request->validate([
        'email' => 'required|email',
        'password' => 'required',
    ]);

    if (Auth::attempt($credentials, $request->boolean('remember'))) {
        $request->session()->regenerate();
        return redirect()->intended(route('home'));
    }

    return back()->withErrors([
        'email' => 'The provided credentials do not match our records.',
    ]);
})->middleware('guest');

Route::get('/register', [RegisterController::class, 'showRegistrationForm'])
    ->name('register')->middleware('guest');

Route::post('/register', [RegisterController::class, 'register'])
    ->middleware('guest');

// Forgot Password Routes
Route::get('/password/forgot', [ForgotPasswordController::class, 'showForgotForm'])
    ->name('password.forgot')->middleware('guest');

Route::post('/password/verify', [ForgotPasswordController::class, 'verifyUser'])
    ->name('password.verify')->middleware('guest');

Route::get('/password/reset', [ForgotPasswordController::class, 'showResetForm'])
    ->name('password.reset.form')->middleware('guest');

Route::post('/password/reset', [ForgotPasswordController::class, 'resetPassword'])
    ->name('password.reset')->middleware('guest');

Route::post('/logout', function (Illuminate\Http\Request $request) {
    Auth::logout();
    $request->session()->invalidate();
    $request->session()->regenerateToken();
    return redirect('/');
})->name('logout');

// User-facing routes
Route::get('/', [HomeController::class, 'index'])->name('home');
Route::get('/explore', [ExploreController::class, 'index'])->name('explore');

// Buy Coins route
Route::get('/buy-coins', function () {
    $coinPackages = \App\Models\CoinPackage::orderBy('coin_amount')->get();
    return Inertia::render('BuyCoins', [
        'coinPackages' => $coinPackages
    ]);
})->name('buy-coins');

// Search routes
Route::get('/search', [SearchController::class, 'search'])->name('search');
Route::get('/api/search/suggestions', [SearchController::class, 'suggestions'])->name('search.suggestions');

// Discord redirect
Route::get('/discord', function () {
    return redirect('https://discord.gg/your-discord-server');
})->name('discord');

Route::get('/series/{slug}', [UserSeriesController::class, 'show'])->name('series.show');
Route::get('/series/{slug}/chapter/{chapter}', [UserChapterController::class, 'show'])->name('chapters.show');
Route::post('/series/{slug}/chapter/{chapter}/purchase', [UserChapterController::class, 'purchase'])
    ->name('chapters.purchase')->middleware('auth');

// Payment routes
Route::middleware('auth')->group(function () {
    Route::post('/payment/initiate/{coinPackage}', [PaymentController::class, 'initiatePayment'])->name('payment.initiate');
    Route::get('/payment/success', [PaymentController::class, 'handleSuccess'])->name('payment.success');
    Route::get('/payment/cancel', [PaymentController::class, 'handleCancel'])->name('payment.cancel');
});

// PayPal configuration (can be accessed without auth for frontend detection)
Route::get('/payment/paypal-config', [PaymentController::class, 'getPayPalConfig'])->name('payment.paypal-config');

// PayPal IPN (can be accessed without auth)
Route::post('/payment/paypal-ipn', [PaymentController::class, 'handleIPN'])->name('payment.paypal-ipn');

// Account routes (requires authentication)
Route::middleware('auth')->group(function () {
    Route::get('/account', [AccountController::class, 'dashboard'])->name('account.dashboard');
    Route::get('/account/library', [AccountController::class, 'library'])->name('account.library');
    Route::get('/account/bookmarks', [BookmarkController::class, 'index'])->name('account.bookmarks');
    Route::get('/account/coins', [AccountController::class, 'coins'])->name('account.coins');
    Route::get('/account/settings', [AccountController::class, 'settings'])->name('account.settings');
    
    // Profile update routes
    Route::put('/account/profile', [AccountController::class, 'updateProfile'])->name('account.profile.update');
    Route::put('/account/password', [AccountController::class, 'updatePassword'])->name('account.password.update');
    Route::delete('/account', [AccountController::class, 'deleteAccount'])->name('account.delete');

    // Bookmark routes
    Route::post('/series/{series}/bookmark', [BookmarkController::class, 'store'])->name('bookmarks.store');
    Route::delete('/series/{series}/bookmark', [BookmarkController::class, 'destroy'])->name('bookmarks.destroy');
    Route::delete('/bookmarks/{bookmark}', [BookmarkController::class, 'destroyById'])->name('bookmarks.destroy.id');
    Route::get('/series/{series}/bookmark/check', [BookmarkController::class, 'check'])->name('bookmarks.check');
});

// Admin Routes
Route::prefix('admin')->name('admin.')->middleware(['auth', 'admin'])->group(function () {
    // Dashboard
    Route::get('/', [DashboardController::class, 'index'])->name('dashboard');
    
    // Series Management
    Route::get('/series', [SeriesController::class, 'index'])->name('series.index');
    Route::get('/series/{series}', [SeriesController::class, 'show'])->name('series.show');
    Route::post('/series', [SeriesController::class, 'store'])->name('series.store');
    Route::put('/series/{series}', [SeriesController::class, 'update'])->name('series.update');
    Route::delete('/series/{series}', [SeriesController::class, 'destroy'])->name('series.destroy');
    Route::get('/series-form-data', [SeriesController::class, 'getFormData'])->name('series.form-data');
    
    // Chapter Management
    Route::post('/series/{series}/chapters', [ChapterController::class, 'store'])->name('chapters.store');
    Route::put('/chapters/{chapter}', [ChapterController::class, 'update'])->name('chapters.update');
    Route::delete('/chapters/{chapter}', [ChapterController::class, 'destroy'])->name('chapters.destroy');
    
    // User Management
    Route::get('/user-management', [UserController::class, 'index'])->name('users.index');
    Route::post('/users/{user}/ban', [UserController::class, 'banUser'])->name('users.ban');
    Route::post('/users/{user}/unban', [UserController::class, 'unbanUser'])->name('users.unban');
    Route::post('/users/{user}/add-coins', [UserController::class, 'addCoins'])->name('users.add-coins');
    
    // Payment & Shop Management
    Route::get('/payment-management', [AdminPaymentController::class, 'index'])->name('payment.index');
    Route::put('/coin-packages/{coinPackage}', [AdminPaymentController::class, 'updateCoinPackage'])->name('coin-packages.update');
    Route::put('/payment-settings', [AdminPaymentController::class, 'updatePaymentSettings'])->name('payment.settings');
    
    // Transaction History
    Route::get('/transaction-history', [TransactionHistoryController::class, 'index'])->name('transaction-history.index');
});

// API Routes for Theme Management
Route::prefix('api')->group(function () {
    Route::get('/themes', [App\Http\Controllers\Api\ThemeController::class, 'themes']);
    Route::middleware('auth')->group(function () {
        Route::get('/theme-preferences', [App\Http\Controllers\Api\ThemeController::class, 'index']);
        Route::put('/theme-preferences', [App\Http\Controllers\Api\ThemeController::class, 'update']);
    });
});

// Legal Pages
Route::get('/privacy', function () {
    return Inertia::render('Legal/Privacy');
})->name('privacy');

Route::get('/dmca', function () {
    return Inertia::render('Legal/DMCA');
})->name('dmca');

Route::get('/contact', function () {
    return Inertia::render('Legal/Contact');
})->name('contact');

// Test route for debugging
require_once 'test.php';

// Fallback route - must be last
Route::fallback(function () {
    return Inertia::render('Errors/NotFound');
});
