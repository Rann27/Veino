<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

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
