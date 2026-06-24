<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Schedule stale payment cancellation — OxaPay invoices expire in 60 min so run every 5 min
Schedule::command('payments:expire')
    ->everyFiveMinutes()
    ->timezone('UTC');

// Schedule membership expiration check (runs every 5 minutes)
Schedule::command('memberships:expire')
    ->everyFiveMinutes()
    ->timezone('UTC')
    ->onSuccess(function () {
        info('Membership expiration check completed successfully');
    })
    ->onFailure(function () {
        error('Membership expiration check failed');
    });
