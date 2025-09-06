// Enhanced Theme Context with Backend Integration
import React, { createContext, useContext, useState, useEffect } from 'react';
import { usePage } from '@inertiajs/react';

export interface ThemePreset {
    name: string;
    background: string;
    foreground: string;
    description: string;
}

export interface ReaderSettings {
    fontFamily: string;
    fontSize: number;
    lineHeight: number;
    contentWidth: number;
}

interface ThemeContextType {
    currentTheme: ThemePreset;
    setTheme: (theme: ThemePreset) => void;
    isSystemTheme: boolean;
    toggleSystemTheme: () => void;
    readerSettings: ReaderSettings;
    updateReaderSettings: (settings: Partial<ReaderSettings>) => void;
    isLoading: boolean;
    syncWithBackend: (theme?: ThemePreset, reader?: ReaderSettings) => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};

interface ThemeProviderProps {
    children: React.ReactNode;
}

// Default themes - now also fetched from backend
export const defaultThemes: ThemePreset[] = [
    {
        name: 'Light',
        background: '#ffffff',
        foreground: '#000000',
        description: 'Clean and bright for daytime reading'
    },
    {
        name: 'Dark',
        background: '#000000',
        foreground: '#ffffff',
        description: 'Easy on the eyes for night reading'
    },
    {
        name: 'Sepia',
        background: '#f4ecd8',
        foreground: '#4b3621',
        description: 'Warm tones reminiscent of old books'
    },
    {
        name: 'Cool Dark',
        background: '#1e1e2e',
        foreground: '#cdd6f4',
        description: 'Cool dark theme with purple accent'
    },
    {
        name: 'Frost',
        background: '#cddced',
        foreground: '#021a36',
        description: 'Cool light theme with frost colors'
    },
    {
        name: 'Solarized',
        background: '#fdf6e3',
        foreground: '#657b83',
        description: 'Gentle contrast for comfortable reading'
    }
];

export const themePresets = defaultThemes;

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
    const { auth } = usePage<any>().props;
    const [currentTheme, setCurrentTheme] = useState<ThemePreset>(defaultThemes[0]);
    const [isSystemTheme, setIsSystemTheme] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [readerSettings, setReaderSettings] = useState<ReaderSettings>({
        fontFamily: 'Inter, sans-serif',
        fontSize: 16,
        lineHeight: 1.6,
        contentWidth: 75,
    });

    // Load theme preferences from backend or localStorage
    useEffect(() => {
        const loadFromLocalStorage = () => {
            // Check for cached data first
            const cachedData = localStorage.getItem('veinovel-theme-cache');
            if (cachedData) {
                try {
                    const data = JSON.parse(cachedData);
                    setCurrentTheme(data.theme);
                    setIsSystemTheme(data.auto_theme);
                    setReaderSettings(data.reader_settings);
                    return;
                } catch (e) {
                    // Invalid cache, continue with legacy loading
                }
            }

            // Legacy localStorage loading
            const savedTheme = localStorage.getItem('veinovel-theme');
            const savedSystemTheme = localStorage.getItem('veinovel-system-theme');
            const savedReaderSettings = localStorage.getItem('veinovel-reader-settings');
            
            if (savedSystemTheme === 'true') {
                setIsSystemTheme(true);
                const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                setCurrentTheme(prefersDark ? defaultThemes[1] : defaultThemes[0]);
            } else if (savedTheme) {
                const theme = defaultThemes.find(t => t.name === savedTheme);
                if (theme) {
                    setCurrentTheme(theme);
                }
            }

            if (savedReaderSettings) {
                try {
                    const parsed = JSON.parse(savedReaderSettings);
                    setReaderSettings(parsed);
                } catch (e) {
                    // Invalid JSON, use defaults
                }
            }
        };

        const loadThemePreferences = async () => {
            setIsLoading(true);
            
            try {
                // Always load from localStorage first for immediate display
                loadFromLocalStorage();
                
                // Then, if user is logged in, fetch from backend and update
                if (auth?.user) {
                    try {
                        const response = await fetch('/api/theme-preferences', {
                            headers: {
                                'Accept': 'application/json',
                                'X-Requested-With': 'XMLHttpRequest',
                            },
                            credentials: 'same-origin'
                        });
                        
                        if (response.ok) {
                            const data = await response.json();
                            setCurrentTheme(data.theme);
                            setIsSystemTheme(data.auto_theme);
                            setReaderSettings(data.reader_settings);
                            
                            // Update CSS custom properties
                            document.documentElement.style.setProperty('--theme-background', data.theme.background);
                            document.documentElement.style.setProperty('--theme-foreground', data.theme.foreground);
                            
                            // Update localStorage cache
                            localStorage.setItem('veinovel-theme-cache', JSON.stringify(data));
                        }
                    } catch (error) {
                        console.error('Failed to load backend theme preferences:', error);
                        // Keep the localStorage theme
                    }
                }
            } catch (error) {
                console.error('Failed to load theme preferences:', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadThemePreferences();
    }, []); // Empty dependency array to prevent reloading

    // Apply theme to document
    useEffect(() => {
        const root = document.documentElement;
        root.style.setProperty('--theme-bg', currentTheme.background);
        root.style.setProperty('--theme-fg', currentTheme.foreground);
        root.style.setProperty('--theme-bg-inverted', currentTheme.foreground);
        root.style.setProperty('--theme-fg-inverted', currentTheme.background);
        
        document.body.className = document.body.className.replace(/theme-\w+/g, '');
        document.body.classList.add(`theme-${currentTheme.name.toLowerCase().replace(/\s+/g, '-')}`);
    }, [currentTheme]);

    // Listen for system theme changes
    useEffect(() => {
        if (isSystemTheme) {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            const handleChange = (e: MediaQueryListEvent) => {
                const newTheme = e.matches ? defaultThemes[1] : defaultThemes[0];
                setCurrentTheme(newTheme);
            };

            mediaQuery.addListener(handleChange);
            return () => mediaQuery.removeListener(handleChange);
        }
    }, [isSystemTheme]);

    // Sync preferences with backend
    const syncWithBackend = async (theme?: ThemePreset, reader?: ReaderSettings) => {
        if (!auth?.user) {
            return; // Only sync for logged-in users
        }

        const themeToSave = theme || currentTheme;
        const readerToSave = reader || readerSettings;

        try {
            const response = await fetch('/api/theme-preferences', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                credentials: 'same-origin',
                body: JSON.stringify({
                    theme_name: themeToSave.name,
                    auto_theme: isSystemTheme,
                    reader_settings: readerToSave,
                }),
            });

            if (response.ok) {
                // Update cache
                localStorage.setItem('veinovel-theme-cache', JSON.stringify({
                    theme: themeToSave,
                    auto_theme: isSystemTheme,
                    reader_settings: readerToSave,
                }));
            }
        } catch (error) {
            console.error('Failed to sync with backend:', error);
        }
    };

    const setTheme = (theme: ThemePreset) => {
        setCurrentTheme(theme);
        setIsSystemTheme(false);
        
        // Apply theme immediately to CSS custom properties
        document.documentElement.style.setProperty('--theme-background', theme.background);
        document.documentElement.style.setProperty('--theme-foreground', theme.foreground);
        
        // Save to localStorage immediately
        localStorage.setItem('veinovel-theme', theme.name);
        localStorage.setItem('veinovel-system-theme', 'false');
        
        // Sync with backend for logged-in users
        syncWithBackend(theme);
    };

    const toggleSystemTheme = () => {
        const newSystemTheme = !isSystemTheme;
        setIsSystemTheme(newSystemTheme);
        
        let newTheme;
        if (newSystemTheme) {
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            newTheme = prefersDark ? defaultThemes[1] : defaultThemes[0];
            setCurrentTheme(newTheme);
        } else {
            newTheme = currentTheme;
        }
        
        // Update CSS custom properties
        document.documentElement.style.setProperty('--theme-background', newTheme.background);
        document.documentElement.style.setProperty('--theme-foreground', newTheme.foreground);
        
        localStorage.setItem('veinovel-system-theme', newSystemTheme.toString());
        syncWithBackend();
    };

    // Update CSS custom properties when theme changes
    useEffect(() => {
        document.documentElement.style.setProperty('--theme-background', currentTheme.background);
        document.documentElement.style.setProperty('--theme-foreground', currentTheme.foreground);
        
        // Remove loading class after theme is applied
        document.documentElement.classList.remove('theme-loading');
    }, [currentTheme]);

    const updateReaderSettings = (settings: Partial<ReaderSettings>) => {
        const newSettings = { ...readerSettings, ...settings };
        setReaderSettings(newSettings);
        
        localStorage.setItem('veinovel-reader-settings', JSON.stringify(newSettings));
        syncWithBackend(undefined, newSettings);
    };

    const value: ThemeContextType = {
        currentTheme,
        setTheme,
        isSystemTheme,
        toggleSystemTheme,
        readerSettings,
        updateReaderSettings,
        isLoading,
        syncWithBackend,
    };

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
};
