<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\UserThemePreference;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class ThemeController extends Controller
{
    /**
     * Get user's theme preferences
     */
    public function index(): JsonResponse
    {
        $user = auth()->user();
        
        if (!$user) {
            return response()->json([
                'theme' => UserThemePreference::getAvailableThemes()[0], // Default to Light
                'auto_theme' => false,
                'reader_settings' => UserThemePreference::getDefaultReaderSettings(),
            ]);
        }

        $preference = $user->getThemePreference();
        $themes = UserThemePreference::getAvailableThemes();
        $currentTheme = collect($themes)->firstWhere('name', $preference->theme_name) ?? $themes[0];

        return response()->json([
            'theme' => $currentTheme,
            'auto_theme' => $preference->auto_theme,
            'reader_settings' => $preference->reader_settings ?? UserThemePreference::getDefaultReaderSettings(),
        ]);
    }

    /**
     * Update user's theme preferences
     */
    public function update(Request $request): JsonResponse
    {
        $user = auth()->user();
        
        if (!$user) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $validated = $request->validate([
            'theme_name' => 'required|string|in:Light,Dark,Sepia,Cool Dark,Frost,Solarized',
            'auto_theme' => 'boolean',
            'reader_settings' => 'array',
            'reader_settings.fontFamily' => 'string',
            'reader_settings.fontSize' => 'integer|min:8|max:32',
            'reader_settings.lineHeight' => 'numeric|min:0.5|max:3',
            'reader_settings.contentWidth' => 'integer|min:50|max:100',
            'reader_settings.paragraphSpacing' => 'numeric|min:0.5|max:3.0',
            'reader_settings.textAlign' => 'string|in:left,center,justify',
            'reader_settings.textIndent' => 'numeric|min:0|max:4',
            'reader_settings.hyphenation' => 'boolean',
        ]);

        $preference = $user->getThemePreference();
        $preference->update($validated);

        $themes = UserThemePreference::getAvailableThemes();
        $currentTheme = collect($themes)->firstWhere('name', $preference->theme_name);

        return response()->json([
            'theme' => $currentTheme,
            'auto_theme' => $preference->auto_theme,
            'reader_settings' => $preference->reader_settings,
            'message' => 'Theme preferences updated successfully'
        ]);
    }

    /**
     * Get available themes
     */
    public function themes(): JsonResponse
    {
        return response()->json([
            'themes' => UserThemePreference::getAvailableThemes()
        ]);
    }
}
