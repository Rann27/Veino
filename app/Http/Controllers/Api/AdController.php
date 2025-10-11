<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Advertisement;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AdController extends Controller
{
    /**
     * Get random interstitial ad for basic users
     */
    public function getRandomInterstitial(Request $request)
    {
        // Check if user is premium (no ads for premium)
        if (Auth::check() && Auth::user()->hasActiveMembership()) {
            return response()->json(['ad' => null]);
        }

        // Get device type from request
        $isMobile = $request->header('User-Agent') && 
                    preg_match('/Mobile|Android|iPhone|iPad/i', $request->header('User-Agent'));

        // Get random active interstitial ad
        $ad = Advertisement::active()
            ->byType('interstitial')
            ->inRandomOrder()
            ->first();

        if (!$ad) {
            return response()->json(['ad' => null]);
        }

        // Return appropriate version based on device
        return response()->json([
            'ad' => [
                'id' => $ad->id,
                'advertiser_name' => $ad->advertiser_name,
                'image_url' => $isMobile ? $ad->file_url_mobile : $ad->file_url_desktop,
                'link_url' => $ad->link_url,
            ]
        ]);
    }

    /**
     * Get random in-text link ads for basic users
     */
    public function getRandomInTextLinks(Request $request)
    {
        // Check if user is premium (no ads for premium)
        if (Auth::check() && Auth::user()->hasActiveMembership()) {
            return response()->json(['ads' => []]);
        }

        // Get number of ads needed (based on chapter length)
        $count = $request->input('count', 3);

        // Get random active in-text link ads
        $ads = Advertisement::active()
            ->byType('in_text_link')
            ->inRandomOrder()
            ->take($count)
            ->get()
            ->map(function ($ad) {
                return [
                    'id' => $ad->id,
                    'caption' => $ad->link_caption,
                    'link_url' => $ad->link_url,
                ];
            });

        return response()->json(['ads' => $ads]);
    }

    /**
     * Get random banner ads for basic users (returns up to 2 banners)
     */
    public function getRandomBanner(Request $request)
    {
        // Check if user is premium (no ads for premium)
        if (Auth::check() && Auth::user()->hasActiveMembership()) {
            return response()->json(['ads' => []]);
        }

        // Get device type from request
        $isMobile = $request->header('User-Agent') && 
                    preg_match('/Mobile|Android|iPhone|iPad/i', $request->header('User-Agent'));

        // Get up to 2 random active banner ads
        $ads = Advertisement::active()
            ->byType('banner')
            ->inRandomOrder()
            ->take(2)
            ->get()
            ->map(function ($ad) use ($isMobile) {
                return [
                    'id' => $ad->id,
                    'advertiser_name' => $ad->advertiser_name,
                    'image_url' => $isMobile ? $ad->file_url_mobile : $ad->file_url_desktop,
                    'link_url' => $ad->link_url,
                ];
            });

        // Return array of ads (can be empty, 1, or 2 ads)
        return response()->json(['ads' => $ads]);
    }

    /**
     * Track ad impression
     */
    public function trackImpression(Request $request, Advertisement $advertisement)
    {
        $advertisement->incrementImpressions();

        return response()->json(['success' => true]);
    }

    /**
     * Track ad click
     */
    public function trackClick(Request $request, Advertisement $advertisement)
    {
        $advertisement->incrementClicks();

        return response()->json(['success' => true]);
    }
}
