import React from 'react';
import { Head } from '@inertiajs/react';
import UserLayout from '@/Layouts/UserLayout';
import { useTheme } from '@/Contexts/ThemeContext';

interface Blog {
    id: number;
    title: string;
    content: string;
    created_at: string;
}

interface Props {
    blog: Blog;
}

function BlogShowContent({ blog }: Props) {
    const { currentTheme } = useTheme();

    return (
        <>
            <Head title={blog.title} />

            <div className="min-h-screen py-8">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Back Button */}
                    <div className="mb-6">
                        <button
                            onClick={() => window.history.back()}
                            className="inline-flex items-center text-sm font-medium transition-colors hover:opacity-70"
                            style={{ color: `${currentTheme.foreground}80` }}
                        >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            Back
                        </button>
                    </div>

                    {/* Blog Content */}
                    <article
                        className="rounded-lg shadow-lg p-8"
                        style={{
                            backgroundColor: currentTheme.background,
                            borderColor: `${currentTheme.foreground}20`,
                        }}
                    >
                        {/* Announcement Badge */}
                        <div className="flex items-center mb-4">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
                                </svg>
                                Announcement
                            </span>
                        </div>

                        {/* Title */}
                        <h1
                            className="text-3xl font-bold mb-4"
                            style={{
                                color: currentTheme.foreground,
                                fontFamily: 'Poppins, sans-serif',
                            }}
                        >
                            {blog.title}
                        </h1>

                        {/* Date */}
                        <p
                            className="text-sm mb-6"
                            style={{
                                color: `${currentTheme.foreground}60`,
                                fontFamily: 'Poppins, sans-serif',
                            }}
                        >
                            {new Date(blog.created_at).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                            })}
                        </p>

                        {/* Divider */}
                        <div
                            className="border-t mb-6"
                            style={{ borderColor: `${currentTheme.foreground}20` }}
                        />

                        {/* Content */}
                        <div
                            className="prose prose-lg max-w-none"
                            style={{
                                color: currentTheme.foreground,
                                fontFamily: 'Poppins, sans-serif',
                            }}
                        >
                            <style>{`
                                .prose a {
                                    color: #a855f7;
                                    text-decoration: underline;
                                    transition: opacity 0.2s;
                                }
                                .prose a:hover {
                                    opacity: 0.7;
                                }
                            `}</style>
                            <div dangerouslySetInnerHTML={{ __html: blog.content }} />
                        </div>
                    </article>
                </div>
            </div>
        </>
    );
}

export default function BlogShow(props: Props) {
    return (
        <UserLayout>
            <BlogShowContent {...props} />
        </UserLayout>
    );
}
