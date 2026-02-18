<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Series;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class MiscController extends Controller
{
    /**
     * Get homepage configuration file path
     */
    private function getConfigPath(): string
    {
        return 'homepage-config.json';
    }

    /**
     * Get default configuration
     */
    private function getDefaultConfig(): array
    {
        return [
            'hero_series' => [],
            'featured_series' => [],
            'banners' => [],
        ];
    }

    /**
     * Get current configuration
     */
    private function getConfig(): array
    {
        if (Storage::exists($this->getConfigPath())) {
            $config = json_decode(Storage::get($this->getConfigPath()), true);
            return $config ?? $this->getDefaultConfig();
        }
        
        return $this->getDefaultConfig();
    }

    /**
     * Save configuration
     */
    private function saveConfig(array $config): void
    {
        Storage::put($this->getConfigPath(), json_encode($config, JSON_PRETTY_PRINT));
    }

    /**
     * Show configuration page
     */
    public function index()
    {
        $config = $this->getConfig();
        
        // Get all series for dropdown options
        $allSeries = Series::select('id', 'title', 'slug')
            ->orderBy('title')
            ->get();

        // Convert banner image paths to full URLs
        $banners = collect($config['banners'] ?? [])->map(function ($banner) {
            if (!empty($banner['image_path'])) {
                $banner['image_url'] = Storage::disk('public')->url($banner['image_path']);
            }
            return $banner;
        })->toArray();

        return Inertia::render('Admin/Misc', [
            'config' => [
                'hero_series' => $config['hero_series'] ?? [],
                'featured_series' => $config['featured_series'] ?? [],
                'banners' => $banners,
            ],
            'allSeries' => $allSeries,
        ]);
    }

    /**
     * Upload a banner image
     */
    public function uploadBanner(Request $request)
    {
        $request->validate([
            'image' => 'required|image|mimes:jpeg,png,jpg,gif,webp|max:2048',
        ]);

        $path = $request->file('image')->store('banners', 'public');

        return response()->json([
            'image_path' => $path,
            'image_url' => Storage::disk('public')->url($path),
        ]);
    }

    /**
     * Delete a banner image
     */
    public function deleteBanner(Request $request)
    {
        $request->validate([
            'image_path' => 'required|string',
        ]);

        $path = $request->input('image_path');

        // Only delete files within banners directory
        if (str_starts_with($path, 'banners/') && Storage::disk('public')->exists($path)) {
            Storage::disk('public')->delete($path);
        }

        return response()->json(['success' => true]);
    }

    /**
     * Update configuration
     */
    public function update(Request $request)
    {
        $validated = $request->validate([
            'hero_series' => 'nullable|array|max:5',
            'hero_series.*' => 'nullable|integer|exists:series,id',
            'featured_series' => 'nullable|array|max:8',
            'featured_series.*' => 'nullable|integer|exists:series,id',
            'banners' => 'nullable|array|max:5',
            'banners.*.image_path' => 'required|string',
            'banners.*.link_url' => 'nullable|url',
            'banners.*.alt' => 'nullable|string|max:255',
        ]);

        // Get old config to clean up removed banners
        $oldConfig = $this->getConfig();
        $oldPaths = collect($oldConfig['banners'] ?? [])->pluck('image_path')->filter()->toArray();
        $newPaths = collect($validated['banners'] ?? [])->pluck('image_path')->filter()->toArray();

        // Delete banner images that are no longer used
        foreach ($oldPaths as $oldPath) {
            if (!in_array($oldPath, $newPaths) && str_starts_with($oldPath, 'banners/')) {
                Storage::disk('public')->delete($oldPath);
            }
        }

        // Filter out null values
        $config = [
            'hero_series' => array_values(array_filter($validated['hero_series'] ?? [], fn($id) => $id !== null)),
            'featured_series' => array_values(array_filter($validated['featured_series'] ?? [], fn($id) => $id !== null)),
            'banners' => array_values(array_filter($validated['banners'] ?? [], fn($b) => !empty($b['image_path']))),
        ];

        $this->saveConfig($config);

        return redirect()->back()->with('success', 'Homepage configuration updated successfully');
    }
}
