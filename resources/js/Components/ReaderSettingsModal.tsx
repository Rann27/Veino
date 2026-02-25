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
                className="absolute rounded-2xl shadow-2xl w-80 max-h-[32rem] overflow-y-auto pointer-events-auto animate-in fade-in-0 zoom-in-95 duration-200 themed-scrollbar"
                style={{
                    top: `${position.top}px`,
                    left: `${position.left}px`,
                    backgroundColor: currentTheme.background,
                    border: `1px solid ${currentTheme.foreground}12`,
                    boxShadow: `0 20px 60px ${currentTheme.foreground}15`,
                    '--scrollbar-thumb': `${currentTheme.foreground}25`,
                    '--scrollbar-thumb-hover': `${currentTheme.foreground}40`,
                    '--scrollbar-track': `${currentTheme.foreground}06`,
                } as React.CSSProperties}
            >
                {/* Header */}
                <div 
                    className="sticky top-0 z-10 flex items-center justify-between px-5 py-4 rounded-t-2xl"
                    style={{ 
                        borderBottom: `1px solid ${currentTheme.foreground}10`,
                        backgroundColor: currentTheme.background,
                    }}
                >
                    <h2 
                        className="text-base font-bold flex items-center gap-2.5"
                        style={{ color: currentTheme.foreground }}
                    >
                        <div 
                            className="w-8 h-8 rounded-lg flex items-center justify-center"
                            style={{ backgroundColor: `${currentTheme.foreground}08` }}
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                        </div>
                        Reader Settings
                    </h2>
                    <button
                        onClick={onClose}
                        className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:opacity-70"
                        style={{ 
                            color: `${currentTheme.foreground}50`,
                            backgroundColor: `${currentTheme.foreground}06`,
                        }}
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="px-5 py-4 space-y-5">
                    {/* Font Family */}
                    <div>
                        <label 
                            className="block text-xs font-semibold uppercase tracking-wider mb-2"
                            style={{ color: `${currentTheme.foreground}60` }}
                        >
                            Font Family
                        </label>
                        <select
                            value={settings.fontFamily}
                            onChange={(e) => handleSettingChange('fontFamily', e.target.value)}
                            className="w-full rounded-lg transition-colors text-sm"
                            style={{
                                backgroundColor: `${currentTheme.foreground}06`,
                                border: `1px solid ${currentTheme.foreground}12`,
                                color: currentTheme.foreground,
                                padding: '8px 2.5rem 8px 12px',
                                appearance: 'none' as any,
                                colorScheme: (() => { try { const h=currentTheme.background.replace(/^#/,''); return (parseInt(h.slice(0,2),16)*.299+parseInt(h.slice(2,4),16)*.587+parseInt(h.slice(4,6),16)*.114)>128?'light':'dark'; } catch{return 'dark';} })() as any,
                                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='${encodeURIComponent(currentTheme.foreground)}' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E")`,
                                backgroundRepeat: 'no-repeat',
                                backgroundPosition: 'right 10px center',
                            }}
                        >
                            {googleFonts.map((font) => (
                                <option key={font.name} value={font.family} style={{ fontFamily: font.family, background: currentTheme.background, color: currentTheme.foreground }}>
                                    {font.name}
                                </option>
                            ))}
                        </select>
                        <div 
                            className="mt-2 p-3 rounded-lg text-sm leading-relaxed"
                            style={{ 
                                backgroundColor: `${currentTheme.foreground}05`,
                                color: `${currentTheme.foreground}70`,
                                fontFamily: settings.fontFamily,
                                border: `1px solid ${currentTheme.foreground}06`,
                            }}
                        >
                            The quick brown fox jumps over the lazy dog. This is a preview of the selected font.
                        </div>
                    </div>

                    {/* Font Size */}
                    <div>
                        <label 
                            className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider mb-2"
                            style={{ color: `${currentTheme.foreground}60` }}
                        >
                            <span>Font Size</span>
                            <span className="text-xs font-medium normal-case tracking-normal" style={{ color: `${currentTheme.foreground}90` }}>{settings.fontSize}px</span>
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
                            className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider mb-2"
                            style={{ color: `${currentTheme.foreground}60` }}
                        >
                            <span>Line Spacing</span>
                            <span className="text-xs font-medium normal-case tracking-normal" style={{ color: `${currentTheme.foreground}90` }}>{settings.lineHeight}</span>
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
                            className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider mb-2"
                            style={{ color: `${currentTheme.foreground}60` }}
                        >
                            <span>Content Width</span>
                            <span className="text-xs font-medium normal-case tracking-normal" style={{ color: `${currentTheme.foreground}90` }}>{settings.contentWidth}%</span>
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
                            className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider mb-2"
                            style={{ color: `${currentTheme.foreground}60` }}
                        >
                            <span>Paragraph Spacing</span>
                            <span className="text-xs font-medium normal-case tracking-normal" style={{ color: `${currentTheme.foreground}90` }}>{settings.paragraphSpacing}em</span>
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
                            className="block text-xs font-semibold uppercase tracking-wider mb-2"
                            style={{ color: `${currentTheme.foreground}60` }}
                        >
                            Text Alignment
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                            {(['left', 'center', 'justify'] as const).map((align) => (
                                <button
                                    key={align}
                                    onClick={() => handleSettingChange('textAlign', align)}
                                    className={`px-3 py-2 text-xs font-medium rounded-lg transition-all ${
                                        settings.textAlign === align ? '' : 'hover:opacity-80'
                                    }`}
                                    style={{
                                        backgroundColor: settings.textAlign === align 
                                            ? currentTheme.foreground 
                                            : `${currentTheme.foreground}06`,
                                        color: settings.textAlign === align 
                                            ? currentTheme.background 
                                            : `${currentTheme.foreground}80`,
                                        border: `1px solid ${settings.textAlign === align ? currentTheme.foreground : `${currentTheme.foreground}12`}`,
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
                            className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider mb-2"
                            style={{ color: `${currentTheme.foreground}60` }}
                        >
                            <span>Text Indent</span>
                            <span className="text-xs font-medium normal-case tracking-normal" style={{ color: `${currentTheme.foreground}90` }}>{settings.textIndent}em</span>
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
                            className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider"
                            style={{ color: `${currentTheme.foreground}60` }}
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
                            className="block text-xs font-semibold uppercase tracking-wider mb-2"
                            style={{ color: `${currentTheme.foreground}60` }}
                        >
                            Theme
                        </label>
                        <button
                            onClick={() => setShowThemeSelector(!showThemeSelector)}
                            className="w-full p-3 rounded-lg hover:opacity-80 transition-opacity flex items-center justify-between text-sm"
                            style={{
                                backgroundColor: `${currentTheme.foreground}06`,
                                border: `1px solid ${currentTheme.foreground}12`,
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
                                className="mt-2 p-2 rounded-lg"
                                style={{
                                    backgroundColor: `${currentTheme.foreground}04`,
                                    border: `1px solid ${currentTheme.foreground}08`,
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
                        className="flex justify-between items-center pt-4 mt-1"
                        style={{ borderTop: `1px solid ${currentTheme.foreground}10` }}
                    >
                        <button
                            onClick={resetToDefaults}
                            className="px-3 py-1.5 text-xs transition-all hover:opacity-70 rounded-lg"
                            style={{ 
                                color: `${currentTheme.foreground}60`,
                                backgroundColor: `${currentTheme.foreground}05`,
                            }}
                        >
                            Reset Defaults
                        </button>
                        <button
                            onClick={onClose}
                            className="px-5 py-1.5 rounded-lg text-xs font-semibold transition-all hover:opacity-90"
                            style={{
                                backgroundColor: currentTheme.foreground,
                                color: currentTheme.background,
                            }}
                        >
                            Done
                        </button>
                    </div>
                </div>
            </div>

            <style>{`
                .slider::-webkit-slider-thumb {
                    appearance: none;
                    width: 14px;
                    height: 14px;
                    background: ${currentTheme.foreground};
                    border-radius: 50%;
                    cursor: pointer;
                    box-shadow: 0 1px 4px ${currentTheme.foreground}30;
                    transition: transform 0.15s ease;
                }
                .slider::-webkit-slider-thumb:hover {
                    transform: scale(1.15);
                }
                .slider::-moz-range-thumb {
                    width: 14px;
                    height: 14px;
                    background: ${currentTheme.foreground};
                    border-radius: 50%;
                    cursor: pointer;
                    border: none;
                    box-shadow: 0 1px 4px ${currentTheme.foreground}30;
                }
            `}</style>
        </div>
    );
}
