<?php

use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\HomeController;
use App\Http\Controllers\ExploreController;
use App\Http\Controllers\UserSeriesController;
use App\Http\Controllers\UserChapterController;
use App\Http\Controllers\Auth\RegisterController;
use App\Http\Controllers\AccountController;
use App\Http\Controllers\Admin\ChapterController;
use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\PaymentController;
use App\Http\Controllers\Admin\SeriesController;
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

Route::post('/logout', function (Illuminate\Http\Request $request) {
    Auth::logout();
    $request->session()->invalidate();
    $request->session()->regenerateToken();
    return redirect('/');
})->name('logout');

// User-facing routes
Route::get('/', [HomeController::class, 'index'])->name('home');
Route::get('/explore', [ExploreController::class, 'index'])->name('explore');

Route::get('/series/{slug}', [UserSeriesController::class, 'show'])->name('series.show');
Route::get('/series/{slug}/chapter/{chapter}', [UserChapterController::class, 'show'])->name('chapters.show');
Route::post('/series/{slug}/chapter/{chapter}/purchase', [UserChapterController::class, 'purchase'])
    ->name('chapters.purchase')->middleware('auth');

// Account routes (requires authentication)
Route::middleware('auth')->group(function () {
    Route::get('/account', [AccountController::class, 'dashboard'])->name('account.dashboard');
    Route::get('/account/library', [AccountController::class, 'library'])->name('account.library');
    Route::get('/account/bookmarks', [AccountController::class, 'bookmarks'])->name('account.bookmarks');
    Route::get('/account/coins', [AccountController::class, 'coins'])->name('account.coins');
    Route::get('/account/settings', [AccountController::class, 'settings'])->name('account.settings');
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
    Route::get('/payment-management', [PaymentController::class, 'index'])->name('payment.index');
    Route::put('/coin-packages/{coinPackage}', [PaymentController::class, 'updateCoinPackage'])->name('coin-packages.update');
    Route::put('/payment-settings', [PaymentController::class, 'updatePaymentSettings'])->name('payment.settings');
});
