<?php

use App\Http\Middleware\HandleInertiaRequests;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->web(append: [
            // First of the appended set: a banned account should be turned
            // away before anything else bothers to do work for it.
            \App\Http\Middleware\EnsureNotBanned::class,
            HandleInertiaRequests::class,
            AddLinkHeadersForPreloadedAssets::class,
            \App\Http\Middleware\CheckMembershipExpiration::class,
            \App\Http\Middleware\TrackPageView::class,
        ]);
        
        // Authoritative CSRF exemption list.
        //
        // These endpoints are called by PayPal and OxaPay, not by a browser, so
        // no CSRF token can ever accompany them. They used to be listed only in
        // App\Http\Middleware\VerifyCsrfToken, which Laravel 12 never registers
        // — every payment webhook was being rejected with a 419 and payments
        // relied entirely on the buyer returning to the status page.
        $middleware->validateCsrfTokens(except: [
            'voucher/validate',
            'payment/paypal-ipn',
            'payment/callback/*',
            'payment/webhook/*',
            'membership/webhook/*',
        ]);
        
        $middleware->alias([
            'admin' => \App\Http\Middleware\AdminMiddleware::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        //
    })->create();
