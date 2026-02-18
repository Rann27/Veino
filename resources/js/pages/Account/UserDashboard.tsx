import React from 'react';
import { Head, Link } from '@inertiajs/react';
import UserLayout from '@/Layouts/UserLayout';
import { useTheme, SHINY_PURPLE } from '@/Contexts/ThemeContext';
import { PremiumDiamond } from '@/Components/PremiumDiamond';

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
    
    // Filter transactions based on active tab
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
    
    // SVG Icons
    const CoinIcon = ({ size = 20, className = '' }: { size?: number; className?: string }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
            <circle cx="12" cy="12" r="9" fill="#F59E0B" stroke="#D97706" strokeWidth="2"/>
            <circle cx="12" cy="12" r="6" fill="#FBBF24" opacity="0.5"/>
            <text x="12" y="16" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#78350F">¢</text>
        </svg>
    );
    
    const BookIcon = ({ size = 20, className = '' }: { size?: number; className?: string }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} style={{ color: className ? undefined : 'currentColor' }}>
            <path d="M4 19.5C4 18.837 4.26339 18.2011 4.73223 17.7322C5.20107 17.2634 5.83696 17 6.5 17H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M6.5 2H20V22H6.5C5.83696 22 5.20107 21.7366 4.73223 21.2678C4.26339 20.7989 4 20.163 4 19.5V4.5C4 3.83696 4.26339 3.20107 4.73223 2.73223C5.20107 2.26339 5.83696 2 6.5 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
    );
    
    const WalletIcon = ({ size = 20, className = '' }: { size?: number; className?: string }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} style={{ color: className ? undefined : 'currentColor' }}>
            <path d="M21 8V6C21 5.46957 20.7893 4.96086 20.4142 4.58579C20.0391 4.21071 19.5304 4 19 4H5C4.46957 4 3.96086 4.21071 3.58579 4.58579C3.21071 4.96086 3 5.46957 3 6V18C3 18.5304 3.21071 19.0391 3.58579 19.4142C3.96086 19.7893 4.46957 20 5 20H19C19.5304 20 20.0391 19.7893 20.4142 19.4142C20.7893 19.0391 21 18.5304 21 18V16M21 8H17C16.2044 8 15.4413 8.31607 14.8787 8.87868C14.3161 9.44129 14 10.2044 14 11C14 11.7956 14.3161 12.5587 14.8787 13.1213C15.4413 13.6839 16.2044 14 17 14H21M21 8V16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <circle cx="17" cy="11" r="1" fill="currentColor"/>
        </svg>
    );
    
    const AllIcon = ({ size = 20, className = '' }: { size?: number; className?: string }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} style={{ color: className ? undefined : 'currentColor' }}>
            <path d="M9 5H7C5.89543 5 5 5.89543 5 7V19C5 20.1046 5.89543 21 7 21H17C18.1046 21 19 20.1046 19 19V7C19 5.89543 18.1046 5 17 5H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <rect x="9" y="3" width="6" height="4" rx="1" stroke="currentColor" strokeWidth="2"/>
            <line x1="9" y1="12" x2="15" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <line x1="9" y1="16" x2="15" y2="16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
    );

    const getPaymentMethodLogo = (method: string) => {
        if (method === 'paypal') {
            return (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106zm14.146-14.42a3.35 3.35 0 0 0-.607-.541c-.013.076-.026.175-.041.254-.93 4.778-4.005 7.201-9.138 7.201h-2.19a.563.563 0 0 0-.556.479l-1.187 7.527h-.506l-.24 1.516a.56.56 0 0 0 .554.647h3.882c.46 0 .85-.334.922-.788.06-.26.76-4.852.816-5.09a.932.932 0 0 1 .923-.788h.58c3.76 0 6.705-1.528 7.565-5.946.36-1.847.174-3.388-.777-4.471z" fill="#003087"/>
                </svg>
            );
        }
        return (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" fill="currentColor"/>
                <path d="M12 6c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z" fill="currentColor"/>
            </svg>
        );
    };

    return (
        <>
            <Head title="Dashboard" />
            
            <div 
                className="min-h-screen py-8 px-4 sm:px-6 lg:px-8"
                style={{ backgroundColor: currentTheme.background }}
            >
                <div className="max-w-7xl mx-auto">
                    <h1 
                        className="text-3xl font-bold mb-6"
                        style={{ color: currentTheme.foreground }}
                    >
                        Dashboard
                    </h1>
                    
                    {/* Account Profile Section - Full Width */}
                    <div 
                        className="rounded-2xl p-6 mb-6 border"
                        style={{
                            backgroundColor: `${currentTheme.foreground}05`,
                            borderColor: `${currentTheme.foreground}15`
                        }}
                    >
                        <div className="flex items-start gap-6">
                            {/* Avatar */}
                            <div 
                                className="w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold"
                                style={{
                                    backgroundColor: SHINY_PURPLE,
                                    color: '#fff'
                                }}
                            >
                                {user.avatar_url ? (
                                    <img 
                                        src={user.avatar_url} 
                                        alt={user.display_name}
                                        className="w-full h-full rounded-full object-cover"
                                    />
                                ) : (
                                    user.display_name.charAt(0).toUpperCase()
                                )}
                            </div>
                            
                            {/* User Info */}
                            <div className="flex-1">
                                <h2 
                                    className="text-2xl font-bold mb-2"
                                    style={{ color: currentTheme.foreground }}
                                >
                                    {user.display_name}
                                </h2>
                                <p 
                                    className="text-sm mb-3"
                                    style={{ color: `${currentTheme.foreground}70` }}
                                >
                                    {user.email}
                                </p>
                                
                                {user.bio && (
                                    <p 
                                        className="text-sm mb-4"
                                        style={{ color: `${currentTheme.foreground}80` }}
                                    >
                                        {user.bio}
                                    </p>
                                )}
                                
                                {/* Coin Balance - Above Membership */}
                                <div className="mb-3">
                                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border"
                                        style={{
                                            backgroundColor: `${currentTheme.foreground}05`,
                                            borderColor: `${currentTheme.foreground}20`,
                                            color: currentTheme.foreground
                                        }}
                                    >
                                        <span className="font-bold text-lg">¢{coinBalance.toLocaleString()}</span>
                                        <span className="text-sm opacity-70">Coins</span>
                                    </div>
                                </div>
                                
                                {/* Membership Badge */}
                                {membershipStatus.is_premium ? (
                                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg"
                                        style={{
                                            background: `linear-gradient(135deg, ${SHINY_PURPLE} 0%, #e879f9 100%)`,
                                            color: '#fff'
                                        }}
                                    >
                                        <span className="font-bold">
                                            ⭐ Premium {membershipStatus.tier}
                                        </span>
                                        {membershipStatus.expires_at && (
                                            <span className="text-sm opacity-90">
                                                • Expires: {new Date(membershipStatus.expires_at).toLocaleDateString()}
                                            </span>
                                        )}
                                    </div>
                                ) : (
                                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg"
                                        style={{
                                            backgroundColor: `${currentTheme.foreground}10`,
                                            color: currentTheme.foreground
                                        }}
                                    >
                                        <span>Free Member</span>
                                        <Link 
                                            href="/shop?tab=membership"
                                            className="text-sm font-semibold"
                                            style={{ color: SHINY_PURPLE }}
                                        >
                                            Upgrade to Premium
                                        </Link>
                                    </div>
                                )}
                                
                                <div className="mt-4">
                                    <Link
                                        href="/account/settings"
                                        className="inline-block px-6 py-2 rounded-lg text-sm font-medium"
                                        style={{
                                            backgroundColor: `${currentTheme.foreground}10`,
                                            color: currentTheme.foreground
                                        }}
                                    >
                                        Edit Profile
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    {/* Two Column Grid for History Sections */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                        {/* Reading History Section */}
                        <div 
                            className="rounded-2xl p-6 border flex flex-col"
                            style={{
                                backgroundColor: `${currentTheme.foreground}05`,
                                borderColor: `${currentTheme.foreground}15`,
                                minHeight: '500px'
                            }}
                        >
                            <div className="flex items-center gap-2 mb-4">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 4h5v8l-2.5-1.5L6 12V4z" fill="currentColor"/>
                                </svg>
                                <h3 
                                    className="text-xl font-bold"
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
                                            className="flex gap-3 p-3 rounded-lg border transition-all hover:shadow-md"
                                            style={{
                                                backgroundColor: `${currentTheme.foreground}03`,
                                                borderColor: `${currentTheme.foreground}20`
                                            }}
                                        >
                                            {/* Series Cover */}
                                            <div 
                                                className="w-16 h-20 rounded flex-shrink-0 bg-cover bg-center"
                                                style={{
                                                    backgroundImage: item.series_cover_url 
                                                        ? `url(${item.series_cover_url})` 
                                                        : undefined,
                                                    backgroundColor: item.series_cover_url 
                                                        ? undefined 
                                                        : `${currentTheme.foreground}15`
                                                }}
                                            >
                                                {!item.series_cover_url && (
                                                    <div className="w-full h-full flex items-center justify-center">
                                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ opacity: 0.3 }}>
                                                            <path d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 4h5v8l-2.5-1.5L6 12V4z" fill="currentColor"/>
                                                        </svg>
                                                    </div>
                                                )}
                                            </div>
                                            
                                            {/* Chapter Info */}
                                            <div className="flex-1 min-w-0">
                                                <h4 
                                                    className="font-semibold text-sm mb-1 truncate"
                                                    style={{ color: currentTheme.foreground }}
                                                >
                                                    {item.series_title}
                                                </h4>
                                                <p 
                                                    className="text-xs mb-2 truncate"
                                                    style={{ color: `${currentTheme.foreground}70` }}
                                                >
                                                    Ch. {item.chapter_number}: {item.chapter_title}
                                                </p>
                                                <div className="flex items-center gap-1 text-xs" style={{ color: `${currentTheme.foreground}50` }}>
                                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                        <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" fill="currentColor"/>
                                                    </svg>
                                                    <span>{formatDate(item.last_read_at)}</span>
                                                </div>
                                            </div>
                                            
                                            {/* Continue Reading Arrow */}
                                            <div className="flex items-center">
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ color: SHINY_PURPLE }}>
                                                    <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z" fill="currentColor"/>
                                                </svg>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex-1 flex items-center justify-center">
                                    <div className="text-center">
                                        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="mx-auto mb-3" style={{ opacity: 0.3 }}>
                                            <path d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 4h5v8l-2.5-1.5L6 12V4z" fill="currentColor"/>
                                        </svg>
                                        <p 
                                            className="text-sm"
                                            style={{ color: `${currentTheme.foreground}60` }}
                                        >
                                            No reading history yet
                                        </p>
                                        <Link
                                            href="/explore"
                                            className="inline-block mt-3 px-4 py-2 rounded-lg text-sm font-medium"
                                            style={{
                                                backgroundColor: SHINY_PURPLE,
                                                color: '#fff'
                                            }}
                                        >
                                            Explore Series
                                        </Link>
                                    </div>
                                </div>
                            )}
                        </div>
                        
                        {/* Transaction History Section */}
                        <div 
                            className="rounded-2xl p-6 border flex flex-col"
                            style={{
                                backgroundColor: `${currentTheme.foreground}05`,
                                borderColor: `${currentTheme.foreground}15`,
                                minHeight: '500px'
                            }}
                        >
                            <div className="flex items-center gap-3 mb-6">
                                <div style={{ color: currentTheme.foreground }}>
                                    <WalletIcon size={24} className="flex-shrink-0" />
                                </div>
                                <h3 
                                    className="text-xl font-bold"
                                    style={{ color: currentTheme.foreground }}
                                >
                                    Transaction History
                                </h3>
                            </div>
                            
                            {/* Tabs Navigation */}
                            <div className="flex gap-2 mb-6 p-1 rounded-xl" style={{ backgroundColor: `${currentTheme.foreground}08` }}>
                                {(['all', 'coins', 'membership', 'ebooks'] as const).map((tab) => (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveTab(tab)}
                                        className="flex-1 px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
                                        style={{
                                            backgroundColor: activeTab === tab 
                                                ? `${currentTheme.foreground}15` 
                                                : 'transparent',
                                            color: activeTab === tab 
                                                ? currentTheme.foreground 
                                                : `${currentTheme.foreground}60`,
                                            boxShadow: activeTab === tab 
                                                ? `0 2px 8px ${currentTheme.foreground}15`
                                                : 'none',
                                        }}
                                    >
                                        {tab === 'all' && <AllIcon size={16} />}
                                        {tab === 'coins' && <CoinIcon size={16} />}
                                        {tab === 'membership' && <PremiumDiamond size={16} />}
                                        {tab === 'ebooks' && <BookIcon size={16} />}
                                        <span>
                                            {tab === 'all' && 'All'}
                                            {tab === 'coins' && 'Coins'}
                                            {tab === 'membership' && 'Membership'}
                                            {tab === 'ebooks' && 'Ebooks'}
                                        </span>
                                    </button>
                                ))}
                            </div>
                            
                            {filteredTransactions.length > 0 ? (
                                <div className="flex-1 overflow-y-auto space-y-3">
                                    {filteredTransactions.map((transaction) => {
                                        // Determine transaction icon
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
                                                className="flex items-center gap-3 p-4 rounded-xl border transition-all hover:shadow-lg"
                                                style={{
                                                    backgroundColor: `${currentTheme.foreground}03`,
                                                    borderColor: `${currentTheme.foreground}15`
                                                }}
                                            >
                                                {/* Icon */}
                                                <div 
                                                    className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center"
                                                    style={{
                                                        backgroundColor: `${iconColor}15`,
                                                        color: iconColor
                                                    }}
                                                >
                                                    <TransactionIcon size={20} />
                                                </div>
                                                
                                                {/* Content */}
                                                <div className="flex-1 min-w-0">
                                                    <h4 
                                                        className="font-semibold text-sm mb-1 truncate"
                                                        style={{ color: currentTheme.foreground }}
                                                    >
                                                        {transaction.type_label}
                                                    </h4>
                                                    
                                                    {transaction.description && (
                                                        <p className="text-xs mb-1 truncate" style={{ color: `${currentTheme.foreground}70` }}>
                                                            {transaction.description}
                                                        </p>
                                                    )}
                                                    
                                                    <div className="flex items-center gap-2 text-xs" style={{ color: `${currentTheme.foreground}50` }}>
                                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                                                            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                                                            <path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                                        </svg>
                                                        <span>{transaction.formatted_date}</span>
                                                        <span>•</span>
                                                        <span className="capitalize">{transaction.payment_method}</span>
                                                    </div>
                                                </div>
                                                
                                                {/* Badges Container - Fixed Width */}
                                                <div className="flex flex-col items-end gap-1.5 flex-shrink-0" style={{ minWidth: '80px' }}>
                                                    {/* Coins Received (green badge) */}
                                                    {transaction.coins_received && transaction.coins_received > 0 && (
                                                        <span 
                                                            className="px-2.5 py-0.5 rounded-md text-xs font-bold whitespace-nowrap"
                                                            style={{
                                                                backgroundColor: '#10b981',
                                                                color: '#fff'
                                                            }}
                                                        >
                                                            +¢{transaction.coins_received.toLocaleString()}
                                                        </span>
                                                    )}
                                                    
                                                    {/* Coins Spent (red badge) */}
                                                    {transaction.coins_spent && transaction.coins_spent > 0 && (
                                                        <span 
                                                            className="px-2.5 py-0.5 rounded-md text-xs font-bold whitespace-nowrap"
                                                            style={{
                                                                backgroundColor: '#ef4444',
                                                                color: '#fff'
                                                            }}
                                                        >
                                                            -¢{transaction.coins_spent.toLocaleString()}
                                                        </span>
                                                    )}
                                                    
                                                    {/* Membership Days (purple badge) */}
                                                    {transaction.type.includes('membership') && transaction.membership_days && (
                                                        <span 
                                                            className="px-2.5 py-0.5 rounded-md text-xs font-bold whitespace-nowrap flex items-center gap-1"
                                                            style={{
                                                                backgroundColor: SHINY_PURPLE,
                                                                color: '#fff'
                                                            }}
                                                        >
                                                            <PremiumDiamond size={10} />
                                                            +{transaction.membership_days}d
                                                        </span>
                                                    )}
                                                    
                                                    {/* USD Amount - Only for coin purchases */}
                                                    {transaction.type === 'coin_purchase' && transaction.amount && parseFloat(transaction.amount) > 0 && (
                                                        <span 
                                                            className="text-xs font-bold"
                                                            style={{ color: currentTheme.foreground }}
                                                        >
                                                            ${parseFloat(transaction.amount).toFixed(2)}
                                                        </span>
                                                    )}
                                                    
                                                    {/* Payment Method Logo - Only for coin purchases */}
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
                                    <div className="mb-4 opacity-30" style={{ color: currentTheme.foreground }}>
                                        {activeTab === 'all' && <WalletIcon size={80} />}
                                        {activeTab === 'coins' && <CoinIcon size={80} />}
                                        {activeTab === 'membership' && <PremiumDiamond size={80} />}
                                        {activeTab === 'ebooks' && <BookIcon size={80} />}
                                    </div>
                                    <p 
                                        className="text-sm mb-4 font-medium"
                                        style={{ color: `${currentTheme.foreground}60` }}
                                    >
                                        {activeTab === 'all' && 'No transactions yet'}
                                        {activeTab === 'coins' && 'No coin transactions yet'}
                                        {activeTab === 'membership' && 'No membership transactions yet'}
                                        {activeTab === 'ebooks' && 'No ebook purchases yet'}
                                    </p>
                                    <Link
                                        href="/shop?tab=coins"
                                        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all hover:shadow-lg"
                                        style={{
                                            backgroundColor: SHINY_PURPLE,
                                            color: '#fff'
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
