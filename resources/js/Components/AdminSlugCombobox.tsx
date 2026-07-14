import React, { useEffect, useMemo, useRef, useState } from 'react';

export interface SlugOption {
    id: number;
    title: string;
    slug: string;
}

interface AdminSlugComboboxProps {
    value: string;
    onChange: (value: string) => void;
    options: SlugOption[];
    placeholder?: string;
    required?: boolean;
    fg: string;
    muted: string;
    border: string;
    inputBg: string;
    panelBg: string;
    accent: string;
}

export default function AdminSlugCombobox({
    value,
    onChange,
    options,
    placeholder,
    required = false,
    fg,
    muted,
    border,
    inputBg,
    panelBg,
    accent,
}: AdminSlugComboboxProps) {
    const [open, setOpen] = useState(false);
    const rootRef = useRef<HTMLDivElement>(null);

    const filteredOptions = useMemo(() => {
        const query = value.trim().toLowerCase();
        const matched = query
            ? options.filter((option) =>
                option.slug.toLowerCase().includes(query) ||
                option.title.toLowerCase().includes(query)
            )
            : options;

        return matched.slice(0, 12);
    }, [options, value]);

    useEffect(() => {
        const handlePointerDown = (event: MouseEvent) => {
            if (!rootRef.current?.contains(event.target as Node)) {
                setOpen(false);
            }
        };

        document.addEventListener('mousedown', handlePointerDown);
        return () => document.removeEventListener('mousedown', handlePointerDown);
    }, []);

    return (
        <div ref={rootRef} style={{ position: 'relative' }}>
            <input
                type="text"
                value={value}
                onChange={(event) => {
                    onChange(event.target.value);
                    setOpen(true);
                }}
                onFocus={() => setOpen(true)}
                placeholder={placeholder}
                required={required}
                autoComplete="off"
                style={{
                    width: '100%',
                    padding: '0.5rem 1rem',
                    borderRadius: '0.5rem',
                    border: `1px solid ${border}`,
                    background: inputBg,
                    color: fg,
                    outline: 'none',
                    boxSizing: 'border-box',
                    fontFamily: 'inherit',
                    fontSize: '0.875rem',
                }}
            />

            {open && (
                <div
                    style={{
                        position: 'absolute',
                        top: 'calc(100% + 0.35rem)',
                        left: 0,
                        right: 0,
                        zIndex: 80,
                        maxHeight: '17rem',
                        overflowY: 'auto',
                        borderRadius: '0.75rem',
                        border: `1px solid ${border}`,
                        background: panelBg,
                        backdropFilter: 'none',
                        boxShadow: '0 18px 45px rgba(0,0,0,0.55)',
                        padding: '0.35rem',
                    }}
                >
                    {filteredOptions.length > 0 ? (
                        filteredOptions.map((option) => (
                            <button
                                key={option.id}
                                type="button"
                                onClick={() => {
                                    onChange(option.slug);
                                    setOpen(false);
                                }}
                                style={{
                                    width: '100%',
                                    display: 'block',
                                    textAlign: 'left',
                                    padding: '0.65rem 0.75rem',
                                    border: 0,
                                    borderRadius: '0.55rem',
                                    background: option.slug === value ? `${accent}22` : 'transparent',
                                    color: fg,
                                    cursor: 'pointer',
                                }}
                                onMouseEnter={(event) => {
                                    event.currentTarget.style.background = `${accent}18`;
                                }}
                                onMouseLeave={(event) => {
                                    event.currentTarget.style.background = option.slug === value ? `${accent}22` : 'transparent';
                                }}
                            >
                                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: option.slug === value ? accent : fg }}>
                                    {option.slug}
                                </div>
                                <div style={{ marginTop: '0.15rem', fontSize: '0.75rem', color: muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {option.title}
                                </div>
                            </button>
                        ))
                    ) : (
                        <div style={{ padding: '0.85rem 0.75rem', fontSize: '0.8rem', color: muted }}>
                            No matching series found
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
