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

        return Inertia::render('Admin/Misc', [
            'config' => [
                'hero_series' => $config['hero_series'] ?? [],
                'featured_series' => $config['featured_series'] ?? [],
            ],
            'allSeries' => $allSeries,
        ]);
    }

    /**
     * Update configuration
     */
    public function update(Request $request)
    {
        $validated = $request->validate([
            'hero_series' => 'nullable|array|max:5',
            'hero_series.*' => 'nullable|integer|exists:series,id',
            'featured_series' => 'nullable|array|max:6',
            'featured_series.*' => 'nullable|integer|exists:series,id',
        ]);

        // Filter out null values
        $config = [
            'hero_series' => array_values(array_filter($validated['hero_series'] ?? [], fn($id) => $id !== null)),
            'featured_series' => array_values(array_filter($validated['featured_series'] ?? [], fn($id) => $id !== null)),
        ];

        $this->saveConfig($config);

        return redirect()->back()->with('success', 'Homepage configuration updated successfully');
    }
}
