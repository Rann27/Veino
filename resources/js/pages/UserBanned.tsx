import React from 'react';
import { Head, router } from '@inertiajs/react';
import AuthLayout from '@/Layouts/AuthLayout';
import { useTheme } from '@/Contexts/ThemeContext';

interface Props {
    reason: string | null;
    bannedAt: string | null;
    discordUrl: string;
}

const DANGER = '#ef4444';

function UserBannedContent({ reason, bannedAt, discordUrl }: Props) {
    const { currentTheme } = useTheme();
    const fg = currentTheme.foreground;
    const bg = currentTheme.background;
    const border = `${fg}15`;
    const muted = `${fg}70`;

    const when = bannedAt
        ? new Date(bannedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
        : null;

    return (
        <div className="min-h-screen flex items-center justify-center px-4 py-12" style={{ background: bg }}>
            <div className="w-full max-w-lg text-center">

                <div className="mx-auto mb-6 flex items-center justify-center rounded-full"
                    style={{ width: 64, height: 64, background: `${DANGER}18`, border: `1px solid ${DANGER}40` }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke={DANGER} strokeWidth={1.8}
                        strokeLinecap="round" style={{ width: 30, height: 30 }}>
                        <circle cx="12" cy="12" r="9" />
                        <path d="m5.6 5.6 12.8 12.8" />
                    </svg>
                </div>

                <h1 className="text-2xl sm:text-3xl font-extrabold mb-3" style={{ color: fg }}>
                    Your Account is Banned
                </h1>

                {when && (
                    <p className="text-xs mb-5" style={{ color: muted }}>Banned on {when}</p>
                )}

                {/* The reason an admin wrote, shown verbatim. Left out entirely
                    rather than filled with a placeholder when none was given —
                    an empty "Reason:" line reads worse than no line at all. */}
                {reason ? (
                    <div className="rounded-xl px-5 py-4 mb-6 text-left"
                        style={{ background: `${DANGER}0D`, border: `1px solid ${DANGER}25` }}>
                        <p className="text-[11px] font-bold uppercase tracking-wider mb-1.5" style={{ color: DANGER }}>
                            Reason
                        </p>
                        <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: fg }}>
                            {reason}
                        </p>
                    </div>
                ) : (
                    <div className="rounded-xl px-5 py-4 mb-6"
                        style={{ background: `${fg}08`, border: `1px solid ${border}` }}>
                        <p className="text-sm" style={{ color: muted }}>
                            No reason was recorded for this ban.
                        </p>
                    </div>
                )}

                <p className="text-sm leading-relaxed mb-7" style={{ color: muted }}>
                    If you believe this is a mistake, open a ticket on our Discord to appeal.
                </p>

                <a href={discordUrl} target="_blank" rel="noreferrer"
                    className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-sm transition-opacity hover:opacity-90"
                    style={{ background: '#5865F2', color: '#fff' }}>
                    <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 18, height: 18 }}>
                        <path d="M20.3 4.4A19.8 19.8 0 0 0 15.4 3l-.2.4a18.3 18.3 0 0 1 4.3 1.4 15.6 15.6 0 0 0-13-1.4l-.2-.4a19.8 19.8 0 0 0-4.6 1.4C-.8 9.5.1 14.4.6 19.2A19.9 19.9 0 0 0 6.6 21l.5-1.1a12.9 12.9 0 0 1-2-1l.4-.3a14.2 14.2 0 0 0 12.2 0l.4.3a12.9 12.9 0 0 1-2 1l.5 1.1a19.9 19.9 0 0 0 6-1.8c.6-5.6-.9-10.4-2.3-14.8ZM8.3 16.2c-1.2 0-2.1-1.1-2.1-2.4S7.1 11.4 8.3 11.4s2.2 1.1 2.2 2.4-1 2.4-2.2 2.4Zm7.4 0c-1.2 0-2.1-1.1-2.1-2.4s.9-2.4 2.1-2.4 2.2 1.1 2.2 2.4-1 2.4-2.2 2.4Z" />
                    </svg>
                    Join Discord
                </a>

                <div className="mt-8 pt-6" style={{ borderTop: `1px solid ${border}` }}>
                    <button onClick={() => router.post('/logout')}
                        className="text-xs underline transition-opacity hover:opacity-70"
                        style={{ color: muted }}>
                        Sign out
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function UserBanned(props: Props) {
    return (
        <AuthLayout>
            <Head title="Account Banned" />
            <UserBannedContent {...props} />
        </AuthLayout>
    );
}
