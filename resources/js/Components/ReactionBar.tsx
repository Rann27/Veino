import { useState, useEffect } from 'react';
import { useTheme, SHINY_PURPLE } from '@/Contexts/ThemeContext';

interface ReactionCounts {
    like?: number;
    love?: number;
    haha?: number;
    angry?: number;
    sad?: number;
}

interface ReactionBarProps {
    reactableType: 'series' | 'chapter' | 'comment';
    reactableId: number;
    initialCounts?: ReactionCounts;
    initialUserReaction?: string | null;
    isAuthenticated: boolean;
    size?: 'small' | 'medium' | 'large';
    onReactionUpdate?: (counts: ReactionCounts, userReaction: string | null) => void;
}

const REACTIONS: { type: keyof ReactionCounts; label: string; emoji: string; color: string }[] = [
    { type: 'like',  label: 'Like',  emoji: '👍', color: '#3b82f6' },
    { type: 'love',  label: 'Love',  emoji: '❤️', color: '#ef4444' },
    { type: 'haha',  label: 'Haha',  emoji: '😂', color: '#f59e0b' },
    { type: 'angry', label: 'Angry', emoji: '😠', color: '#dc2626' },
    { type: 'sad',   label: 'Sad',   emoji: '😢', color: '#6366f1' },
];

const reactionImages: Record<string, string> = {
    like:  '/images/reaction/like.png',
    love:  '/images/reaction/love.png',
    haha:  '/images/reaction/haha.png',
    angry: '/images/reaction/angry.png',
    sad:   '/images/reaction/sad.png',
};

function formatCount(n: number): string {
    if (n >= 1000000) return (n / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    if (n >= 1000)    return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
    return String(n);
}

export default function ReactionBar({
    reactableType,
    reactableId,
    initialCounts = {},
    initialUserReaction = null,
    isAuthenticated,
    size = 'medium',
    onReactionUpdate,
}: ReactionBarProps) {
    const { currentTheme } = useTheme();
    const [counts, setCounts]           = useState<ReactionCounts>(initialCounts);
    const [userReaction, setUserReaction] = useState<string | null>(initialUserReaction);
    const [submitting, setSubmitting]   = useState(false);
    const [loading, setLoading]         = useState(true);
    const [imgErrors, setImgErrors]     = useState<Record<string, boolean>>({});

    const imgSize = size === 'small' ? 36 : size === 'large' ? 56 : 44;

    useEffect(() => {
        loadReactions();
    }, [reactableType, reactableId]);

    const loadReactions = async () => {
        try {
            const res = await fetch(route('reactions.index', { type: reactableType, id: reactableId }));
            if (res.ok) {
                const data = await res.json();
                setCounts(data.reaction_counts || {});
                setUserReaction(data.user_reaction || null);
            }
        } catch (e) {
            console.error('Error loading reactions:', e);
        } finally {
            setLoading(false);
        }
    };

    const handleReaction = async (type: string) => {
        if (submitting) return;
        setSubmitting(true);

        // Optimistic update
        const prev = userReaction;
        const prevCounts = { ...counts };

        const next = prev === type ? null : type;
        const nextCounts = { ...counts };

        if (prev && prev in nextCounts) {
            nextCounts[prev as keyof ReactionCounts] = Math.max(0, (nextCounts[prev as keyof ReactionCounts] || 1) - 1);
            if (nextCounts[prev as keyof ReactionCounts] === 0) delete nextCounts[prev as keyof ReactionCounts];
        }
        if (next) {
            nextCounts[next as keyof ReactionCounts] = (nextCounts[next as keyof ReactionCounts] || 0) + 1;
        }

        setUserReaction(next);
        setCounts(nextCounts);

        try {
            const res = await fetch(route('reactions.toggle'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                    'Accept': 'application/json',
                },
                body: JSON.stringify({
                    reactable_type: reactableType,
                    reactable_id:   reactableId,
                    type,
                }),
            });

            if (res.ok) {
                const data = await res.json();
                setCounts(data.reaction_counts || {});
                setUserReaction(data.user_reaction || null);
                onReactionUpdate?.(data.reaction_counts || {}, data.user_reaction || null);
            } else {
                // Roll back on failure
                setUserReaction(prev);
                setCounts(prevCounts);
            }
        } catch (e) {
            console.error('Error toggling reaction:', e);
            setUserReaction(prev);
            setCounts(prevCounts);
        } finally {
            setSubmitting(false);
        }
    };

    const total = Object.values(counts).reduce((s, c) => s + (c || 0), 0);

    if (loading) {
        return (
            <div className="flex justify-center py-6">
                <div className="w-6 h-6 rounded-full border-2 animate-spin"
                    style={{ borderColor: `${currentTheme.foreground}30`, borderTopColor: SHINY_PURPLE }} />
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center gap-5">
            {/* Total */}
            <div className="flex items-center gap-2">
                <span className="text-sm font-semibold" style={{ color: `${currentTheme.foreground}70` }}>
                    {total > 0 ? `${formatCount(total)} reaction${total !== 1 ? 's' : ''}` : 'Be the first to react!'}
                </span>
            </div>

            {/* Reaction buttons */}
            <div className="flex items-end justify-center gap-3 flex-wrap">
                {REACTIONS.map(({ type, label, emoji }) => {
                    const count   = counts[type] || 0;
                    const active  = userReaction === type;
                    const hasPng  = !imgErrors[type];

                    return (
                        <button
                            key={type}
                            onClick={() => handleReaction(type)}
                            disabled={submitting}
                            className="flex flex-col items-center gap-1.5 disabled:opacity-60"
                            style={{ outline: 'none' }}
                        >
                            {/* Image / Emoji container */}
                            <div
                                className="relative flex items-center justify-center"
                                style={{ width: imgSize, height: imgSize }}
                            >
                                {hasPng ? (
                                    <img
                                        src={reactionImages[type]}
                                        alt={label}
                                        style={{
                                            width: imgSize * 0.85,
                                            height: imgSize * 0.85,
                                            transition: 'transform 0.2s, filter 0.2s',
                                            transform: active ? 'scale(1.2)' : 'scale(1)',
                                            // Stroke follows the image art shape via drop-shadow
                                            filter: active
                                                ? `drop-shadow(0 0 3px ${SHINY_PURPLE}) drop-shadow(0 0 2px ${SHINY_PURPLE})`
                                                : 'none',
                                        }}
                                        className="object-contain select-none"
                                        onError={() => setImgErrors(prev => ({ ...prev, [type]: true }))}
                                        draggable={false}
                                    />
                                ) : (
                                    <span
                                        style={{
                                            fontSize: imgSize * 0.58,
                                            lineHeight: 1,
                                            userSelect: 'none',
                                            transition: 'transform 0.2s, filter 0.2s',
                                            transform: active ? 'scale(1.2)' : 'scale(1)',
                                            display: 'inline-block',
                                            filter: active
                                                ? `drop-shadow(0 0 3px ${SHINY_PURPLE}) drop-shadow(0 0 2px ${SHINY_PURPLE})`
                                                : 'none',
                                        }}
                                        role="img"
                                        aria-label={label}
                                    >
                                        {emoji}
                                    </span>
                                )}

                                {/* Count badge */}
                                {count > 0 && (
                                    <div
                                        className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full text-[10px] font-bold px-1 leading-none"
                                        style={{
                                            backgroundColor: active ? SHINY_PURPLE : currentTheme.foreground,
                                            color: active ? '#fff' : currentTheme.background,
                                        }}
                                    >
                                        {formatCount(count)}
                                    </div>
                                )}
                            </div>

                            {/* Label */}
                            <span
                                className="text-[11px] font-semibold transition-colors duration-200"
                                style={{ color: active ? SHINY_PURPLE : `${currentTheme.foreground}55` }}
                            >
                                {label}
                            </span>
                        </button>
                    );
                })}
            </div>

           
        </div>
    );
}
