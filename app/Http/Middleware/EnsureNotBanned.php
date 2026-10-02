<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

/**
 * Holds a banned account on the notice page and nowhere else.
 *
 * The ban used to be a flag almost nothing read: a banned reader could sign
 * in, read, spend coins and take free unlocks exactly as before — only buying
 * a membership was refused. This is what makes it mean something.
 *
 * Signing in is still allowed on purpose. Refusing authentication would leave
 * the reader staring at "wrong password" with no idea why, and no way to see
 * the reason or appeal it. They get in, and then they get here.
 */
class EnsureNotBanned
{
    /**
     * Routes a banned reader may still reach: the notice itself, the way out,
     * and the asset the page is built from. Without the first two this
     * redirects onto itself forever.
     */
    private const ALLOWED = ['user-banned', 'logout'];

    public function handle(Request $request, Closure $next): Response
    {
        $user = Auth::user();

        if (! $user || ! $user->is_banned) {
            return $next($request);
        }

        foreach (self::ALLOWED as $path) {
            if ($request->is($path) || $request->is($path.'/*')) {
                return $next($request);
            }
        }

        // An API or fetch call gets a status it can act on rather than a
        // redirect it would follow and then fail to parse.
        if ($request->expectsJson() && ! $request->header('X-Inertia')) {
            return response()->json([
                'message' => 'This account has been banned.',
                'reason' => $user->ban_reason,
            ], 403);
        }

        return redirect()->route('user.banned');
    }
}
