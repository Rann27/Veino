import React, { useState, useEffect } from 'react';
import { useTheme, themePresets } from '@/Contexts/ThemeContext';

interface ThemeSelectorModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function ThemeSelectorModal({ isOpen, onClose }: ThemeSelectorModalProps) {
    const { currentTheme, setTheme, isSystemTheme, toggleSystemTheme } = useTheme();

    // Custom theme state
    const [customFg, setCustomFg] = useState('#000000');
    const [customBg, setCustomBg] = useState('#ffffff');

    // Load custom theme from localStorage
    useEffect(() => {
        try {
            const saved = localStorage.getItem('veinovel-custom-theme');
            if (saved) {
                const data = JSON.parse(saved);
                if (data.foreground) setCustomFg(data.foreground);
                if (data.background) setCustomBg(data.background);
            }
        } catch {}
    }, []);

    if (!isOpen) return null;

    const isCustomActive = currentTheme.name === 'Custom' && !isSystemTheme;

    const applyCustom = (bg: string, fg: string) => {
        const customTheme = { name: 'Custom', background: bg, foreground: fg, description: 'Custom theme' };
        localStorage.setItem('veinovel-custom-theme', JSON.stringify({ foreground: fg, background: bg }));
        setTheme(customTheme);
    };

    const handleCustomBgChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setCustomBg(e.target.value);
        applyCustom(e.target.value, customFg);
    };

    const handleCustomFgChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setCustomFg(e.target.value);
        applyCustom(customBg, e.target.value);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop — no glassmorphism */}
            <div
                className="fixed inset-0 bg-black/50"
                onClick={onClose}
            />

            {/* Modal — single consistent border radius (8px / rounded-lg) */}
            <div
                className="relative rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-hidden border"
                style={{
                    backgroundColor: currentTheme.background,
                    borderColor: `${currentTheme.foreground}15`,
                }}
            >
                {/* Header */}
                <div
                    className="flex items-center justify-between px-6 py-4 border-b"
                    style={{ borderColor: `${currentTheme.foreground}15` }}
                >
                    <h2
                        className="text-lg font-semibold"
                        style={{ color: currentTheme.foreground }}
                    >
                        Theme Settings
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-md transition-colors hover:opacity-75"
                        style={{ color: `${currentTheme.foreground}60` }}
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Scrollable Content */}
                <div className="overflow-y-auto max-h-[calc(90vh-120px)] p-6">
                    {/* System Theme Toggle */}
                    <div
                        className="mb-5 p-3.5 rounded-lg border"
                        style={{
                            backgroundColor: `${currentTheme.foreground}06`,
                            borderColor: `${currentTheme.foreground}12`,
                        }}
                    >
                        <label className="flex items-center justify-between cursor-pointer">
                            <div>
                                <span
                                    className="font-medium text-sm"
                                    style={{ color: currentTheme.foreground }}
                                >
                                    Auto Theme
                                </span>
                                <p
                                    className="text-xs mt-0.5"
                                    style={{ color: `${currentTheme.foreground}60` }}
                                >
                                    Follow system dark/light preference
                                </p>
                            </div>
                            <button
                                onClick={toggleSystemTheme}
                                className="relative inline-flex h-5 w-10 items-center rounded-full transition-colors focus:outline-none"
                                style={{
                                    backgroundColor: isSystemTheme ? currentTheme.foreground : `${currentTheme.foreground}25`,
                                }}
                            >
                                <span
                                    className="inline-block h-3.5 w-3.5 transform rounded-full transition-transform"
                                    style={{
                                        backgroundColor: isSystemTheme ? currentTheme.background : currentTheme.foreground,
                                        transform: isSystemTheme ? 'translateX(1.35rem)' : 'translateX(0.2rem)',
                                    }}
                                />
                            </button>
                        </label>
                    </div>

                    {/* Theme Options */}
                    <div className="space-y-3">
                        <h3
                            className="font-medium text-sm mb-2.5"
                            style={{ color: currentTheme.foreground }}
                        >
                            Select Preset
                        </h3>

                        {/* Preset Grid */}
                        <div className="grid grid-cols-2 gap-2.5">
                            {themePresets.map((preset) => {
                                const isSelected = currentTheme.name === preset.name && !isSystemTheme;
                                return (
                                    <button
                                        key={preset.name}
                                        onClick={() => setTheme(preset)}
                                        disabled={isSystemTheme}
                                        className={`relative p-3 rounded-lg text-left transition-all ${
                                            isSystemTheme ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                                        }`}
                                        style={{
                                            border: `1.5px solid ${isSelected ? currentTheme.foreground : `${currentTheme.foreground}15`}`,
                                            backgroundColor: isSelected ? `${currentTheme.foreground}0C` : `${currentTheme.foreground}04`,
                                        }}
                                    >
                                        {/* Color Swatches + Name */}
                                        <div className="flex items-center gap-2.5">
                                            {/* Preview swatch */}
                                            <div
                                                className="w-8 h-8 rounded-md flex-shrink-0"
                                                style={{
                                                    background: `linear-gradient(135deg, ${preset.background} 50%, ${preset.foreground} 50%)`,
                                                    border: `1px solid ${currentTheme.foreground}15`,
                                                }}
                                            />
                                            <div className="flex-1 min-w-0">
                                                <div
                                                    className="font-medium text-xs truncate"
                                                    style={{ color: currentTheme.foreground }}
                                                >
                                                    {preset.name}
                                                </div>
                                                <div className="flex items-center gap-1 mt-1">
                                                    <div
                                                        className="w-2.5 h-2.5 rounded-full border"
                                                        style={{
                                                            backgroundColor: preset.background,
                                                            borderColor: `${currentTheme.foreground}20`,
                                                        }}
                                                    />
                                                    <div
                                                        className="w-2.5 h-2.5 rounded-full border"
                                                        style={{
                                                            backgroundColor: preset.foreground,
                                                            borderColor: `${currentTheme.foreground}20`,
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Selected indicator dot */}
                                        {isSelected && (
                                            <div className="absolute top-2 right-2 w-2 h-2 rounded-full" style={{ backgroundColor: currentTheme.foreground }} />
                                        )}
                                    </button>
                                );
                            })}

                            {/* Custom Theme Card */}
                            <button
                                onClick={() => !isSystemTheme && applyCustom(customBg, customFg)}
                                disabled={isSystemTheme}
                                className={`relative col-span-2 p-3 rounded-lg text-left transition-all ${
                                    isSystemTheme ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                                }`}
                                style={{
                                    border: `1.5px solid ${isCustomActive ? currentTheme.foreground : `${currentTheme.foreground}15`}`,
                                    backgroundColor: isCustomActive ? `${currentTheme.foreground}0C` : `${currentTheme.foreground}04`,
                                }}
                            >
                                <div className="flex items-center gap-3">
                                    <div
                                        className="w-8 h-8 rounded-md flex-shrink-0"
                                        style={{
                                            background: `linear-gradient(135deg, ${customBg} 50%, ${customFg} 50%)`,
                                            border: `1px solid ${currentTheme.foreground}15`,
                                        }}
                                    />

                                    <div className="flex-1 min-w-0">
                                        <div className="font-medium text-xs" style={{ color: currentTheme.foreground }}>
                                            Custom Palette
                                        </div>
                                        <div className="text-[11px] mt-0.5" style={{ color: `${currentTheme.foreground}50` }}>
                                            Pick background and foreground
                                        </div>
                                    </div>

                                    {/* Color pickers */}
                                    <div className="flex items-center gap-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                                        <div className="flex items-center gap-1">
                                            <span className="text-[10px] uppercase font-medium" style={{ color: `${currentTheme.foreground}50` }}>BG</span>
                                            <div className="relative w-6 h-6 rounded border cursor-pointer overflow-hidden" style={{ backgroundColor: customBg, borderColor: `${currentTheme.foreground}20` }}>
                                                <input type="color" value={customBg} onChange={handleCustomBgChange} disabled={isSystemTheme} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <span className="text-[10px] uppercase font-medium" style={{ color: `${currentTheme.foreground}50` }}>FG</span>
                                            <div className="relative w-6 h-6 rounded border cursor-pointer overflow-hidden" style={{ backgroundColor: customFg, borderColor: `${currentTheme.foreground}20` }}>
                                                <input type="color" value={customFg} onChange={handleCustomFgChange} disabled={isSystemTheme} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {isCustomActive && (
                                    <div className="absolute top-2 right-2 w-2 h-2 rounded-full" style={{ backgroundColor: currentTheme.foreground }} />
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}