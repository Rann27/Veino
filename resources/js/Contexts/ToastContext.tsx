import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { useTheme } from '@/Contexts/ThemeContext';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
    id: number;
    type: ToastType;
    title?: string;
    message: string;
    duration?: number;
}

export type ConfirmVariant = 'default' | 'danger' | 'purchase';

interface ToastContextValue {
    toasts: Toast[];
    toast: {
        success: (message: string, title?: string) => void;
        error: (message: string, title?: string) => void;
        warning: (message: string, title?: string) => void;
        info: (message: string, title?: string) => void;
    };
    confirm: (message: string, onConfirm: () => void, title?: string, variant?: ConfirmVariant) => void;
    dismiss: (id: number) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

let _counter = 0;

interface ConfirmDialog {
    message: string;
    title?: string;
    onConfirm: () => void;
    variant?: ConfirmVariant;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);
    const [confirmDialog, setConfirmDialog] = useState<ConfirmDialog | null>(null);
    const timersRef = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

    const dismiss = useCallback((id: number) => {
        const timer = timersRef.current.get(id);
        if (timer) {
            clearTimeout(timer);
            timersRef.current.delete(id);
        }
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    const add = useCallback((type: ToastType, message: string, title?: string, duration = 4000) => {
        const id = ++_counter;
        setToasts(prev => [...prev.slice(-4), { id, type, message, title, duration }]);
        const timer = setTimeout(() => dismiss(id), duration);
        timersRef.current.set(id, timer);
    }, [dismiss]);

    const toast = {
        success: (message: string, title?: string) => add('success', message, title),
        error: (message: string, title?: string) => add('error', message, title, 5000),
        warning: (message: string, title?: string) => add('warning', message, title),
        info: (message: string, title?: string) => add('info', message, title),
    };

    const confirm = useCallback((message: string, onConfirm: () => void, title?: string, variant?: ConfirmVariant) => {
        setConfirmDialog({ message, onConfirm, title, variant });
    }, []);

    return (
        <ToastContext.Provider value={{ toasts, toast, confirm, dismiss }}>
            {children}
            <ToastContainer toasts={toasts} dismiss={dismiss} />
            {confirmDialog && (
                <ConfirmDialogModal
                    dialog={confirmDialog}
                    onConfirm={() => { confirmDialog.onConfirm(); setConfirmDialog(null); }}
                    onCancel={() => setConfirmDialog(null)}
                    variant={confirmDialog.variant ?? 'default'}
                />
            )}
        </ToastContext.Provider>
    );
}

export function useToast() {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error('useToast must be used within ToastProvider');
    return ctx;
}

// ─── Toast Container ─────────────────────────────────────────────────────────

function ToastContainer({ toasts, dismiss }: { toasts: Toast[]; dismiss: (id: number) => void }) {
    if (toasts.length === 0) return null;
    return (
        <div
            className="fixed bottom-20 right-4 z-[9999] flex flex-col gap-2 pointer-events-none sm:bottom-4"
            aria-live="polite"
        >
            {toasts.map(t => (
                <ToastItem key={t.id} toast={t} dismiss={dismiss} />
            ))}
        </div>
    );
}

const TOAST_ICONS: Record<ToastType, React.ReactNode> = {
    success: (
        <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
    ),
    error: (
        <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
    ),
    warning: (
        <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
        </svg>
    ),
    info: (
        <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    ),
};

const TOAST_STYLES: Record<ToastType, { bg: string; border: string; color: string }> = {
    success: { bg: 'rgba(16,185,129,0.12)', border: '#10b981', color: '#10b981' },
    error:   { bg: 'rgba(239,68,68,0.12)',  border: '#ef4444', color: '#ef4444' },
    warning: { bg: 'rgba(245,158,11,0.12)', border: '#f59e0b', color: '#f59e0b' },
    info:    { bg: 'rgba(167,139,250,0.12)',border: '#a78bfa', color: '#a78bfa' },
};

function ToastItem({ toast, dismiss }: { toast: Toast; dismiss: (id: number) => void }) {
    const s = TOAST_STYLES[toast.type];
    return (
        <div
            className="pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-xl shadow-xl backdrop-blur-sm max-w-sm w-full toast-item"
            style={{
                backgroundColor: s.bg,
                border: `1px solid ${s.border}40`,
                color: '#fff',
            }}
        >
            <span style={{ color: s.color }}>{TOAST_ICONS[toast.type]}</span>
            <div className="flex-1 min-w-0">
                {toast.title && (
                    <p className="text-sm font-semibold leading-tight mb-0.5" style={{ color: s.color }}>
                        {toast.title}
                    </p>
                )}
                <p className="text-sm leading-snug opacity-90">{toast.message}</p>
            </div>
            <button
                onClick={() => dismiss(toast.id)}
                className="flex-shrink-0 opacity-50 hover:opacity-100 transition-opacity mt-0.5"
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>
    );
}

// ─── Confirm Dialog ───────────────────────────────────────────────────────────

function ConfirmDialogModal({
    dialog,
    onConfirm,
    onCancel,
    variant = 'default',
}: {
    dialog: ConfirmDialog;
    onConfirm: () => void;
    onCancel: () => void;
    variant?: ConfirmVariant;
}) {
    const { currentTheme } = useTheme();

    if (variant === 'purchase') {
        // Extract coin amount from message for display (e.g. "¢12")
        const coinMatch = dialog.message.match(/¢([\d,]+)/);
        const coinAmount = coinMatch ? coinMatch[0] : null;

        return (
            <div className="fixed inset-0 z-[10000] flex items-center justify-center px-4">
                <div className="absolute inset-0 bg-black/50 backdrop-blur-md" onClick={onCancel} />
                <div
                    className="relative rounded-3xl max-w-xs w-full shadow-2xl overflow-hidden"
                    style={{
                        backgroundColor: currentTheme.background,
                        border: `1px solid ${currentTheme.foreground}15`,
                    }}
                >
                    {/* Gold accent top bar */}
                    <div
                        className="h-1 w-full"
                        style={{ background: 'linear-gradient(90deg, #f59e0b, #fbbf24, #f59e0b)' }}
                    />

                    <div className="px-6 pt-6 pb-5 text-center">
                        {/* Coin icon */}
                        <div className="flex justify-center mb-4">
                            <div
                                className="w-16 h-16 rounded-full flex items-center justify-center"
                                style={{
                                    background: 'linear-gradient(135deg, rgba(245,158,11,0.18) 0%, rgba(251,191,36,0.10) 100%)',
                                    boxShadow: '0 0 0 1px rgba(245,158,11,0.25), 0 0 24px rgba(245,158,11,0.15)',
                                }}
                            >
                                <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none">
                                    <circle cx="12" cy="12" r="9" fill="url(#coinGrad)" />
                                    <text
                                        x="12" y="16.5"
                                        textAnchor="middle"
                                        fontSize="11"
                                        fontWeight="800"
                                        fill="#92400e"
                                        fontFamily="serif"
                                    >¢</text>
                                    <defs>
                                        <radialGradient id="coinGrad" cx="35%" cy="30%" r="70%">
                                            <stop offset="0%" stopColor="#fde68a" />
                                            <stop offset="60%" stopColor="#f59e0b" />
                                            <stop offset="100%" stopColor="#d97706" />
                                        </radialGradient>
                                    </defs>
                                </svg>
                            </div>
                        </div>

                        {/* Title */}
                        {dialog.title && (
                            <h3
                                className="text-lg font-bold mb-1"
                                style={{ color: currentTheme.foreground }}
                            >
                                {dialog.title}
                            </h3>
                        )}

                        {/* Coin amount badge */}
                        {coinAmount && (
                            <div className="flex justify-center mb-3">
                                <span
                                    className="px-4 py-1.5 rounded-full text-sm font-bold tracking-wide"
                                    style={{
                                        background: 'linear-gradient(135deg, rgba(245,158,11,0.15), rgba(251,191,36,0.10))',
                                        color: '#f59e0b',
                                        border: '1px solid rgba(245,158,11,0.3)',
                                    }}
                                >
                                    {coinAmount} coins
                                </span>
                            </div>
                        )}

                        {/* Message */}
                        <p
                            className="text-sm leading-relaxed mb-6"
                            style={{ color: `${currentTheme.foreground}65` }}
                        >
                            {dialog.message}
                        </p>

                        {/* Buttons */}
                        <div className="flex gap-3">
                            <button
                                onClick={onCancel}
                                className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-opacity hover:opacity-70"
                                style={{
                                    backgroundColor: `${currentTheme.foreground}10`,
                                    color: `${currentTheme.foreground}80`,
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={onConfirm}
                                className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all hover:brightness-110 active:scale-95"
                                style={{
                                    background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                                    color: '#fff',
                                    boxShadow: '0 4px 14px rgba(245,158,11,0.35)',
                                }}
                            >
                                Confirm
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (variant === 'danger') {
        return (
            <div className="fixed inset-0 z-[10000] flex items-center justify-center px-4">
                <div className="absolute inset-0 bg-black/50 backdrop-blur-md" onClick={onCancel} />
                <div
                    className="relative rounded-3xl max-w-xs w-full shadow-2xl overflow-hidden"
                    style={{
                        backgroundColor: currentTheme.background,
                        border: `1px solid ${currentTheme.foreground}15`,
                    }}
                >
                    <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg, #ef4444, #f87171, #ef4444)' }} />
                    <div className="px-6 pt-6 pb-5">
                        <div className="flex items-start gap-3 mb-5">
                            <div
                                className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                                style={{ backgroundColor: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.2)' }}
                            >
                                <svg className="w-4.5 h-4.5" fill="none" stroke="#ef4444" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                                </svg>
                            </div>
                            <div>
                                {dialog.title && (
                                    <h3 className="text-base font-bold mb-1" style={{ color: currentTheme.foreground }}>
                                        {dialog.title}
                                    </h3>
                                )}
                                <p className="text-sm leading-relaxed" style={{ color: `${currentTheme.foreground}65` }}>
                                    {dialog.message}
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={onCancel}
                                className="px-4 py-2 rounded-xl text-sm font-medium transition-opacity hover:opacity-70"
                                style={{ backgroundColor: `${currentTheme.foreground}10`, color: `${currentTheme.foreground}80` }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={onConfirm}
                                className="px-4 py-2 rounded-xl text-sm font-bold transition-all hover:brightness-110 active:scale-95"
                                style={{ backgroundColor: '#ef4444', color: '#fff', boxShadow: '0 4px 12px rgba(239,68,68,0.3)' }}
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Default variant
    return (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center px-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-md" onClick={onCancel} />
            <div
                className="relative rounded-3xl max-w-xs w-full shadow-2xl overflow-hidden"
                style={{
                    backgroundColor: currentTheme.background,
                    border: `1px solid ${currentTheme.foreground}15`,
                }}
            >
                <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg, #a78bfa, #c4b5fd, #a78bfa)' }} />
                <div className="px-6 pt-6 pb-5">
                    <div className="flex items-start gap-3 mb-5">
                        <div
                            className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                            style={{ backgroundColor: 'rgba(167,139,250,0.12)', border: '1px solid rgba(167,139,250,0.2)' }}
                        >
                            <svg className="w-4.5 h-4.5" fill="none" stroke="#a78bfa" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div>
                            {dialog.title && (
                                <h3 className="text-base font-bold mb-1" style={{ color: currentTheme.foreground }}>
                                    {dialog.title}
                                </h3>
                            )}
                            <p className="text-sm leading-relaxed" style={{ color: `${currentTheme.foreground}65` }}>
                                {dialog.message}
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-3 justify-end">
                        <button
                            onClick={onCancel}
                            className="px-4 py-2 rounded-xl text-sm font-medium transition-opacity hover:opacity-70"
                            style={{ backgroundColor: `${currentTheme.foreground}10`, color: `${currentTheme.foreground}80` }}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={onConfirm}
                            className="px-4 py-2 rounded-xl text-sm font-bold transition-all hover:brightness-110 active:scale-95"
                            style={{ backgroundColor: '#a78bfa', color: '#fff', boxShadow: '0 4px 12px rgba(167,139,250,0.3)' }}
                        >
                            Confirm
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
