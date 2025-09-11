import React from 'react';
import { useTheme, themePresets } from '@/Contexts/ThemeContext';

interface ThemeSelectorModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function ThemeSelectorModal({ isOpen, onClose }: ThemeSelectorModalProps) {
    const { currentTheme, setTheme, isSystemTheme, toggleSystemTheme } = useTheme();

    if (!isOpen) return null;

    const getThemeIcon = (themeName: string) => {
        switch (themeName.toLowerCase()) {
            case 'light':
                return '☀️';
            case 'dark':
                return '🌙';
            case 'sepia':
                return '📜';
            case 'cool dark':
                return '🌌';
            case 'frost':
                return '❄️';
            case 'solarized':
                return '🌅';
            default:
                return '🎨';
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
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden animate-in fade-in-0 zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-900">Theme Settings</h2>
                    <button
                        onClick={onClose}
                        className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Scrollable Content */}
                <div className="overflow-y-auto max-h-[calc(90vh-120px)] p-6">
                    {/* System Theme Toggle */}
                    <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                        <label className="flex items-center justify-between cursor-pointer">
                            <div>
                                <span className="font-medium text-gray-900">Auto Theme</span>
                                <p className="text-sm text-gray-600">Follow system preference</p>
                            </div>
                            <button
                                onClick={toggleSystemTheme}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                                    isSystemTheme ? 'bg-blue-600' : 'bg-gray-300'
                                }`}
                            >
                                <span
                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                        isSystemTheme ? 'translate-x-6' : 'translate-x-1'
                                    }`}
                                />
                            </button>
                        </label>
                    </div>

                    {/* Theme Options */}
                    <div className="space-y-3">
                        <h3 className="font-medium text-gray-900 mb-3">Choose Theme</h3>
                        <div className="grid grid-cols-2 gap-3">
                            {themePresets.map((preset) => (
                            <button
                                key={preset.name}
                                onClick={() => setTheme(preset)}
                                disabled={isSystemTheme}
                                className={`relative p-4 rounded-lg border-2 text-left transition-all duration-200 group ${
                                    currentTheme.name === preset.name && !isSystemTheme
                                        ? 'border-blue-500 bg-blue-50'
                                        : 'border-gray-200 hover:border-gray-300'
                                } ${
                                    isSystemTheme ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:shadow-sm'
                                }`}
                            >
                                {/* Theme Preview */}
                                <div className="flex items-center space-x-3 mb-2">
                                    <div 
                                        className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-sm shadow-sm"
                                        style={{ 
                                            backgroundColor: preset.background,
                                            color: preset.foreground 
                                        }}
                                    >
                                        {getThemeIcon(preset.name)}
                                    </div>
                                    <div className="flex-1">
                                        <div className="font-medium text-gray-900">{preset.name}</div>
                                    </div>
                                </div>
                                
                                {/* Color Swatches */}
                                <div className="flex space-x-2 mb-2">
                                    <div 
                                        className="w-4 h-4 rounded border border-gray-300"
                                        style={{ backgroundColor: preset.background }}
                                        title="Background"
                                    />
                                    <div 
                                        className="w-4 h-4 rounded border border-gray-300"
                                        style={{ backgroundColor: preset.foreground }}
                                        title="Foreground"
                                    />
                                </div>
                                
                                <p className="text-xs text-gray-600">{preset.description}</p>
                                
                                {/* Selected indicator */}
                                {currentTheme.name === preset.name && !isSystemTheme && (
                                    <div className="absolute top-2 right-2">
                                        <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                )}
                            </button>
                        ))}
                    </div>

                    {/* Current theme info */}
                    {isSystemTheme && (
                        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                            <p className="text-sm text-blue-800">
                                <span className="font-medium">Auto mode:</span> Currently using{' '}
                                <span className="font-medium">{currentTheme.name}</span> theme
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
