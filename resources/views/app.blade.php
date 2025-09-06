<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" @class(['dark' => ($appearance ?? 'system') == 'dark'])>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="csrf-token" content="{{ csrf_token() }}">

        <title inertia>{{ config('app.name', 'Veinovel') }}</title>

        <link rel="icon" href="/favicon2.ico" sizes="any">
        <link rel="icon" href="/favicon2.ico" type="image/x-icon">
        <link rel="shortcut icon" href="/favicon2.ico">
        <link rel="apple-touch-icon" href="/apple-touch-icon.png">

        <link rel="preconnect" href="https://fonts.bunny.net">
        <link href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600" rel="stylesheet" />

        <!-- Theme CSS Custom Properties -->
        <style>
            :root {
                --theme-background: #ffffff;
                --theme-foreground: #000000;
            }
            .theme-loading {
                background-color: var(--theme-background) !important;
                color: var(--theme-foreground) !important;
            }
        </style>

        <!-- Preload Theme Script - Prevents FOUC -->
        <script>
            (function() {
                const themes = {
                    'Light': { background: '#ffffff', foreground: '#000000' },
                    'Dark': { background: '#000000', foreground: '#ffffff' },
                    'Sepia': { background: '#f4ecd8', foreground: '#4b3621' },
                    'Cool Dark': { background: '#1e1e2e', foreground: '#cdd6f4' },
                    'Frost': { background: '#cddced', foreground: '#021a36' },
                    'Solarized': { background: '#fdf6e3', foreground: '#657b83' }
                };

                // Load theme from localStorage immediately
                let currentTheme = themes['Light']; // default
                
                try {
                    // Check cache first
                    const cachedData = localStorage.getItem('veinovel-theme-cache');
                    if (cachedData) {
                        const data = JSON.parse(cachedData);
                        if (themes[data.theme.name]) {
                            currentTheme = themes[data.theme.name];
                        }
                    } else {
                        // Fallback to legacy storage
                        const savedTheme = localStorage.getItem('veinovel-theme');
                        const isSystemTheme = localStorage.getItem('veinovel-system-theme') === 'true';
                        
                        if (isSystemTheme) {
                            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                            currentTheme = prefersDark ? themes['Dark'] : themes['Light'];
                        } else if (savedTheme && themes[savedTheme]) {
                            currentTheme = themes[savedTheme];
                        }
                    }
                } catch (e) {
                    // Error loading, use default
                }

                // Apply theme immediately to CSS custom properties
                document.documentElement.style.setProperty('--theme-background', currentTheme.background);
                document.documentElement.style.setProperty('--theme-foreground', currentTheme.foreground);
                
                // Add class to body for immediate styling
                document.documentElement.className += ' theme-loading';
            })();
        </script>

        @routes
        @viteReactRefresh
        @vite(['resources/js/app.tsx', "resources/js/pages/{$page['component']}.tsx"])
        @inertiaHead
    </head>
    <body class="font-sans antialiased theme-loading" style="background-color: var(--theme-background); color: var(--theme-foreground);">
        @inertia
    </body>
</html>
