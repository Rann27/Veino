import { Head, Link } from '@inertiajs/react';
import UserLayout from '@/Layouts/UserLayout';

interface ReadingHistoryItem {
    id: number;
    series_title: string;
    series_slug: string;
    chapter_number: number;
    chapter_title: string;
    read_at: string;
    progress: number;
}

interface Props {
    readingHistory: ReadingHistoryItem[];
}

export default function History({ readingHistory }: Props) {
    return (
        <UserLayout>
            <Head title="Reading History" />
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 pt-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="bg-black/30 backdrop-blur-md rounded-xl p-6 border border-white/10">
                        <h1 className="text-3xl font-bold text-white mb-6">Reading History</h1>
                        
                        {readingHistory.length === 0 ? (
                            <div className="text-center py-12">
                                <div className="text-6xl mb-4">📚</div>
                                <h3 className="text-xl font-semibold text-white mb-2">No Reading History Yet</h3>
                                <p className="text-gray-400 mb-6">Start reading some series to see your history here</p>
                                <Link
                                    href="/explore"
                                    className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-600 hover:to-purple-700 transition-all"
                                >
                                    Explore Series
                                </Link>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {readingHistory.map((item) => (
                                    <div key={item.id} className="bg-white/5 rounded-lg p-4 border border-white/10">
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1">
                                                <h3 className="text-lg font-semibold text-white mb-1">
                                                    {item.series_title}
                                                </h3>
                                                <p className="text-gray-300 mb-2">
                                                    Chapter {item.chapter_number}: {item.chapter_title}
                                                </p>
                                                <div className="flex items-center space-x-4 text-sm text-gray-400">
                                                    <span>Read on {new Date(item.read_at).toLocaleDateString()}</span>
                                                    <span>Progress: {item.progress}%</span>
                                                </div>
                                            </div>
                                            <div className="flex space-x-3">
                                                <Link
                                                    href={`/series/${item.series_slug}/chapter/${item.chapter_number}`}
                                                    className="bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors"
                                                >
                                                    Continue Reading
                                                </Link>
                                                <Link
                                                    href={`/series/${item.series_slug}`}
                                                    className="bg-gray-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-700 transition-colors"
                                                >
                                                    View Series
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </UserLayout>
    );
}
