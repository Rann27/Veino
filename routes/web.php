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
use App\Http\Controllers\MembershipController;
use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\SitemapController;
use App\Http\Controllers\EbookSeriesController;
use App\Http\Controllers\ChartController;
use App\Http\Controllers\BookshelfController;
use App\Http\Controllers\Admin\EbookSeriesController as AdminEbookSeriesController;
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

// Advertise page
Route::get('/advertise', function () {
    return Inertia::render('Advertise');
})->name('advertise');

// Membership routes
Route::middleware('auth')->group(function () {
    Route::get('/membership', [MembershipController::class, 'index'])->name('membership.index');
    Route::post('/membership/purchase', [MembershipController::class, 'purchase'])->name('membership.purchase');
    Route::get('/membership/status/{history}', [MembershipController::class, 'status'])->name('membership.status');
    
    // Simulation endpoint for testing (only in local environment)
    Route::get('/membership/simulate/{history}', [MembershipController::class, 'simulateSuccess'])->name('membership.simulate');
});

// Membership webhooks (public)
Route::post('/membership/webhook/{provider}', [MembershipController::class, 'webhook'])->name('membership.webhook');

// Buy Coins route
Route::get('/buy-coins', function () {
    $packages = \App\Models\CoinPackage::where('is_active', true)
        ->orderBy('coin_amount')
        ->get();
    
    return inertia('BuyCoins', [
        'packages' => $packages
    ]);
})->middleware('auth')->name('buy-coins');

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

// Blog Routes
Route::get('/blog/{blog}', [App\Http\Controllers\BlogController::class, 'show'])->name('blog.show');

// Voucher validation (requires authentication)
Route::post('/voucher/validate', [App\Http\Controllers\VoucherController::class, 'validate'])
    ->middleware('auth')
    ->name('voucher.validate');

// Ebook Shop Routes
Route::get('/epub-novels', [EbookSeriesController::class, 'index'])->name('epub-novels.index');
Route::get('/ebookseries/{slug}', [EbookSeriesController::class, 'show'])->name('epub-novels.show');

// Shopping Cart Routes (requires authentication)
Route::middleware('auth')->group(function () {
    Route::get('/my-chart', [ChartController::class, 'index'])->name('my-chart');
    Route::post('/chart/add', [ChartController::class, 'add'])->name('chart.add');
    Route::post('/chart/add-all', [ChartController::class, 'addAll'])->name('chart.add-all');
    Route::delete('/chart/remove', [ChartController::class, 'remove'])->name('chart.remove');
    Route::post('/chart/checkout', [ChartController::class, 'checkout'])->name('chart.checkout');
    
    // Bookshelf Routes
    Route::get('/bookshelf', [BookshelfController::class, 'index'])->name('bookshelf');
    Route::get('/ebook/download/{item}', [BookshelfController::class, 'download'])->name('ebook.download');
    Route::get('/ebook/download-pdf/{item}', [BookshelfController::class, 'downloadPdf'])->name('ebook.download.pdf');
});


// Payment routes
Route::middleware('auth')->group(function () {
    // New coin purchase flow
    Route::post('/payment/purchase', [PaymentController::class, 'purchase'])->name('payment.purchase');
    Route::get('/payment/status/{purchase}', [PaymentController::class, 'status'])->name('payment.status');
    Route::get('/payment/callback/{provider}/{purchase}', [PaymentController::class, 'callback'])->name('payment.callback');
    
    // Old payment routes (deprecated but kept for backward compatibility)
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
    Route::post('/chapters/upload-image', [ChapterController::class, 'uploadImage'])->name('chapters.upload-image');
    
    // User Management
    Route::get('/user-management', [UserController::class, 'index'])->name('users.index');
    Route::post('/users/{user}/ban', [UserController::class, 'banUser'])->name('users.ban');
    Route::post('/users/{user}/unban', [UserController::class, 'unbanUser'])->name('users.unban');
    Route::post('/users/{user}/add-membership', [UserController::class, 'addMembership'])->name('users.add-membership');
    Route::post('/users/{user}/add-coins', [UserController::class, 'addCoins'])->name('users.add-coins');
    Route::post('/users/{user}/deduct-coins', [UserController::class, 'deductCoins'])->name('users.deduct-coins');
    
    // Payment & Shop Management
    Route::get('/payment-management', [AdminPaymentController::class, 'index'])->name('payment.index');
    Route::put('/membership-packages/{membershipPackage}', [AdminPaymentController::class, 'updateMembershipPackage'])->name('membership-packages.update');
    Route::put('/coin-packages/{coinPackage}', [AdminPaymentController::class, 'updateCoinPackage'])->name('coin-packages.update');
    
    // Transaction History
    Route::get('/transaction-history', [TransactionHistoryController::class, 'index'])->name('transaction-history.index');
    
    // Blog Management
    Route::get('/blog', [App\Http\Controllers\Admin\BlogController::class, 'index'])->name('blog.index');
    Route::get('/blog/create', [App\Http\Controllers\Admin\BlogController::class, 'create'])->name('blog.create');
    Route::post('/blog', [App\Http\Controllers\Admin\BlogController::class, 'store'])->name('blog.store');
    Route::get('/blog/{blog}/edit', [App\Http\Controllers\Admin\BlogController::class, 'edit'])->name('blog.edit');
    Route::put('/blog/{blog}', [App\Http\Controllers\Admin\BlogController::class, 'update'])->name('blog.update');
    Route::delete('/blog/{blog}', [App\Http\Controllers\Admin\BlogController::class, 'destroy'])->name('blog.destroy');
    
    // Voucher Management
    Route::get('/voucher', [App\Http\Controllers\Admin\VoucherController::class, 'index'])->name('voucher.index');
    Route::get('/voucher/create', [App\Http\Controllers\Admin\VoucherController::class, 'create'])->name('voucher.create');
    Route::post('/voucher', [App\Http\Controllers\Admin\VoucherController::class, 'store'])->name('voucher.store');
    Route::get('/voucher/{voucher}/edit', [App\Http\Controllers\Admin\VoucherController::class, 'edit'])->name('voucher.edit');
    Route::put('/voucher/{voucher}', [App\Http\Controllers\Admin\VoucherController::class, 'update'])->name('voucher.update');
    Route::delete('/voucher/{voucher}', [App\Http\Controllers\Admin\VoucherController::class, 'destroy'])->name('voucher.destroy');
    Route::get('/voucher/{voucher}/usage', [App\Http\Controllers\Admin\VoucherController::class, 'usage'])->name('voucher.usage');
    
    // Advertisement Management
    Route::get('/advertisement-management', [App\Http\Controllers\Admin\AdvertisementController::class, 'index'])->name('advertisements.index');
    Route::post('/advertisements', [App\Http\Controllers\Admin\AdvertisementController::class, 'store'])->name('advertisements.store');
    Route::put('/advertisements/{advertisement}', [App\Http\Controllers\Admin\AdvertisementController::class, 'update'])->name('advertisements.update');
    Route::delete('/advertisements/{advertisement}', [App\Http\Controllers\Admin\AdvertisementController::class, 'destroy'])->name('advertisements.destroy');
    Route::post('/advertisements/{advertisement}/toggle-active', [App\Http\Controllers\Admin\AdvertisementController::class, 'toggleActive'])->name('advertisements.toggle-active');
    
        // Monitoring (Comments & Reactions)
    Route::get('/monitoring', [App\Http\Controllers\Admin\MonitoringController::class, 'index'])->name('monitoring.index');
    
    // Ebook Series Management
    Route::get('/ebookseries', [AdminEbookSeriesController::class, 'index'])->name('ebookseries.index');
    Route::get('/ebookseries/create', [AdminEbookSeriesController::class, 'create'])->name('ebookseries.create');
    Route::post('/ebookseries', [AdminEbookSeriesController::class, 'store'])->name('ebookseries.store');
    Route::get('/ebookseries/{series}/edit', [AdminEbookSeriesController::class, 'edit'])->name('ebookseries.edit');
    Route::put('/ebookseries/{series}', [AdminEbookSeriesController::class, 'update'])->name('ebookseries.update');
    Route::delete('/ebookseries/{series}', [AdminEbookSeriesController::class, 'destroy'])->name('ebookseries.destroy');
    Route::post('/ebookseries/cleanup-orphaned-files', [AdminEbookSeriesController::class, 'cleanupOrphanedFiles'])->name('ebookseries.cleanup');
    
    // Ebook Item Management
    Route::post('/ebookseries/{series}/items', [AdminEbookSeriesController::class, 'storeItem'])->name('ebookseries.items.store');
    Route::put('/ebookseries/{series}/items/{item}', [AdminEbookSeriesController::class, 'updateItem'])->name('ebookseries.items.update');
    Route::delete('/ebookseries/{series}/items/{item}', [AdminEbookSeriesController::class, 'destroyItem'])->name('ebookseries.items.destroy');
    
    Route::get('/monitoring/comments', [App\Http\Controllers\Admin\MonitoringController::class, 'getComments'])->name('monitoring.comments');
    Route::delete('/monitoring/comments/{id}', [App\Http\Controllers\Admin\MonitoringController::class, 'deleteComment'])->name('monitoring.comments.delete');
    Route::get('/monitoring/reactions', [App\Http\Controllers\Admin\MonitoringController::class, 'getReactions'])->name('monitoring.reactions');
    Route::get('/monitoring/views', [App\Http\Controllers\Admin\MonitoringController::class, 'getViews'])->name('monitoring.views');
    Route::get('/monitoring/series/{seriesId}/chapters', [App\Http\Controllers\Admin\MonitoringController::class, 'getChapters'])->name('monitoring.chapters');
});

// API Routes for Theme Management
Route::prefix('api')->group(function () {
    Route::get('/themes', [App\Http\Controllers\Api\ThemeController::class, 'themes']);
    Route::middleware('auth')->group(function () {
        Route::get('/theme-preferences', [App\Http\Controllers\Api\ThemeController::class, 'index']);
        Route::put('/theme-preferences', [App\Http\Controllers\Api\ThemeController::class, 'update']);
    });
});

// Comment & Reaction Routes
use App\Http\Controllers\CommentController;
use App\Http\Controllers\ReactionController;

Route::prefix('api')->group(function () {
    // Advertisement API (public)
    Route::get('/ads/interstitial/random', [App\Http\Controllers\Api\AdController::class, 'getRandomInterstitial'])->name('api.ads.interstitial');
    Route::get('/ads/banner/random', [App\Http\Controllers\Api\AdController::class, 'getRandomBanner'])->name('api.ads.banner');
    Route::get('/ads/in-text/random', [App\Http\Controllers\Api\AdController::class, 'getRandomInTextLinks'])->name('api.ads.in-text');
    Route::post('/ads/{advertisement}/track-impression', [App\Http\Controllers\Api\AdController::class, 'trackImpression'])->name('api.ads.track-impression');
    Route::post('/ads/{advertisement}/track-click', [App\Http\Controllers\Api\AdController::class, 'trackClick'])->name('api.ads.track-click');
    
    // Get comments (public)
    Route::get('/comments/{type}/{id}', [CommentController::class, 'index'])->name('comments.index');
    
    // Get reactions (public)
    Route::get('/reactions/{type}/{id}', [ReactionController::class, 'index'])->name('reactions.index');
    
    // Comment & Reaction actions (requires authentication)
    Route::middleware('auth')->group(function () {
        // Comments
        Route::post('/comments/{type}/{id}', [CommentController::class, 'store'])->name('comments.store');
        Route::put('/comments/{id}', [CommentController::class, 'update'])->name('comments.update');
        Route::delete('/comments/{id}', [CommentController::class, 'destroy'])->name('comments.destroy');
        
        // Reactions
        Route::post('/reactions/toggle', [ReactionController::class, 'toggle'])->name('reactions.toggle');
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

// Sitemap route
Route::get('/sitemap.xml', [SitemapController::class, 'index'])->name('sitemap');

// Test route for debugging
require_once 'test.php';

// Fallback route - must be last
Route::fallback(function () {
    return Inertia::render('Errors/NotFound');
});
