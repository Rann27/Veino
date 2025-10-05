import React, { useState, useEffect } from 'react';
import { useTheme } from '@/Contexts/ThemeContext';
import { router } from '@inertiajs/react';

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

const reactionImages = {
    like: '/images/reaction/like.png',
    love: '/images/reaction/love.png',
    haha: '/images/reaction/haha.png',
    angry: '/images/reaction/angry.png',
    sad: '/images/reaction/sad.png',
};

const reactionLabels = {
    like: 'Like',
    love: 'Love',
    haha: 'Haha',
    angry: 'Angry',
    sad: 'Sad',
};

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
    const [reactionCounts, setReactionCounts] = useState<ReactionCounts>(initialCounts);
    const [userReaction, setUserReaction] = useState<string | null>(initialUserReaction);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const sizes = {
        small: { image: 24, text: 'text-xs' },
        medium: { image: 32, text: 'text-sm' },
        large: { image: 48, text: 'text-base' },
    };

    const currentSize = sizes[size];

    // Load initial reaction data from backend
    useEffect(() => {
        loadReactions();
    }, [reactableType, reactableId]);

    const loadReactions = async () => {
        try {
            const response = await fetch(
                route('reactions.index', { type: reactableType, id: reactableId })
            );
            
            if (response.ok) {
                const data = await response.json();
                setReactionCounts(data.reaction_counts || {});
                setUserReaction(data.user_reaction || null);
            }
        } catch (error) {
            console.error('Error loading reactions:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleReaction = async (type: string) => {
        if (!isAuthenticated) {
            router.visit(route('login'));
            return;
        }

        if (isSubmitting) return;

        setIsSubmitting(true);

        try {
            const response = await fetch(route('reactions.toggle'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({
                    reactable_type: reactableType,
                    reactable_id: reactableId,
                    type: type,
                }),
            });

            if (response.ok) {
                const data = await response.json();
                setReactionCounts(data.reaction_counts || {});
                setUserReaction(data.user_reaction || null);
                
                if (onReactionUpdate) {
                    onReactionUpdate(data.reaction_counts || {}, data.user_reaction || null);
                }
            }
        } catch (error) {
            console.error('Error toggling reaction:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Calculate total reactions
    const totalReactions = Object.values(reactionCounts).reduce((sum, count) => sum + (count || 0), 0);

    // Image sizes based on size prop
    const imageSizes = {
        small: 32,
        medium: 48,
        large: 56,
    };

    const imageSize = imageSizes[size];

    if (isLoading) {
        return (
            <div className="flex justify-center py-4">
                <div 
                    className="animate-spin rounded-full h-8 w-8 border-b-2"
                    style={{ borderColor: currentTheme.foreground }}
                />
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center gap-6">
            {/* Total Reactions Count */}
            <div 
                className="text-lg font-semibold"
                style={{ color: currentTheme.foreground }}
            >
                {totalReactions.toLocaleString()} Reactions
            </div>

            {/* Reaction Buttons */}
            <div className="flex items-center justify-center gap-6 flex-wrap">
                {Object.entries(reactionImages).map(([type, image]) => {
                    const count = reactionCounts[type as keyof ReactionCounts] || 0;
                    const isActive = userReaction === type;
                    
                    return (
                        <button
                            key={type}
                            onClick={() => handleReaction(type)}
                            disabled={isSubmitting}
                            className={`flex flex-col items-center gap-2 transition-all ${
                                isSubmitting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-110'
                            } ${isActive ? 'scale-110' : ''}`}
                        >
                            {/* Reaction Image with Badge */}
                            <div className="relative">
                                <img 
                                    src={image} 
                                    alt={type}
                                    className="transition-transform"
                                    style={{ 
                                        width: imageSize, 
                                        height: imageSize,
                                        filter: isActive ? 'drop-shadow(0 0 8px rgba(59, 130, 246, 0.6))' : 'none',
                                    }}
                                />

                                {/* Count Badge - Always visible if count > 0 */}
                                {count > 0 && (
                                    <div 
                                        className="absolute -top-1 -right-1 min-w-[20px] h-5 flex items-center justify-center rounded-full text-[11px] font-bold px-1.5"
                                        style={{
                                            backgroundColor: '#3b82f6',
                                            color: '#ffffff',
                                            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                                        }}
                                    >
                                        {count > 999 ? `${(count / 1000).toFixed(1)}k` : count}
                                    </div>
                                )}
                            </div>

                            {/* Reaction Label */}
                            <span 
                                className={`text-xs font-medium ${currentSize.text}`}
                                style={{ 
                                    color: isActive ? '#3b82f6' : `${currentTheme.foreground}80`,
                                }}
                            >
                                {reactionLabels[type as keyof typeof reactionLabels]}
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
