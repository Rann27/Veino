import React from 'react';
import { useTheme, themePresets } from '@/Contexts/ThemeContext';
import { SHINY_PURPLE, SHINY_PURPLE_DIM } from '@/constants/colors';

interface ThemeSelectorModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function ThemeSelectorModal({ isOpen, onClose }: ThemeSelectorModalProps) {
    const { currentTheme, setTheme, isSystemTheme, toggleSystemTheme } = useTheme();

    if (!isOpen) return null;

    const getThemeIcon = (themeName: string) => {
        switch (themeName.toLowerCase()) {
            case 'light':     return '☀️';
            case 'dark':      return '🌙';
            case 'sepia':     return '📜';
            case 'cool dark': return '🌌';
            case 'frost':     return '❄️';
            case 'solarized': return '🌅';
            default:          return '🎨';
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div
                className="relative rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden animate-in fade-in-0 zoom-in-95 duration-200"
                style={{ backgroundColor: currentTheme.background }}
            >
                {/* Header */}
                <div
                    className="flex items-center justify-between p-6 border-b"
                    style={{ borderColor: `${currentTheme.foreground}12` }}
                >
                    <h2
                        className="text-xl font-semibold"
                        style={{ color: currentTheme.foreground }}
                    >
                        Theme Settings
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-lg transition-colors"
                        style={{ color: `${currentTheme.foreground}50` }}
                        onMouseEnter={(e) => {
                            (e.currentTarget as HTMLElement).style.color = currentTheme.foreground;
                            (e.currentTarget as HTMLElement).style.backgroundColor = `${currentTheme.foreground}08`;
                        }}
                        onMouseLeave={(e) => {
                            (e.currentTarget as HTMLElement).style.color = `${currentTheme.foreground}50`;
                            (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
                        }}
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Scrollable Content */}
                <div className="overflow-y-auto max-h-[calc(90vh-120px)] p-6">
                    {/* System Theme Toggle */}
                    <div
                        className="mb-6 p-4 rounded-xl"
                        style={{ backgroundColor: `${currentTheme.foreground}06`, border: `1px solid ${currentTheme.foreground}08` }}
                    >
                        <label className="flex items-center justify-between cursor-pointer">
                            <div>
                                <span
                                    className="font-medium"
                                    style={{ color: currentTheme.foreground }}
                                >
                                    Auto Theme
                                </span>
                                <p
                                    className="text-sm mt-0.5"
                                    style={{ color: `${currentTheme.foreground}60` }}
                                >
                                    Follow system preference
                                </p>
                            </div>
                            <button
                                onClick={toggleSystemTheme}
                                className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none"
                                style={{
                                    backgroundColor: isSystemTheme ? SHINY_PURPLE : `${currentTheme.foreground}25`,
                                }}
                            >
                                <span
                                    className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow"
                                    style={{ transform: isSystemTheme ? 'translateX(1.5rem)' : 'translateX(0.25rem)' }}
                                />
                            </button>
                        </label>
                    </div>

                    {/* Theme Options */}
                    <div className="space-y-3">
                        <h3
                            className="font-medium mb-3"
                            style={{ color: currentTheme.foreground }}
                        >
                            Choose Theme
                        </h3>
                        <div className="grid grid-cols-2 gap-3">
                            {themePresets.map((preset) => {
                                const isSelected = currentTheme.name === preset.name && !isSystemTheme;
                                return (
                                    <button
                                        key={preset.name}
                                        onClick={() => setTheme(preset)}
                                        disabled={isSystemTheme}
                                        className={`relative p-4 rounded-xl text-left transition-all duration-200 ${
                                            isSystemTheme ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                                        }`}
                                        style={{
                                            border: `2px solid ${isSelected ? SHINY_PURPLE : `${currentTheme.foreground}12`}`,
                                            backgroundColor: isSelected ? SHINY_PURPLE_DIM : `${currentTheme.foreground}04`,
                                        }}
                                    >
                                        {/* Theme Preview */}
                                        <div className="flex items-center gap-3 mb-2">
                                            <div
                                                className="w-8 h-8 rounded-full flex items-center justify-center text-sm shadow-sm"
                                                style={{
                                                    backgroundColor: preset.background,
                                                    color: preset.foreground,
                                                    border: `1px solid ${currentTheme.foreground}12`,
                                                }}
                                            >
                                                {getThemeIcon(preset.name)}
                                            </div>
                                            <div className="flex-1">
                                                <div
                                                    className="font-medium text-sm"
                                                    style={{ color: currentTheme.foreground }}
                                                >
                                                    {preset.name}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Color Swatches */}
                                        <div className="flex gap-2 mb-2">
                                            <div
                                                className="w-4 h-4 rounded"
                                                style={{
                                                    backgroundColor: preset.background,
                                                    border: `1px solid ${currentTheme.foreground}15`,
                                                }}
                                                title="Background"
                                            />
                                            <div
                                                className="w-4 h-4 rounded"
                                                style={{
                                                    backgroundColor: preset.foreground,
                                                    border: `1px solid ${currentTheme.foreground}15`,
                                                }}
                                                title="Foreground"
                                            />
                                        </div>

                                        <p
                                            className="text-xs"
                                            style={{ color: `${currentTheme.foreground}55` }}
                                        >
                                            {preset.description}
                                        </p>

                                        {/* Selected indicator */}
                                        {isSelected && (
                                            <div className="absolute top-2 right-2">
                                                <svg
                                                    className="w-5 h-5"
                                                    fill="currentColor"
                                                    viewBox="0 0 20 20"
                                                    style={{ color: SHINY_PURPLE }}
                                                >
                                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                </svg>
                                            </div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Auto-mode info */}
                        {isSystemTheme && (
                            <div
                                className="mt-4 p-3 rounded-xl"
                                style={{
                                    backgroundColor: SHINY_PURPLE_DIM,
                                    border: `1px solid ${SHINY_PURPLE}30`,
                                }}
                            >
                                <p
                                    className="text-sm"
                                    style={{ color: currentTheme.foreground }}
                                >
                                    <span className="font-medium">Auto mode: </span>
                                    Currently using{' '}
                                    <span className="font-medium">{currentTheme.name}</span> theme
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
