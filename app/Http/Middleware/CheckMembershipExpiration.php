<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Illuminate\Support\Facades\Log;

class CheckMembershipExpiration
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Only check if user is authenticated
        if ($request->user()) {
            $user = $request->user();
            
            // Check if user has expired membership
            if ($user->isMembershipExpired()) {
                // Expire the membership immediately
                $user->expireMembership();
                
                Log::info('Membership auto-expired on request', [
                    'user_id' => $user->id,
                    'expired_at' => $user->membership_expires_at,
                ]);
            }
        }
        
        return $next($request);
    }
}
