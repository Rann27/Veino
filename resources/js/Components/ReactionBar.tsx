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

    const sizes = {
        small: { image: 20, padding: 'px-2 py-1', text: 'text-xs' },
        medium: { image: 24, padding: 'px-3 py-1.5', text: 'text-sm' },
        large: { image: 28, padding: 'px-4 py-2', text: 'text-base' },
    };

    const currentSize = sizes[size];

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

    return (
        <div className="flex items-center gap-2 flex-wrap">
            {Object.entries(reactionImages).map(([type, image]) => {
                const count = reactionCounts[type as keyof ReactionCounts] || 0;
                const isActive = userReaction === type;
                
                return (
                    <button
                        key={type}
                        onClick={() => handleReaction(type)}
                        disabled={isSubmitting}
                        className={`flex items-center gap-1.5 rounded-full border transition-all ${currentSize.padding} ${currentSize.text} ${
                            isActive 
                                ? 'border-opacity-50 shadow-md' 
                                : 'border-opacity-20 hover:border-opacity-40 hover:shadow-sm'
                        } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                        style={{
                            borderColor: isActive ? '#3b82f6' : `${currentTheme.foreground}30`,
                            backgroundColor: isActive ? '#eff6ff' : currentTheme.background,
                            color: isActive ? '#3b82f6' : currentTheme.foreground,
                        }}
                        title={reactionLabels[type as keyof typeof reactionLabels]}
                    >
                        <img 
                            src={image} 
                            alt={type}
                            className={`${isActive ? 'scale-110' : ''} transition-transform`}
                            style={{ 
                                width: currentSize.image, 
                                height: currentSize.image,
                                filter: isActive ? 'brightness(1.1)' : 'none',
                            }}
                        />
                        {count > 0 && (
                            <span className="font-medium">
                                {count > 999 ? `${(count / 1000).toFixed(1)}k` : count}
                            </span>
                        )}
                    </button>
                );
            })}
            
            {totalReactions > 0 && (
                <span 
                    className={`ml-2 ${currentSize.text} font-medium`}
                    style={{ color: `${currentTheme.foreground}60` }}
                >
                    {totalReactions} {totalReactions === 1 ? 'reaction' : 'reactions'}
                </span>
            )}
        </div>
    );
}
