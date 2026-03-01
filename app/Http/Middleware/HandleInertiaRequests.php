<?php

namespace App\Http\Middleware;

use Illuminate\Foundation\Inspiring;
use Illuminate\Http\Request;
use Inertia\Middleware;
use Tighten\Ziggy\Ziggy;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        [$message, $author] = str(Inspiring::quotes()->random())->explode('-');

        // Check if user has pending premium_granted from admin
        $premiumGrantedFromAdmin = null;
        if ($request->user()) {
            $sessionKey = "premium_granted_user_{$request->user()->id}";
            $stored = session()->get($sessionKey);
            
            if ($stored && isset($stored['expires_at']) && $stored['expires_at'] > now()->timestamp) {
                $premiumGrantedFromAdmin = [
                    'days' => $stored['days'],
                    'package_name' => $stored['package_name'],
                    'source' => $stored['source']
                ];
                // Remove after first access
                session()->forget($sessionKey);
            }
        }

        // Prioritize admin grant over flash (flash is for immediate feedback, admin grant can be delayed)
        $premiumGrantedData = $premiumGrantedFromAdmin ?? session('premium_granted');

        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'quote' => ['message' => trim($message), 'author' => trim($author)],
            'auth' => [
                'user' => $request->user() ? [
                    'id' => $request->user()->id,
                    'display_name' => $request->user()->display_name,
                    'email' => $request->user()->email,
                    'coins' => $request->user()->coins,
                    'membership_tier' => $request->user()->membership_tier,
                    'membership_expires_at' => $request->user()->membership_expires_at,
                    'avatar' => $request->user()->avatar,
                    'avatar_url' => $request->user()->avatar_url,
                    'role' => $request->user()->role,
                ] : null,
            ],
            'flash' => [
                'success' => session('success'),
                'error' => session('error'),
                'premium_granted' => $premiumGrantedData,
                'otp_sent' => session('otp_sent'),
                'otp_email' => session('otp_email'),
            ],
            'ziggy' => fn (): array => [
                ...(new Ziggy)->toArray(),
                'location' => $request->url(),
            ],
        ];
    }
}
