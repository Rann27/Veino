import React, { useState, useEffect, useRef } from 'react';
import { useTheme, themePresets, ReaderSettings } from '@/Contexts/ThemeContext';

interface ReaderSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    triggerElement?: HTMLElement | null;
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
    onClose,
    triggerElement
}: ReaderSettingsModalProps) {
    const { currentTheme, setTheme, readerSettings, updateReaderSettings } = useTheme();
    const [settings, setSettings] = useState<ReaderSettings>(readerSettings);
    const [showThemeSelector, setShowThemeSelector] = useState(false);
    const [position, setPosition] = useState({ top: 0, left: 0 });
    const modalRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setSettings(readerSettings);
    }, [readerSettings]);

    // Calculate position based on trigger element
    useEffect(() => {
        if (isOpen && triggerElement) {
            const rect = triggerElement.getBoundingClientRect();
            const modalWidth = 320; // Approximate modal width
            const modalHeight = 400; // Approximate modal height
            
            let top = rect.bottom + 8; // 8px spacing below trigger
            let left = rect.left - modalWidth + rect.width; // Align right edge
            
            // Check if modal goes off screen
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;
            
            // Adjust horizontal position if off screen
            if (left < 8) {
                left = 8; // 8px margin from left edge
            } else if (left + modalWidth > viewportWidth - 8) {
                left = viewportWidth - modalWidth - 8; // 8px margin from right edge
            }
            
            // Adjust vertical position if off screen
            if (top + modalHeight > viewportHeight - 8) {
                top = rect.top - modalHeight - 8; // Position above trigger
            }
            
            setPosition({ top, left });
        }
    }, [isOpen, triggerElement]);

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

    // Close modal when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (modalRef.current && !modalRef.current.contains(event.target as Node) && 
                triggerElement && !triggerElement.contains(event.target as Node)) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [isOpen, onClose, triggerElement]);

    const handleSettingChange = (key: keyof ReaderSettings, value: string | number | boolean) => {
        const newSettings = { ...settings, [key]: value };
        setSettings(newSettings);
        updateReaderSettings(newSettings);
    };

    const resetToDefaults = () => {
        const defaultSettings: ReaderSettings = {
            fontFamily: 'Inter, sans-serif',
            fontSize: 16,
            lineHeight: 1.6,
            contentWidth: 75,
            paragraphSpacing: 1.5,
            textAlign: 'justify',
            textIndent: 2,
            hyphenation: true,
        };
        setSettings(defaultSettings);
        updateReaderSettings(defaultSettings);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 pointer-events-none">
            {/* Floating Modal */}
            <div 
                ref={modalRef}
                className="absolute rounded-xl shadow-2xl w-80 max-h-96 overflow-y-auto pointer-events-auto animate-in fade-in-0 zoom-in-95 duration-200"
                style={{
                    top: `${position.top}px`,
                    left: `${position.left}px`,
                    backgroundColor: currentTheme.background,
                    borderColor: `${currentTheme.foreground}20`,
                    border: `1px solid ${currentTheme.foreground}20`
                }}
            >
                {/* Header */}
                <div 
                    className="flex items-center justify-between p-4 border-b"
                    style={{ borderColor: `${currentTheme.foreground}20` }}
                >
                    <h2 
                        className="text-lg font-semibold flex items-center"
                        style={{ color: currentTheme.foreground }}
                    >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Reader Settings
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-1 transition-colors hover:opacity-70"
                        style={{ color: `${currentTheme.foreground}60` }}
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="p-4 space-y-4">
                    {/* Font Family */}
                    <div>
                        <label 
                            className="block text-sm font-medium mb-2"
                            style={{ color: currentTheme.foreground }}
                        >
                            Font Family
                        </label>
                        <select
                            value={settings.fontFamily}
                            onChange={(e) => handleSettingChange('fontFamily', e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            style={{
                                backgroundColor: currentTheme.background,
                                borderColor: `${currentTheme.foreground}30`,
                                color: currentTheme.foreground
                            }}
                        >
                            {googleFonts.map((font) => (
                                <option key={font.name} value={font.family} style={{ fontFamily: font.family }}>
                                    {font.name}
                                </option>
                            ))}
                        </select>
                        <div 
                            className="mt-2 p-2 rounded text-sm"
                            style={{ 
                                backgroundColor: `${currentTheme.foreground}10`,
                                color: `${currentTheme.foreground}80`,
                                fontFamily: settings.fontFamily 
                            }}
                        >
                            The quick brown fox jumps over the lazy dog. This is a preview of the selected font.
                        </div>
                    </div>

                    {/* Font Size */}
                    <div>
                        <label 
                            className="block text-sm font-medium mb-2"
                            style={{ color: currentTheme.foreground }}
                        >
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
                                className="w-full h-2 rounded-lg appearance-none cursor-pointer slider"
                                style={{ backgroundColor: `${currentTheme.foreground}20` }}
                            />
                            <div 
                                className="flex justify-between text-xs"
                                style={{ color: `${currentTheme.foreground}60` }}
                            >
                                <span>8px</span>
                                <span>20px</span>
                                <span>32px</span>
                            </div>
                        </div>
                    </div>

                    {/* Line Height */}
                    <div>
                        <label 
                            className="block text-sm font-medium mb-2"
                            style={{ color: currentTheme.foreground }}
                        >
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
                                className="w-full h-2 rounded-lg appearance-none cursor-pointer slider"
                                style={{ backgroundColor: `${currentTheme.foreground}20` }}
                            />
                            <div 
                                className="flex justify-between text-xs"
                                style={{ color: `${currentTheme.foreground}60` }}
                            >
                                <span>0.5</span>
                                <span>1.5</span>
                                <span>2.5</span>
                            </div>
                        </div>
                    </div>

                    {/* Content Width */}
                    <div>
                        <label 
                            className="block text-sm font-medium mb-2"
                            style={{ color: currentTheme.foreground }}
                        >
                            Content Width: {settings.contentWidth}%
                        </label>
                        <div className="space-y-2">
                            <input
                                type="range"
                                min="60"
                                max="95"
                                step="1"
                                value={settings.contentWidth}
                                onChange={(e) => handleSettingChange('contentWidth', parseInt(e.target.value))}
                                className="w-full h-2 rounded-lg appearance-none cursor-pointer slider"
                                style={{ backgroundColor: `${currentTheme.foreground}20` }}
                            />
                            <div 
                                className="flex justify-between text-xs"
                                style={{ color: `${currentTheme.foreground}60` }}
                            >
                                <span>60%</span>
                                <span>75%</span>
                                <span>95%</span>
                            </div>
                        </div>
                    </div>

                    {/* Paragraph Spacing */}
                    <div>
                        <label 
                            className="block text-sm font-medium mb-2"
                            style={{ color: currentTheme.foreground }}
                        >
                            Paragraph Spacing: {settings.paragraphSpacing}em
                        </label>
                        <div className="space-y-2">
                            <input
                                type="range"
                                min="0.5"
                                max="3.0"
                                step="0.1"
                                value={settings.paragraphSpacing}
                                onChange={(e) => handleSettingChange('paragraphSpacing', parseFloat(e.target.value))}
                                className="w-full h-2 rounded-lg appearance-none cursor-pointer slider"
                                style={{ backgroundColor: `${currentTheme.foreground}20` }}
                            />
                            <div 
                                className="flex justify-between text-xs"
                                style={{ color: `${currentTheme.foreground}60` }}
                            >
                                <span>0.5em</span>
                                <span>1.5em</span>
                                <span>3.0em</span>
                            </div>
                        </div>
                    </div>

                    {/* Text Alignment */}
                    <div>
                        <label 
                            className="block text-sm font-medium mb-2"
                            style={{ color: currentTheme.foreground }}
                        >
                            Text Alignment
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                            {(['left', 'center', 'justify'] as const).map((align) => (
                                <button
                                    key={align}
                                    onClick={() => handleSettingChange('textAlign', align)}
                                    className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                                        settings.textAlign === align ? 'font-medium' : ''
                                    }`}
                                    style={{
                                        backgroundColor: settings.textAlign === align 
                                            ? currentTheme.foreground 
                                            : currentTheme.background,
                                        color: settings.textAlign === align 
                                            ? currentTheme.background 
                                            : currentTheme.foreground,
                                        borderColor: `${currentTheme.foreground}30`
                                    }}
                                >
                                    {align.charAt(0).toUpperCase() + align.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Text Indent */}
                    <div>
                        <label 
                            className="block text-sm font-medium mb-2"
                            style={{ color: currentTheme.foreground }}
                        >
                            Text Indent: {settings.textIndent}em
                        </label>
                        <div className="space-y-2">
                            <input
                                type="range"
                                min="0"
                                max="4"
                                step="0.5"
                                value={settings.textIndent}
                                onChange={(e) => handleSettingChange('textIndent', parseFloat(e.target.value))}
                                className="w-full h-2 rounded-lg appearance-none cursor-pointer slider"
                                style={{ backgroundColor: `${currentTheme.foreground}20` }}
                            />
                            <div 
                                className="flex justify-between text-xs"
                                style={{ color: `${currentTheme.foreground}60` }}
                            >
                                <span>0em</span>
                                <span>2em</span>
                                <span>4em</span>
                            </div>
                        </div>
                    </div>

                    {/* Hyphenation Toggle */}
                    <div>
                        <label 
                            className="flex items-center justify-between text-sm font-medium"
                            style={{ color: currentTheme.foreground }}
                        >
                            <span>Word Hyphenation</span>
                            <button
                                onClick={() => handleSettingChange('hyphenation', !settings.hyphenation)}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                    settings.hyphenation ? 'bg-blue-600' : ''
                                }`}
                                style={{
                                    backgroundColor: settings.hyphenation 
                                        ? '#3b82f6' 
                                        : `${currentTheme.foreground}30`
                                }}
                            >
                                <span
                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                        settings.hyphenation ? 'translate-x-6' : 'translate-x-1'
                                    }`}
                                />
                            </button>
                        </label>
                        <p 
                            className="text-xs mt-1"
                            style={{ color: `${currentTheme.foreground}60` }}
                        >
                            Automatically breaks long words at syllable boundaries
                        </p>
                    </div>

                    {/* Theme Selector */}
                    <div>
                        <label 
                            className="block text-sm font-medium mb-2"
                            style={{ color: currentTheme.foreground }}
                        >
                            Theme
                        </label>
                        <button
                            onClick={() => setShowThemeSelector(!showThemeSelector)}
                            className="w-full p-3 border rounded-lg hover:opacity-80 transition-opacity flex items-center justify-between"
                            style={{
                                backgroundColor: currentTheme.background,
                                borderColor: `${currentTheme.foreground}30`,
                                color: currentTheme.foreground
                            }}
                        >
                            <div className="flex items-center space-x-3">
                                <div 
                                    className="w-5 h-5 rounded border"
                                    style={{ 
                                        backgroundColor: currentTheme.background,
                                        borderColor: `${currentTheme.foreground}30`
                                    }}
                                />
                                <span>{currentTheme.name}</span>
                            </div>
                            <svg className={`w-4 h-4 transition-transform ${showThemeSelector ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>

                        {showThemeSelector && (
                            <div 
                                className="mt-2 p-3 border rounded-lg"
                                style={{
                                    backgroundColor: `${currentTheme.foreground}05`,
                                    borderColor: `${currentTheme.foreground}20`
                                }}
                            >
                                <div className="grid grid-cols-1 gap-2">
                                    {themePresets.map((preset) => (
                                        <button
                                            key={preset.name}
                                            onClick={() => {
                                                setTheme(preset);
                                                setShowThemeSelector(false);
                                            }}
                                            className={`p-2 rounded border text-left transition-all text-sm ${
                                                currentTheme.name === preset.name
                                                    ? 'border-blue-500 bg-blue-50'
                                                    : 'hover:opacity-80'
                                            }`}
                                            style={{
                                                backgroundColor: currentTheme.name === preset.name 
                                                    ? 'rgba(59, 130, 246, 0.1)' 
                                                    : currentTheme.background,
                                                borderColor: currentTheme.name === preset.name 
                                                    ? '#3B82F6' 
                                                    : `${currentTheme.foreground}20`,
                                                color: currentTheme.foreground
                                            }}
                                        >
                                            <div className="flex items-center space-x-2 mb-1">
                                                <div 
                                                    className="w-3 h-3 rounded border"
                                                    style={{ 
                                                        backgroundColor: preset.background,
                                                        borderColor: `${currentTheme.foreground}30`
                                                    }}
                                                />
                                                <span className="font-medium">{preset.name}</span>
                                            </div>
                                            <p 
                                                className="text-xs"
                                                style={{ color: `${currentTheme.foreground}70` }}
                                            >
                                                {preset.description}
                                            </p>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Action Buttons */}
                    <div 
                        className="flex justify-between pt-3 border-t"
                        style={{ borderColor: `${currentTheme.foreground}20` }}
                    >
                        <button
                            onClick={resetToDefaults}
                            className="px-4 py-2 text-sm transition-opacity hover:opacity-70"
                            style={{ color: `${currentTheme.foreground}70` }}
                        >
                            Reset to Defaults
                        </button>
                        <button
                            onClick={onClose}
                            className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
                        >
                            Done
                        </button>
                    </div>
                </div>
            </div>

            <style>{`
                .slider::-webkit-slider-thumb {
                    appearance: none;
                    width: 16px;
                    height: 16px;
                    background: #3b82f6;
                    border-radius: 50%;
                    cursor: pointer;
                }
                
                .slider::-moz-range-thumb {
                    width: 16px;
                    height: 16px;
                    background: #3b82f6;
                    border-radius: 50%;
                    cursor: pointer;
                    border: none;
                }
            `}</style>
        </div>
    );
}
