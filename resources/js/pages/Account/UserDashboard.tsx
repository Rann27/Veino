import React from 'react';
import { Head, Link } from '@inertiajs/react';
import UserLayout from '@/Layouts/UserLayout';
import { useTheme, SHINY_PURPLE } from '@/Contexts/ThemeContext';
import { PremiumDiamond } from '@/Components/PremiumDiamond';
import { SUCCESS_COLOR, WARNING_COLOR, ERROR_COLOR } from '@/constants/colors';

interface User {
    id: number;
    display_name: string;
    email: string;
    avatar_url?: string;
    bio?: string;
}

interface MembershipStatus {
    is_premium: boolean;
    tier?: string;
    expires_at?: string;
}

interface Transaction {
    id: number;
    type: string;
    type_label: string;
    description?: string;
    amount: string;
    coins_spent?: number;
    coins_received?: number;
    payment_method: string;
    status: string;
    date: string;
    formatted_date: string;
    package_name?: string;
    membership_days?: number;
    ebook_title?: string;
}

interface ReadingHistoryItem {
    series_id: number;
    series_title: string;
    series_slug: string;
    series_cover_url?: string;
    chapter_id: number;
    chapter_number: number;
    chapter_title: string;
    last_read_at: string;
}

interface Props {
    user: User;
    membershipStatus: MembershipStatus;
    coinBalance: number;
    transactions?: Transaction[];
    readingHistory?: ReadingHistoryItem[];
}

function DashboardContent({ user, membershipStatus, coinBalance, transactions = [], readingHistory = [] }: Props) {
    const { currentTheme } = useTheme();
    const [activeTab, setActiveTab] = React.useState<'all' | 'coins' | 'membership' | 'ebooks'>('all');

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const filteredTransactions = React.useMemo(() => {
        if (activeTab === 'all') return transactions;
        if (activeTab === 'coins') {
            return transactions.filter(t =>
                t.type === 'coin_purchase' || t.type === 'admin_grant'
            );
        }
        if (activeTab === 'membership') {
            return transactions.filter(t =>
                t.type === 'membership_purchase' || t.type === 'admin_membership_grant'
            );
        }
        if (activeTab === 'ebooks') {
            return transactions.filter(t =>
                t.type === 'ebook_purchase' || t.type === 'chapter_purchase'
            );
        }
        return transactions;
    }, [transactions, activeTab]);

    // ─── SVG Icon Components ───
    const CoinIcon = ({ size = 20 }: { size?: number }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="9" fill="#F59E0B" stroke="#D97706" strokeWidth="2" />
            <circle cx="12" cy="12" r="6" fill="#FBBF24" opacity="0.5" />
            <text x="12" y="16" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#78350F">¢</text>
        </svg>
    );

    const BookIcon = ({ size = 20 }: { size?: number }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 19.5C4 18.837 4.26339 18.2011 4.73223 17.7322C5.20107 17.2634 5.83696 17 6.5 17H20" />
            <path d="M6.5 2H20V22H6.5C5.83696 22 5.20107 21.7366 4.73223 21.2678C4.26339 20.7989 4 20.163 4 19.5V4.5C4 3.83696 4.26339 3.20107 4.73223 2.73223C5.20107 2.26339 5.83696 2 6.5 2Z" />
        </svg>
    );

    const WalletIcon = ({ size = 20 }: { size?: number }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 8V6C21 5.46957 20.7893 4.96086 20.4142 4.58579C20.0391 4.21071 19.5304 4 19 4H5C4.46957 4 3.96086 4.21071 3.58579 4.58579C3.21071 4.96086 3 5.46957 3 6V18C3 18.5304 3.21071 19.0391 3.58579 19.4142C3.96086 19.7893 4.46957 20 5 20H19C19.5304 20 20.0391 19.7893 20.4142 19.4142C20.7893 19.0391 21 18.5304 21 18V16M21 8H17C16.2044 8 15.4413 8.31607 14.8787 8.87868C14.3161 9.44129 14 10.2044 14 11C14 11.7956 14.3161 12.5587 14.8787 13.1213C15.4413 13.6839 16.2044 14 17 14H21M21 8V16" />
            <circle cx="17" cy="11" r="1" fill="currentColor" />
        </svg>
    );

    const AllIcon = ({ size = 20 }: { size?: number }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 5H7C5.89543 5 5 5.89543 5 7V19C5 20.1046 5.89543 21 7 21H17C18.1046 21 19 20.1046 19 19V7C19 5.89543 18.1046 5 17 5H15" />
            <rect x="9" y="3" width="6" height="4" rx="1" />
            <line x1="9" y1="12" x2="15" y2="12" />
            <line x1="9" y1="16" x2="15" y2="16" />
        </svg>
    );

    const getPaymentMethodLogo = (method: string) => {
        if (method === 'paypal') {
            return (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106zm14.146-14.42a3.35 3.35 0 0 0-.607-.541c-.013.076-.026.175-.041.254-.93 4.778-4.005 7.201-9.138 7.201h-2.19a.563.563 0 0 0-.556.479l-1.187 7.527h-.506l-.24 1.516a.56.56 0 0 0 .554.647h3.882c.46 0 .85-.334.922-.788.06-.26.76-4.852.816-5.09a.932.932 0 0 1 .923-.788h.58c3.76 0 6.705-1.528 7.565-5.946.36-1.847.174-3.388-.777-4.471z" fill="#003087" />
                </svg>
            );
        }
        return (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <circle cx="12" cy="12" r="6" />
            </svg>
        );
    };

    // Shared card style
    const cardStyle = {
        backgroundColor: `${currentTheme.foreground}05`,
        borderColor: `${currentTheme.foreground}12`,
    };

    return (
        <>
            <Head title="Dashboard" />

            <div
                className="min-h-screen py-8 px-4 sm:px-6 lg:px-8"
                style={{ backgroundColor: currentTheme.background }}
            >
                <div className="max-w-7xl mx-auto">
                    {/* Page Title */}
                    <h1
                        className="text-3xl font-bold mb-8"
                        style={{
                            color: currentTheme.foreground,
                            fontFamily: 'Poppins, sans-serif',
                        }}
                    >
                        Dashboard
                    </h1>

                    {/* ─── Profile Card ─── */}
                    <div
                        className="rounded-2xl p-6 sm:p-8 border mb-8"
                        style={cardStyle}
                    >
                        <div className="flex flex-col sm:flex-row items-start gap-6">
                            {/* Avatar */}
                            <div className="flex-shrink-0">
                                <div
                                    className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl flex items-center justify-center text-3xl font-bold overflow-hidden"
                                    style={{
                                        backgroundColor: `${currentTheme.foreground}10`,
                                        color: currentTheme.foreground,
                                        border: `2px solid ${currentTheme.foreground}15`,
                                    }}
                                >
                                    {user.avatar_url ? (
                                        <img
                                            src={user.avatar_url}
                                            alt={user.display_name}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        user.display_name.charAt(0).toUpperCase()
                                    )}
                                </div>
                            </div>

                            {/* User Info */}
                            <div className="flex-1 min-w-0">
                                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-2">
                                    <h2
                                        className="text-2xl font-bold truncate"
                                        style={{ color: currentTheme.foreground }}
                                    >
                                        {user.display_name}
                                    </h2>
                                    {/* Membership Badge inline with name */}
                                    {membershipStatus.is_premium ? (
                                        <span
                                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-sm font-semibold whitespace-nowrap"
                                            style={{
                                                background: `linear-gradient(135deg, ${SHINY_PURPLE} 0%, #c084fc 100%)`,
                                                color: '#fff',
                                            }}
                                        >
                                            <PremiumDiamond size={14} />
                                            Premium
                                        </span>
                                    ) : (
                                        <span
                                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-sm whitespace-nowrap"
                                            style={{
                                                backgroundColor: `${currentTheme.foreground}08`,
                                                color: `${currentTheme.foreground}70`,
                                            }}
                                        >
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                                <circle cx="12" cy="7" r="4" />
                                            </svg>
                                            Free Member
                                        </span>
                                    )}
                                </div>

                                <p
                                    className="text-sm mb-1"
                                    style={{ color: `${currentTheme.foreground}60` }}
                                >
                                    {user.email}
                                </p>

                                {user.bio && (
                                    <p
                                        className="text-sm mb-3"
                                        style={{ color: `${currentTheme.foreground}80` }}
                                    >
                                        {user.bio}
                                    </p>
                                )}

                                {/* Stats Row: Coins + Membership Expiry */}
                                <div className="flex flex-wrap items-center gap-3 mt-3">
                                    {/* Coin Balance */}
                                    <div
                                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border"
                                        style={{
                                            backgroundColor: '#f59e0b08',
                                            borderColor: '#f59e0b25',
                                        }}
                                    >
                                        <CoinIcon size={18} />
                                        <span
                                            className="font-bold text-lg"
                                            style={{ color: '#f59e0b' }}
                                        >
                                            ¢{coinBalance.toLocaleString()}
                                        </span>
                                    </div>

                                    {/* Membership expiry progress */}
                                    {membershipStatus.is_premium && membershipStatus.expires_at && (() => {
                                        const daysLeft = Math.max(0, Math.ceil(
                                            (new Date(membershipStatus.expires_at).getTime() - Date.now()) / 86400000
                                        ));
                                        const barPct = Math.min(100, Math.round((daysLeft / 30) * 100));
                                        const barColor = daysLeft > 14
                                            ? SUCCESS_COLOR
                                            : daysLeft > 7
                                                ? WARNING_COLOR
                                                : ERROR_COLOR;
                                        return (
                                            <div className="inline-flex items-center gap-3 px-4 py-2 rounded-xl border"
                                                style={{
                                                    backgroundColor: `${currentTheme.foreground}04`,
                                                    borderColor: `${currentTheme.foreground}12`,
                                                }}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <circle cx="12" cy="12" r="10" />
                                                        <path d="M12 6v6l4 2" />
                                                    </svg>
                                                    <span
                                                        className="text-sm font-semibold"
                                                        style={{ color: barColor }}
                                                    >
                                                        {daysLeft}d left
                                                    </span>
                                                </div>
                                                <div
                                                    className="w-20 h-1.5 rounded-full"
                                                    style={{ backgroundColor: `${currentTheme.foreground}12` }}
                                                >
                                                    <div
                                                        className="h-1.5 rounded-full transition-all duration-700"
                                                        style={{ width: `${barPct}%`, backgroundColor: barColor }}
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })()}

                                    {/* Upgrade link for free users */}
                                    {!membershipStatus.is_premium && (
                                        <Link
                                            href="/shop?tab=membership"
                                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-opacity hover:opacity-80"
                                            style={{ color: SHINY_PURPLE }}
                                        >
                                            <PremiumDiamond size={14} />
                                            Upgrade to Premium
                                        </Link>
                                    )}
                                </div>
                            </div>

                            {/* Edit Profile Button - Desktop */}
                            <div className="hidden sm:block flex-shrink-0">
                                <Link
                                    href="/account/settings"
                                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium border transition-opacity hover:opacity-80"
                                    style={{
                                        backgroundColor: `${currentTheme.foreground}08`,
                                        borderColor: `${currentTheme.foreground}15`,
                                        color: currentTheme.foreground,
                                    }}
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                    </svg>
                                    Edit Profile
                                </Link>
                            </div>
                        </div>

                        {/* Edit Profile Button - Mobile */}
                        <div className="sm:hidden mt-4">
                            <Link
                                href="/account/settings"
                                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium border transition-opacity hover:opacity-80"
                                style={{
                                    backgroundColor: `${currentTheme.foreground}08`,
                                    borderColor: `${currentTheme.foreground}15`,
                                    color: currentTheme.foreground,
                                }}
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                </svg>
                                Edit Profile
                            </Link>
                        </div>
                    </div>

                    {/* ─── Two Column Grid ─── */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Reading History */}
                        <div
                            className="rounded-2xl p-6 border flex flex-col"
                            style={{ ...cardStyle, minHeight: '480px' }}
                        >
                            <div className="flex items-center gap-2 mb-5">
                                <div style={{ color: currentTheme.foreground }}>
                                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                                        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                                    </svg>
                                </div>
                                <h3
                                    className="text-lg font-bold"
                                    style={{ color: currentTheme.foreground }}
                                >
                                    Reading History
                                </h3>
                            </div>

                            {readingHistory.length > 0 ? (
                                <div className="flex-1 overflow-y-auto space-y-3">
                                    {readingHistory.map((item) => (
                                        <Link
                                            key={item.chapter_id}
                                            href={`/series/${item.series_slug}/chapter/${item.chapter_number}`}
                                            className="flex gap-3 p-3 rounded-xl border transition-all hover:shadow-md"
                                            style={{
                                                backgroundColor: `${currentTheme.foreground}03`,
                                                borderColor: `${currentTheme.foreground}12`,
                                            }}
                                        >
                                            {/* Series Cover */}
                                            <div
                                                className="w-14 h-18 rounded-lg flex-shrink-0 bg-cover bg-center"
                                                style={{
                                                    backgroundImage: item.series_cover_url
                                                        ? `url(${item.series_cover_url})`
                                                        : undefined,
                                                    backgroundColor: item.series_cover_url
                                                        ? undefined
                                                        : `${currentTheme.foreground}10`,
                                                    aspectRatio: '2/3',
                                                }}
                                            >
                                                {!item.series_cover_url && (
                                                    <div className="w-full h-full flex items-center justify-center">
                                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ opacity: 0.25 }}>
                                                            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                                                            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                                                        </svg>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Chapter Info */}
                                            <div className="flex-1 min-w-0">
                                                <h4
                                                    className="font-semibold text-sm mb-0.5 truncate"
                                                    style={{ color: currentTheme.foreground }}
                                                >
                                                    {item.series_title}
                                                </h4>
                                                <p
                                                    className="text-xs mb-1.5 truncate"
                                                    style={{ color: `${currentTheme.foreground}65` }}
                                                >
                                                    Ch. {item.chapter_number}: {item.chapter_title}
                                                </p>
                                                <div className="flex items-center gap-1 text-xs" style={{ color: `${currentTheme.foreground}45` }}>
                                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <circle cx="12" cy="12" r="10" />
                                                        <path d="M12 6v6l4 2" />
                                                    </svg>
                                                    <span>{formatDate(item.last_read_at)}</span>
                                                </div>
                                            </div>

                                            {/* Continue Arrow */}
                                            <div className="flex items-center flex-shrink-0">
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ color: SHINY_PURPLE }}>
                                                    <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z" fill="currentColor" />
                                                </svg>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex-1 flex items-center justify-center">
                                    <div className="text-center">
                                        <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto mb-3" style={{ color: `${currentTheme.foreground}20` }}>
                                            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                                            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                                        </svg>
                                        <p
                                            className="text-sm mb-4"
                                            style={{ color: `${currentTheme.foreground}50` }}
                                        >
                                            No reading history yet
                                        </p>
                                        <Link
                                            href="/explore"
                                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-opacity hover:opacity-85"
                                            style={{
                                                backgroundColor: SHINY_PURPLE,
                                                color: '#fff',
                                            }}
                                        >
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                                                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                                            </svg>
                                            Explore Series
                                        </Link>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Transaction History */}
                        <div
                            className="rounded-2xl p-6 border flex flex-col"
                            style={{ ...cardStyle, minHeight: '480px' }}
                        >
                            <div className="flex items-center gap-2 mb-5">
                                <div style={{ color: currentTheme.foreground }}>
                                    <WalletIcon size={22} />
                                </div>
                                <h3
                                    className="text-lg font-bold"
                                    style={{ color: currentTheme.foreground }}
                                >
                                    Transaction History
                                </h3>
                            </div>

                            {/* Tab Filters */}
                            <div
                                className="flex gap-1.5 mb-5 p-1 rounded-xl"
                                style={{ backgroundColor: `${currentTheme.foreground}06` }}
                            >
                                {(['all', 'coins', 'membership', 'ebooks'] as const).map((tab) => (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveTab(tab)}
                                        className="flex-1 px-3 py-2 text-xs font-medium rounded-lg transition-all duration-200 flex items-center justify-center gap-1.5"
                                        style={{
                                            backgroundColor: activeTab === tab
                                                ? `${currentTheme.foreground}12`
                                                : 'transparent',
                                            color: activeTab === tab
                                                ? currentTheme.foreground
                                                : `${currentTheme.foreground}50`,
                                        }}
                                    >
                                        {tab === 'all' && <AllIcon size={14} />}
                                        {tab === 'coins' && <CoinIcon size={14} />}
                                        {tab === 'membership' && <PremiumDiamond size={14} />}
                                        {tab === 'ebooks' && <BookIcon size={14} />}
                                        <span className="hidden sm:inline">
                                            {tab === 'all' && 'All'}
                                            {tab === 'coins' && 'Coins'}
                                            {tab === 'membership' && 'Premium'}
                                            {tab === 'ebooks' && 'Ebooks'}
                                        </span>
                                    </button>
                                ))}
                            </div>

                            {filteredTransactions.length > 0 ? (
                                <div className="flex-1 overflow-y-auto space-y-2.5">
                                    {filteredTransactions.map((transaction) => {
                                        let TransactionIcon = AllIcon;
                                        let iconColor = currentTheme.foreground;

                                        if (transaction.type === 'coin_purchase' || transaction.type === 'admin_grant') {
                                            TransactionIcon = CoinIcon;
                                            iconColor = '#F59E0B';
                                        } else if (transaction.type.includes('membership')) {
                                            TransactionIcon = () => <PremiumDiamond size={20} />;
                                            iconColor = SHINY_PURPLE;
                                        } else if (transaction.type.includes('ebook') || transaction.type.includes('chapter')) {
                                            TransactionIcon = BookIcon;
                                            iconColor = '#8B5CF6';
                                        }

                                        return (
                                            <div
                                                key={transaction.id}
                                                className="flex items-center gap-3 p-3.5 rounded-xl border transition-all hover:shadow-md"
                                                style={{
                                                    backgroundColor: `${currentTheme.foreground}03`,
                                                    borderColor: `${currentTheme.foreground}10`,
                                                }}
                                            >
                                                {/* Icon */}
                                                <div
                                                    className="flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center"
                                                    style={{
                                                        backgroundColor: `${iconColor}12`,
                                                        color: iconColor,
                                                    }}
                                                >
                                                    <TransactionIcon size={18} />
                                                </div>

                                                {/* Content */}
                                                <div className="flex-1 min-w-0">
                                                    <h4
                                                        className="font-semibold text-sm truncate"
                                                        style={{ color: currentTheme.foreground }}
                                                    >
                                                        {transaction.type_label}
                                                    </h4>
                                                    <div className="flex items-center gap-1.5 text-xs mt-0.5" style={{ color: `${currentTheme.foreground}45` }}>
                                                        <span>{transaction.formatted_date}</span>
                                                        <span>·</span>
                                                        <span className="capitalize">{transaction.payment_method}</span>
                                                    </div>
                                                </div>

                                                {/* Badges */}
                                                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                                                    {transaction.coins_received && transaction.coins_received > 0 && (
                                                        <span
                                                            className="px-2 py-0.5 rounded-md text-xs font-bold whitespace-nowrap"
                                                            style={{
                                                                backgroundColor: '#10b981',
                                                                color: '#fff',
                                                            }}
                                                        >
                                                            +¢{transaction.coins_received.toLocaleString()}
                                                        </span>
                                                    )}
                                                    {transaction.coins_spent && transaction.coins_spent > 0 && (
                                                        <span
                                                            className="px-2 py-0.5 rounded-md text-xs font-bold whitespace-nowrap"
                                                            style={{
                                                                backgroundColor: '#ef4444',
                                                                color: '#fff',
                                                            }}
                                                        >
                                                            -¢{transaction.coins_spent.toLocaleString()}
                                                        </span>
                                                    )}
                                                    {transaction.type.includes('membership') && transaction.membership_days && (
                                                        <span
                                                            className="px-2 py-0.5 rounded-md text-xs font-bold whitespace-nowrap flex items-center gap-1"
                                                            style={{
                                                                backgroundColor: SHINY_PURPLE,
                                                                color: '#fff',
                                                            }}
                                                        >
                                                            <PremiumDiamond size={10} />
                                                            +{transaction.membership_days}d
                                                        </span>
                                                    )}
                                                    {transaction.type === 'coin_purchase' && transaction.amount && parseFloat(transaction.amount) > 0 && (
                                                        <span
                                                            className="text-xs font-bold"
                                                            style={{ color: currentTheme.foreground }}
                                                        >
                                                            ${parseFloat(transaction.amount).toFixed(2)}
                                                        </span>
                                                    )}
                                                    {transaction.type === 'coin_purchase' && (
                                                        <div className="flex items-center justify-end">
                                                            {getPaymentMethodLogo(transaction.payment_method)}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="flex-1 flex flex-col items-center justify-center py-12">
                                    <div className="mb-4" style={{ color: `${currentTheme.foreground}15` }}>
                                        {activeTab === 'all' && <WalletIcon size={64} />}
                                        {activeTab === 'coins' && <CoinIcon size={64} />}
                                        {activeTab === 'membership' && <PremiumDiamond size={64} />}
                                        {activeTab === 'ebooks' && <BookIcon size={64} />}
                                    </div>
                                    <p
                                        className="text-sm mb-4"
                                        style={{ color: `${currentTheme.foreground}50` }}
                                    >
                                        {activeTab === 'all' && 'No transactions yet'}
                                        {activeTab === 'coins' && 'No coin transactions yet'}
                                        {activeTab === 'membership' && 'No membership transactions yet'}
                                        {activeTab === 'ebooks' && 'No ebook purchases yet'}
                                    </p>
                                    <Link
                                        href="/shop?tab=coins"
                                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-opacity hover:opacity-85"
                                        style={{
                                            backgroundColor: SHINY_PURPLE,
                                            color: '#fff',
                                        }}
                                    >
                                        {activeTab === 'membership' ? (
                                            <>
                                                <PremiumDiamond size={16} />
                                                Get Premium
                                            </>
                                        ) : (
                                            <>
                                                <CoinIcon size={16} />
                                                Buy Coins
                                            </>
                                        )}
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

export default function UserDashboard(props: Props) {
    return (
        <UserLayout>
            <DashboardContent {...props} />
        </UserLayout>
    );
}