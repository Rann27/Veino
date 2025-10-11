<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Advertisement;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Storage;

class AdvertisementController extends Controller
{
    /**
     * Display advertisement management page
     */
    public function index(Request $request)
    {
        $query = Advertisement::query();

        // Filter by status
        if ($request->has('status')) {
            if ($request->status === 'active') {
                $query->active();
            } elseif ($request->status === 'expired') {
                $query->expired();
            }
        }

        // Filter by unit type
        if ($request->has('unit_type') && $request->unit_type !== 'all') {
            $query->byType($request->unit_type);
        }

        // Get advertisements with pagination
        $advertisements = $query->orderBy('created_at', 'desc')
            ->paginate(20)
            ->through(function ($ad) {
                return [
                    'id' => $ad->id,
                    'advertiser_name' => $ad->advertiser_name,
                    'unit_type' => $ad->unit_type,
                    'unit_type_display' => $ad->unit_type_display,
                    'file_path_desktop' => $ad->file_path_desktop,
                    'file_path_mobile' => $ad->file_path_mobile,
                    'file_url_desktop' => $ad->file_url_desktop,
                    'file_url_mobile' => $ad->file_url_mobile,
                    'link_url' => $ad->link_url,
                    'link_caption' => $ad->link_caption,
                    'expired_at' => $ad->expired_at->format('Y-m-d H:i:s'),
                    'clicks' => $ad->clicks,
                    'impressions' => $ad->impressions,
                    'is_active' => $ad->is_active,
                    'is_expired' => $ad->is_expired,
                    'status' => $ad->status,
                    'created_at' => $ad->created_at->format('Y-m-d H:i:s'),
                ];
            });

        return Inertia::render('Admin/Advertisement/Index', [
            'advertisements' => $advertisements,
            'filters' => [
                'status' => $request->status,
                'unit_type' => $request->unit_type,
            ],
        ]);
    }

    /**
     * Store a new advertisement
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'advertiser_name' => 'required|string|max:255',
            'unit_type' => 'required|in:banner,interstitial,in_text_link',
            'file_desktop' => 'nullable|image|mimes:jpg,jpeg,gif|max:5120', // Max 5MB
            'file_mobile' => 'nullable|image|mimes:jpg,jpeg,gif|max:5120', // Max 5MB
            'link_url' => 'required|url',
            'link_caption' => 'nullable|string|max:255',
            'expired_at' => 'required|date|after:now',
        ]);

        // Handle desktop file upload for banner and interstitial
        if ($request->hasFile('file_desktop') && in_array($validated['unit_type'], ['banner', 'interstitial'])) {
            $path = $request->file('file_desktop')->store('advertisements/desktop', 'public');
            $validated['file_path_desktop'] = $path;
        }

        // Handle mobile file upload for banner and interstitial
        if ($request->hasFile('file_mobile') && in_array($validated['unit_type'], ['banner', 'interstitial'])) {
            $path = $request->file('file_mobile')->store('advertisements/mobile', 'public');
            $validated['file_path_mobile'] = $path;
        }

        // Remove file inputs from validated data (not in database)
        unset($validated['file_desktop'], $validated['file_mobile']);

        // Create advertisement
        Advertisement::create($validated);

        return redirect()->back()->with('success', 'Advertisement created successfully');
    }

    /**
     * Update an existing advertisement
     */
    public function update(Request $request, Advertisement $advertisement)
    {
        $validated = $request->validate([
            'advertiser_name' => 'required|string|max:255',
            'unit_type' => 'required|in:banner,interstitial,in_text_link',
            'file_desktop' => 'nullable|image|mimes:jpg,jpeg,gif|max:5120',
            'file_mobile' => 'nullable|image|mimes:jpg,jpeg,gif|max:5120',
            'link_url' => 'required|url',
            'link_caption' => 'nullable|string|max:255',
            'expired_at' => 'required|date',
        ]);

        // Handle desktop file upload if new file is provided
        if ($request->hasFile('file_desktop') && in_array($validated['unit_type'], ['banner', 'interstitial'])) {
            // Delete old desktop file
            if ($advertisement->file_path_desktop) {
                Storage::disk('public')->delete($advertisement->file_path_desktop);
            }
            
            $path = $request->file('file_desktop')->store('advertisements/desktop', 'public');
            $validated['file_path_desktop'] = $path;
        }

        // Handle mobile file upload if new file is provided
        if ($request->hasFile('file_mobile') && in_array($validated['unit_type'], ['banner', 'interstitial'])) {
            // Delete old mobile file
            if ($advertisement->file_path_mobile) {
                Storage::disk('public')->delete($advertisement->file_path_mobile);
            }
            
            $path = $request->file('file_mobile')->store('advertisements/mobile', 'public');
            $validated['file_path_mobile'] = $path;
        }

        // Remove file inputs from validated data
        unset($validated['file_desktop'], $validated['file_mobile']);

        // Update advertisement
        $advertisement->update($validated);

        return redirect()->back()->with('success', 'Advertisement updated successfully');
    }

    /**
     * Delete an advertisement
     */
    public function destroy(Advertisement $advertisement)
    {
        // Delete associated desktop file
        if ($advertisement->file_path_desktop) {
            Storage::disk('public')->delete($advertisement->file_path_desktop);
        }

        // Delete associated mobile file
        if ($advertisement->file_path_mobile) {
            Storage::disk('public')->delete($advertisement->file_path_mobile);
        }

        $advertisement->delete();

        return redirect()->back()->with('success', 'Advertisement deleted successfully');
    }

    /**
     * Toggle active status
     */
    public function toggleActive(Advertisement $advertisement)
    {
        $advertisement->update([
            'is_active' => !$advertisement->is_active,
        ]);

        return redirect()->back()->with('success', 'Advertisement status updated');
    }

    /**
     * Increment click count (for tracking)
     */
    public function trackClick(Advertisement $advertisement)
    {
        $advertisement->incrementClicks();

        return response()->json(['success' => true]);
    }

    /**
     * Increment impression count (for tracking)
     */
    public function trackImpression(Advertisement $advertisement)
    {
        $advertisement->incrementImpressions();

        return response()->json(['success' => true]);
    }
}
