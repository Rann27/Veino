import React, { useState, useEffect } from 'react';
import { useTheme, themePresets, ReaderSettings } from '@/Contexts/ThemeContext';

interface ReaderSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const googleFonts = [
    { name: 'Inter', family: 'Inter, sans-serif' },
    { name: 'Open Sans', family: 'Open Sans, sans-serif' },
    { name: 'Roboto', family: 'Roboto, sans-serif' },
    { name: 'Lato', family: 'Lato, sans-serif' },
    { name: 'Source Sans Pro', family: 'Source Sans Pro, sans-serif' },
    { name: 'Nunito', family: 'Nunito, sans-serif' },
    { name: 'Poppins', family: 'Poppins, sans-serif' },
    { name: 'Merriweather', family: 'Merriweather, serif' },
    { name: 'Crimson Text', family: 'Crimson Text, serif' },
    { name: 'Libre Baskerville', family: 'Libre Baskerville, serif' },
    { name: 'PT Serif', family: 'PT Serif, serif' },
    { name: 'Playfair Display', family: 'Playfair Display, serif' },
];

export default function ReaderSettingsModal({ 
    isOpen, 
    onClose
}: ReaderSettingsModalProps) {
    const { currentTheme, setTheme, readerSettings, updateReaderSettings } = useTheme();
    const [settings, setSettings] = useState<ReaderSettings>(readerSettings);
    const [showThemeSelector, setShowThemeSelector] = useState(false);

    useEffect(() => {
        setSettings(readerSettings);
    }, [readerSettings]);

    useEffect(() => {
        if (isOpen) {
            // Load Google Fonts dynamically
            const link = document.createElement('link');
            link.href = 'https://fonts.googleapis.com/css2?family=' + 
                googleFonts.map(font => font.name.replace(/\s+/g, '+')).join('&family=') +
                '&display=swap';
            link.rel = 'stylesheet';
            
            if (!document.querySelector(`link[href="${link.href}"]`)) {
                document.head.appendChild(link);
            }
        }
    }, [isOpen]);

    const handleSettingChange = (key: keyof ReaderSettings, value: string | number) => {
        const newSettings = { ...settings, [key]: value };
        setSettings(newSettings);
        updateReaderSettings(newSettings);
    };

    const resetToDefaults = () => {
        const defaultSettings: ReaderSettings = {
            fontFamily: 'Inter, sans-serif',
            fontSize: 16,
            lineHeight: 1.6,
            contentWidth: 75
        };
        setSettings(defaultSettings);
        updateReaderSettings(defaultSettings);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div 
                className="fixed inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />
            
            {/* Modal */}
            <div className="relative bg-white rounded-2xl shadow-2xl p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto animate-in fade-in-0 zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                        <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Reader Settings
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="space-y-6">
                    {/* Font Family */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">Font Family</label>
                        <select
                            value={settings.fontFamily}
                            onChange={(e) => handleSettingChange('fontFamily', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            {googleFonts.map((font) => (
                                <option key={font.name} value={font.family} style={{ fontFamily: font.family }}>
                                    {font.name}
                                </option>
                            ))}
                        </select>
                        <div 
                            className="mt-2 p-3 bg-gray-50 rounded-lg text-gray-700"
                            style={{ fontFamily: settings.fontFamily }}
                        >
                            The quick brown fox jumps over the lazy dog. This is a preview of the selected font.
                        </div>
                    </div>

                    {/* Font Size */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                            Font Size: {settings.fontSize}px
                        </label>
                        <div className="space-y-2">
                            <input
                                type="range"
                                min="8"
                                max="32"
                                step="1"
                                value={settings.fontSize}
                                onChange={(e) => handleSettingChange('fontSize', parseInt(e.target.value))}
                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                            />
                            <div className="flex justify-between text-sm text-gray-500">
                                <span>8px</span>
                                <span>20px</span>
                                <span>32px</span>
                            </div>
                        </div>
                    </div>

                    {/* Line Height */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                            Line Spacing: {settings.lineHeight}
                        </label>
                        <div className="space-y-2">
                            <input
                                type="range"
                                min="0.5"
                                max="2.5"
                                step="0.1"
                                value={settings.lineHeight}
                                onChange={(e) => handleSettingChange('lineHeight', parseFloat(e.target.value))}
                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                            />
                            <div className="flex justify-between text-sm text-gray-500">
                                <span>0.5</span>
                                <span>1.5</span>
                                <span>2.5</span>
                            </div>
                        </div>
                    </div>

                    {/* Content Width (Desktop only) */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                            Content Width: {settings.contentWidth}%
                            <span className="text-xs text-gray-500 ml-1">(Desktop only)</span>
                        </label>
                        <div className="space-y-2">
                            <input
                                type="range"
                                min="60"
                                max="90"
                                step="1"
                                value={settings.contentWidth}
                                onChange={(e) => handleSettingChange('contentWidth', parseInt(e.target.value))}
                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                            />
                            <div className="flex justify-between text-sm text-gray-500">
                                <span>60%</span>
                                <span>75%</span>
                                <span>90%</span>
                            </div>
                        </div>
                    </div>

                    {/* Theme Selector */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">Theme</label>
                        <button
                            onClick={() => setShowThemeSelector(!showThemeSelector)}
                            className="w-full p-3 border border-gray-300 rounded-lg hover:border-gray-400 transition-colors flex items-center justify-between"
                        >
                            <div className="flex items-center space-x-3">
                                <div 
                                    className="w-6 h-6 rounded border border-gray-300"
                                    style={{ backgroundColor: currentTheme.background }}
                                />
                                <span>{currentTheme.name}</span>
                            </div>
                            <svg className={`w-5 h-5 transition-transform ${showThemeSelector ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>

                        {showThemeSelector && (
                            <div className="mt-3 p-4 border border-gray-200 rounded-lg bg-gray-50">
                                <div className="grid grid-cols-2 gap-2">
                                    {themePresets.map((preset) => (
                                        <button
                                            key={preset.name}
                                            onClick={() => {
                                                setTheme(preset);
                                                setShowThemeSelector(false);
                                            }}
                                            className={`p-3 rounded-lg border text-left transition-all ${
                                                currentTheme.name === preset.name
                                                    ? 'border-blue-500 bg-blue-50'
                                                    : 'border-gray-200 hover:border-gray-300 bg-white'
                                            }`}
                                        >
                                            <div className="flex items-center space-x-2 mb-1">
                                                <div 
                                                    className="w-4 h-4 rounded border border-gray-300"
                                                    style={{ backgroundColor: preset.background }}
                                                />
                                                <span className="text-sm font-medium">{preset.name}</span>
                                            </div>
                                            <p className="text-xs text-gray-600">{preset.description}</p>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Preview */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">Preview</label>
                        <div 
                            className="p-4 border border-gray-300 rounded-lg"
                            style={{ 
                                backgroundColor: currentTheme.background,
                                color: currentTheme.foreground,
                                fontFamily: settings.fontFamily,
                                fontSize: `${settings.fontSize}px`,
                                lineHeight: settings.lineHeight
                            }}
                        >
                            <h4 className="font-semibold mb-2">Chapter Title Example</h4>
                            <p className="mb-2">
                                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
                            </p>
                            <p>
                                Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
                            </p>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-between pt-4 border-t border-gray-200">
                        <button
                            onClick={resetToDefaults}
                            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                        >
                            Reset to Defaults
                        </button>
                        <button
                            onClick={onClose}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            Done
                        </button>
                    </div>
                </div>
            </div>

            <style>{`
                .slider::-webkit-slider-thumb {
                    appearance: none;
                    width: 20px;
                    height: 20px;
                    background: #3b82f6;
                    border-radius: 50%;
                    cursor: pointer;
                }
                
                .slider::-moz-range-thumb {
                    width: 20px;
                    height: 20px;
                    background: #3b82f6;
                    border-radius: 50%;
                    cursor: pointer;
                    border: none;
                }
            `}</style>
        </div>
    );
}
