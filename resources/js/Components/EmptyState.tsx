import React from 'react';
import { Link } from '@inertiajs/react';
import { useTheme } from '@/Contexts/ThemeContext';

interface EmptyStateAction {
    label: string;
    href?: string;
    onClick?: () => void;
    variant?: 'primary' | 'accent' | 'ghost';
}

interface EmptyStateProps {
    icon?: React.ReactNode;
    title: string;
    description?: string;
    action?: EmptyStateAction;
    compact?: boolean;
}

const VARIANT_STYLES = {
    primary: { backgroundColor: '#a78bfa', color: '#fff' },
    accent:  { backgroundColor: '#f59e0b', color: '#fff' },
    ghost:   { backgroundColor: 'transparent', border: '1.5px solid currentColor' },
};

export default function EmptyState({ icon, title, description, action, compact = false }: EmptyStateProps) {
    const { currentTheme } = useTheme();

    const defaultIcon = (
        <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    );

    const actionStyle = action?.variant ? VARIANT_STYLES[action.variant] : VARIANT_STYLES.primary;

    return (
        <div className={`flex flex-col items-center justify-center text-center ${compact ? 'py-8 px-4' : 'py-16 px-6'}`}>
            {/* Icon */}
            <div
                className={`empty-state-icon ${compact ? 'w-12 h-12 mb-4' : 'w-16 h-16 mb-6'}`}
                style={{ color: `${currentTheme.foreground}40` }}
            >
                {icon ?? defaultIcon}
            </div>

            {/* Title */}
            <h3
                className={`font-semibold mb-2 ${compact ? 'text-base' : 'text-xl'}`}
                style={{ color: currentTheme.foreground }}
            >
                {title}
            </h3>

            {/* Description */}
            {description && (
                <p
                    className={`max-w-xs leading-relaxed mb-6 ${compact ? 'text-xs' : 'text-sm'}`}
                    style={{ color: `${currentTheme.foreground}60` }}
                >
                    {description}
                </p>
            )}

            {/* Action */}
            {action && (
                action.href ? (
                    <Link
                        href={action.href}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all hover:opacity-90 hover:scale-[1.03]"
                        style={actionStyle}
                    >
                        {action.label}
                    </Link>
                ) : (
                    <button
                        onClick={action.onClick}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all hover:opacity-90 hover:scale-[1.03]"
                        style={actionStyle}
                    >
                        {action.label}
                    </button>
                )
            )}
        </div>
    );
}
