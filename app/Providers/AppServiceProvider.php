<?php

namespace App\Providers;

use App\Listeners\RecordLoginIp;
use Illuminate\Auth\Events\Login;
use Illuminate\Support\Facades\Event;

use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Registered here rather than relying on listener auto-discovery, so
        // it cannot quietly stop working if that config changes.
        Event::listen(Login::class, RecordLoginIp::class);
    }
}
