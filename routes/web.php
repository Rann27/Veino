<?php

use App\Http\Controllers\Admin\ChapterController;
use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\PaymentController;
use App\Http\Controllers\Admin\SeriesController;
use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\Auth\LoginController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('Welcome');
})->name('home');

// Auth Routes
Route::get('/login', [LoginController::class, 'showLoginForm'])->name('login');
Route::post('/login', [LoginController::class, 'login']);
Route::post('/logout', [LoginController::class, 'logout'])->name('logout');

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
