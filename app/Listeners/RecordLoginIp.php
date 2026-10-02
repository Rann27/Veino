<?php

namespace App\Listeners;

use App\Models\User;
use App\Models\UserLoginIp;
use Illuminate\Auth\Events\Login;
use Illuminate\Support\Facades\DB;

/**
 * Notes where a reader signed in from.
 *
 * Hooked to the Login event rather than to the login controller so that every
 * route in gets covered — the form, registration's automatic sign-in, and the
 * remember-me cookie, which never passes through the controller at all.
 */
class RecordLoginIp
{
    public function handle(Login $event): void
    {
        $user = $event->user;

        if (! $user instanceof User) {
            return;
        }

        $ip = request()->ip();

        if (! $ip) {
            return;
        }

        // Never allowed to cost anyone their sign-in. A bookkeeping row that
        // fails to write is worth strictly less than getting into the site.
        try {
            $now = now();

            $updated = DB::table('user_login_ips')
                ->where('user_id', $user->id)
                ->where('ip', $ip)
                ->update(['last_seen_at' => $now, 'logins' => DB::raw('logins + 1')]);

            if ($updated === 0) {
                UserLoginIp::create([
                    'user_id' => $user->id,
                    'ip' => $ip,
                    'first_seen_at' => $now,
                    'last_seen_at' => $now,
                    'logins' => 1,
                ]);
            }
        } catch (\Throwable) {
            // Lost a race, or the table is unavailable. Either way, silent.
        }
    }
}
