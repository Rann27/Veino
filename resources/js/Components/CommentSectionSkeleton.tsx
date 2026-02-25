import React from 'react';
import { useTheme } from '@/Contexts/ThemeContext';

// Matches the exact visual structure of CommentSection for a seamless transition
export default function CommentSectionSkeleton() {
    const { currentTheme } = useTheme();
    const fg = currentTheme.foreground;
    const bg = currentTheme.background;
    const shimmer = `${fg}08`;
    const line = `${fg}10`;

    const Bone = ({ w = '100%', h = 12, rounded = 6, className = '' }: { w?: string | number; h?: number; rounded?: number; className?: string }) => (
        <div
            className={`animate-pulse ${className}`}
            style={{
                width: w,
                height: h,
                borderRadius: rounded,
                backgroundColor: line,
                flexShrink: 0,
            }}
        />
    );

    const CommentBone = ({ avatarSize = 36, lineCount = 2 }: { avatarSize?: number; lineCount?: number }) => (
        <div className="flex gap-3">
            {/* Avatar */}
            <Bone w={avatarSize} h={avatarSize} rounded={avatarSize / 2} />
            <div className="flex-1 space-y-2 pt-1">
                {/* Name + date row */}
                <div className="flex items-center gap-2">
                    <Bone w={80} h={10} />
                    <Bone w={48} h={8} />
                </div>
                {/* Content lines */}
                {Array.from({ length: lineCount }).map((_, i) => (
                    <Bone key={i} w={i === lineCount - 1 ? '65%' : '100%'} h={10} />
                ))}
                {/* Action row */}
                <div className="flex gap-4 pt-1">
                    <Bone w={40} h={8} />
                    <Bone w={32} h={8} />
                </div>
            </div>
        </div>
    );

    return (
        <div
            className="rounded-lg border p-6"
            style={{ backgroundColor: bg, borderColor: `${fg}20` }}
        >
            {/* Header row: "Comments (—)" + sort dropdown skeleton */}
            <div className="flex items-center justify-between mb-6">
                <Bone w={140} h={22} rounded={6} />
                <Bone w={120} h={32} rounded={8} />
            </div>

            {/* Comment input area skeleton */}
            <div className="mb-6">
                <div
                    className="w-full rounded-lg border animate-pulse"
                    style={{ height: 96, backgroundColor: shimmer, borderColor: `${fg}20` }}
                />
                <div className="flex justify-end mt-2">
                    <Bone w={120} h={36} rounded={8} />
                </div>
            </div>

            {/* Comment rows */}
            <div className="space-y-6">
                <CommentBone lineCount={2} />
                <div style={{ height: 1, backgroundColor: line }} />
                <CommentBone lineCount={3} />
                <div style={{ height: 1, backgroundColor: line }} />
                <CommentBone lineCount={1} />
            </div>
        </div>
    );
}
