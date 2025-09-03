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
        description: 'Warm paper-like experience'
    },
    {
        name: 'Cool Dark',
        background: '#1e1e2e',
        foreground: '#cdd6f4',
        description: 'Cool toned dark theme'
    },
    {
        name: 'Frost',
        background: '#cddced',
        foreground: '#021a36',
        description: 'Cool and refreshing blue tones'
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
        const loadThemePreferences = async () => {
            setIsLoading(true);
            
            try {
                if (auth?.user) {
                    // User is logged in - fetch from backend
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
                        
                        // Also save to localStorage as cache
                        localStorage.setItem('veinovel-theme-cache', JSON.stringify(data));
                    } else {
                        // Fallback to localStorage
                        loadFromLocalStorage();
                    }
                } else {
                    // Guest user - use localStorage
                    loadFromLocalStorage();
                }
            } catch (error) {
                console.error('Failed to load theme preferences:', error);
                loadFromLocalStorage();
            } finally {
                setIsLoading(false);
            }
        };

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

        loadThemePreferences();
    }, [auth?.user]);

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
                syncWithBackend(newTheme);
            };
            
            mediaQuery.addEventListener('change', handleChange);
            return () => mediaQuery.removeEventListener('change', handleChange);
        }
    }, [isSystemTheme]);

    const syncWithBackend = async (theme?: ThemePreset, reader?: ReaderSettings) => {
        if (!auth?.user) return; // Only sync for logged-in users

        const themeToSave = theme || currentTheme;
        const readerToSave = reader || readerSettings;

        try {
            await fetch('/api/theme-preferences', {
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

            // Update cache
            localStorage.setItem('veinovel-theme-cache', JSON.stringify({
                theme: themeToSave,
                auto_theme: isSystemTheme,
                reader_settings: readerToSave,
            }));
        } catch (error) {
            console.error('Failed to sync theme with backend:', error);
        }
    };

    const setTheme = (theme: ThemePreset) => {
        setCurrentTheme(theme);
        setIsSystemTheme(false);
        
        // Update localStorage immediately
        localStorage.setItem('veinovel-theme', theme.name);
        localStorage.removeItem('veinovel-system-theme');
        
        // Sync with backend
        syncWithBackend(theme);
    };

    const toggleSystemTheme = () => {
        const newSystemTheme = !isSystemTheme;
        setIsSystemTheme(newSystemTheme);
        
        if (newSystemTheme) {
            localStorage.setItem('veinovel-system-theme', 'true');
            localStorage.removeItem('veinovel-theme');
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            const newTheme = prefersDark ? defaultThemes[1] : defaultThemes[0];
            setCurrentTheme(newTheme);
            syncWithBackend(newTheme);
        } else {
            localStorage.removeItem('veinovel-system-theme');
            localStorage.setItem('veinovel-theme', currentTheme.name);
            syncWithBackend();
        }
    };

    const updateReaderSettings = (newSettings: Partial<ReaderSettings>) => {
        const updated = { ...readerSettings, ...newSettings };
        setReaderSettings(updated);
        
        // Update localStorage immediately
        localStorage.setItem('veinovel-reader-settings', JSON.stringify(updated));
        
        // Sync with backend
        syncWithBackend(undefined, updated);
    };

    return (
        <ThemeContext.Provider value={{
            currentTheme,
            setTheme,
            isSystemTheme,
            toggleSystemTheme,
            readerSettings,
            updateReaderSettings,
            isLoading,
            syncWithBackend
        }}>
            {children}
        </ThemeContext.Provider>
    );
};
