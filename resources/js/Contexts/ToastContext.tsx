import React, { createContext, useContext, useState, useCallback, useRef } from 'react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
    id: number;
    type: ToastType;
    title?: string;
    message: string;
    duration?: number;
}

interface ToastContextValue {
    toasts: Toast[];
    toast: {
        success: (message: string, title?: string) => void;
        error: (message: string, title?: string) => void;
        warning: (message: string, title?: string) => void;
        info: (message: string, title?: string) => void;
    };
    confirm: (message: string, onConfirm: () => void, title?: string) => void;
    dismiss: (id: number) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

let _counter = 0;

interface ConfirmDialog {
    message: string;
    title?: string;
    onConfirm: () => void;
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

    const confirm = useCallback((message: string, onConfirm: () => void, title?: string) => {
        setConfirmDialog({ message, onConfirm, title });
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
}: {
    dialog: ConfirmDialog;
    onConfirm: () => void;
    onCancel: () => void;
}) {
    return (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center px-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} />
            <div
                className="relative rounded-2xl p-6 max-w-sm w-full shadow-2xl"
                style={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)' }}
            >
                <div className="flex items-start gap-4 mb-5">
                    <div
                        className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: 'rgba(239,68,68,0.15)' }}
                    >
                        <svg className="w-5 h-5" fill="none" stroke="#ef4444" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                        </svg>
                    </div>
                    <div>
                        {dialog.title && (
                            <h3 className="text-base font-semibold text-white mb-1">{dialog.title}</h3>
                        )}
                        <p className="text-sm text-white/70 leading-relaxed">{dialog.message}</p>
                    </div>
                </div>
                <div className="flex gap-3 justify-end">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 rounded-lg text-sm font-medium transition-opacity hover:opacity-80"
                        style={{ backgroundColor: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.7)' }}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        className="px-4 py-2 rounded-lg text-sm font-semibold transition-opacity hover:opacity-90"
                        style={{ backgroundColor: '#ef4444', color: '#fff' }}
                    >
                        Confirm
                    </button>
                </div>
            </div>
        </div>
    );
}
