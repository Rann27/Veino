<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserThemePreference extends Model
{
    protected $fillable = [
        'user_id',
        'theme_name',
        'auto_theme',
        'reader_settings',
    ];

    protected $casts = [
        'auto_theme' => 'boolean',
        'reader_settings' => 'array',
    ];

    /**
     * Get the user that owns the theme preference.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get default reader settings
     */
    public static function getDefaultReaderSettings(): array
    {
        return [
            'fontFamily' => 'Inter, sans-serif',
            'fontSize' => 16,
            'lineHeight' => 1.6,
            'contentWidth' => 75,
            'paragraphSpacing' => 1.5,
            'textAlign' => 'justify',
            'textIndent' => 2,
            'hyphenation' => true,
        ];
    }

    /**
     * Get available themes
     */
    public static function getAvailableThemes(): array
    {
        return [
            [
                'name' => 'Light',
                'background' => '#ffffff',
                'foreground' => '#000000',
                'description' => 'Clean and bright for daytime reading'
            ],
            [
                'name' => 'Dark',
                'background' => '#000000',
                'foreground' => '#ffffff',
                'description' => 'Easy on the eyes for night reading'
            ],
            [
                'name' => 'Sepia',
                'background' => '#f4ecd8',
                'foreground' => '#4b3621',
                'description' => 'Warm paper-like experience'
            ],
            [
                'name' => 'Cool Dark',
                'background' => '#1e1e2e',
                'foreground' => '#cdd6f4',
                'description' => 'Cool toned dark theme'
            ],
            [
                'name' => 'Frost',
                'background' => '#cddced',
                'foreground' => '#021a36',
                'description' => 'Cool and refreshing blue tones'
            ],
            [
                'name' => 'Solarized',
                'background' => '#fdf6e3',
                'foreground' => '#657b83',
                'description' => 'Gentle contrast for comfortable reading'
            ]
        ];
    }
}
