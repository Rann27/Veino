import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import UserLayout from '@/Layouts/UserLayout';

interface CoinPackage {
    id: number;
    name: string;
    coins: number;
    price: number;
    bonus_coins: number;
    is_popular: boolean;
    description?: string;
}

interface Transaction {
    id: number;
    type: 'purchase' | 'spent' | 'bonus';
    amount: number;
    description: string;
    created_at: string;
    status: 'completed' | 'pending' | 'failed';
}

interface Props {
    coinPackages: CoinPackage[];
    transactions: Transaction[];
    user: {
        coin_balance: number;
    };
}

export default function Coins({ coinPackages, transactions, user }: Props) {
    const [selectedPackage, setSelectedPackage] = useState<CoinPackage | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [showTransactions, setShowTransactions] = useState(false);

    const handlePurchase = (coinPackage: CoinPackage) => {
        setSelectedPackage(coinPackage);
        setIsProcessing(true);
        
        // In real implementation, integrate with PayPal or other payment gateway
        router.post('/purchase-coins', {
            package_id: coinPackage.id,
        }, {
            onSuccess: () => {
                setIsProcessing(false);
                setSelectedPackage(null);
            },
            onError: () => {
                setIsProcessing(false);
            }
        });
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getTransactionIcon = (type: string) => {
        switch (type) {
            case 'purchase':
                return (
                    <div className="p-2 bg-green-100 rounded-full">
                        <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                    </div>
                );
            case 'spent':
                return (
                    <div className="p-2 bg-red-100 rounded-full">
                        <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                        </svg>
                    </div>
                );
            case 'bonus':
                return (
                    <div className="p-2 bg-yellow-100 rounded-full">
                        <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                        </svg>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <UserLayout>
            <Head title="Coin Shop - Veinovel" />
            
            <div className="min-h-screen bg-gray-50 pt-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">Coin Shop</h1>
                        <p className="text-gray-600">Purchase coins to unlock premium content</p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Main Content */}
                        <div className="lg:col-span-2 space-y-8">
                            {/* Current Balance */}
                            <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-lg shadow-sm p-6 text-white">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h2 className="text-lg font-semibold mb-1">Your Coin Balance</h2>
                                        <p className="text-3xl font-bold">{user.coin_balance}</p>
                                        <p className="text-yellow-100 text-sm">Available coins</p>
                                    </div>
                                    <div>
                                        <svg className="w-16 h-16 text-yellow-200" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            {/* Coin Packages */}
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 mb-6">Choose a Coin Package</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {coinPackages.map((pkg) => (
                                        <div 
                                            key={pkg.id}
                                            className={`relative bg-white rounded-lg shadow-sm border-2 p-6 hover:shadow-md transition-shadow ${
                                                pkg.is_popular ? 'border-blue-500 ring-2 ring-blue-100' : 'border-gray-200'
                                            }`}
                                        >
                                            {pkg.is_popular && (
                                                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                                                    <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                                                        Most Popular
                                                    </span>
                                                </div>
                                            )}
                                            
                                            <div className="text-center">
                                                <h3 className="text-xl font-bold text-gray-900 mb-2">{pkg.name}</h3>
                                                
                                                <div className="mb-4">
                                                    <div className="text-3xl font-bold text-yellow-600 mb-1">
                                                        {pkg.coins.toLocaleString()}
                                                    </div>
                                                    {pkg.bonus_coins > 0 && (
                                                        <div className="text-green-600 font-medium">
                                                            +{pkg.bonus_coins} bonus coins
                                                        </div>
                                                    )}
                                                    <div className="text-gray-600">coins</div>
                                                </div>
                                                
                                                <div className="text-2xl font-bold text-gray-900 mb-4">
                                                    ${pkg.price}
                                                </div>
                                                
                                                {pkg.description && (
                                                    <p className="text-sm text-gray-600 mb-4">{pkg.description}</p>
                                                )}
                                                
                                                <button
                                                    onClick={() => handlePurchase(pkg)}
                                                    disabled={isProcessing}
                                                    className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                                                        pkg.is_popular
                                                            ? 'bg-blue-600 text-white hover:bg-blue-700'
                                                            : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                                                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                                                >
                                                    {isProcessing && selectedPackage?.id === pkg.id ? (
                                                        <div className="flex items-center justify-center">
                                                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5" fill="none" viewBox="0 0 24 24">
                                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                            </svg>
                                                            Processing...
                                                        </div>
                                                    ) : (
                                                        'Purchase Now'
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Payment Methods */}
                            <div className="bg-white rounded-lg shadow-sm border p-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Secure Payment Methods</h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="flex items-center justify-center p-4 border border-gray-200 rounded-lg">
                                        <img src="/images/paypal.png" alt="PayPal" className="h-8" />
                                    </div>
                                    <div className="flex items-center justify-center p-4 border border-gray-200 rounded-lg">
                                        <img src="/images/visa.png" alt="Visa" className="h-8" />
                                    </div>
                                    <div className="flex items-center justify-center p-4 border border-gray-200 rounded-lg">
                                        <img src="/images/mastercard.png" alt="Mastercard" className="h-8" />
                                    </div>
                                    <div className="flex items-center justify-center p-4 border border-gray-200 rounded-lg">
                                        <img src="/images/stripe.png" alt="Stripe" className="h-8" />
                                    </div>
                                </div>
                                <p className="text-sm text-gray-600 mt-4 text-center">
                                    All transactions are secured with 256-bit SSL encryption
                                </p>
                            </div>
                        </div>

                        {/* Sidebar */}
                        <div className="space-y-6">
                            {/* Transaction History Toggle */}
                            <div className="bg-white rounded-lg shadow-sm border p-6">
                                <button
                                    onClick={() => setShowTransactions(!showTransactions)}
                                    className="w-full flex items-center justify-between text-left"
                                >
                                    <h3 className="text-lg font-semibold text-gray-900">Transaction History</h3>
                                    <svg 
                                        className={`w-5 h-5 text-gray-400 transition-transform ${showTransactions ? 'rotate-180' : ''}`}
                                        fill="none" 
                                        stroke="currentColor" 
                                        viewBox="0 0 24 24"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>
                                
                                {showTransactions && (
                                    <div className="mt-4 space-y-3 max-h-96 overflow-y-auto">
                                        {transactions.length > 0 ? (
                                            transactions.slice(0, 10).map((transaction) => (
                                                <div key={transaction.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                                    {getTransactionIcon(transaction.type)}
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium text-gray-900 truncate">
                                                            {transaction.description}
                                                        </p>
                                                        <p className="text-xs text-gray-500">
                                                            {formatDate(transaction.created_at)}
                                                        </p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className={`text-sm font-medium ${
                                                            transaction.type === 'spent' ? 'text-red-600' : 'text-green-600'
                                                        }`}>
                                                            {transaction.type === 'spent' ? '-' : '+'}{transaction.amount}
                                                        </p>
                                                        <p className={`text-xs ${
                                                            transaction.status === 'completed' ? 'text-green-600' :
                                                            transaction.status === 'pending' ? 'text-yellow-600' : 'text-red-600'
                                                        }`}>
                                                            {transaction.status}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-sm text-gray-500 text-center py-4">
                                                No transactions yet
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* How It Works */}
                            <div className="bg-white rounded-lg shadow-sm border p-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">How It Works</h3>
                                <div className="space-y-3">
                                    <div className="flex items-start gap-3">
                                        <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold">
                                            1
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">Choose a package</p>
                                            <p className="text-xs text-gray-600">Select the coin package that fits your needs</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold">
                                            2
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">Secure payment</p>
                                            <p className="text-xs text-gray-600">Pay safely with your preferred method</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold">
                                            3
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">Instant coins</p>
                                            <p className="text-xs text-gray-600">Coins are added to your account immediately</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Support */}
                            <div className="bg-blue-50 rounded-lg border border-blue-200 p-6">
                                <h3 className="text-lg font-semibold text-blue-900 mb-2">Need Help?</h3>
                                <p className="text-sm text-blue-800 mb-4">
                                    Having trouble with your purchase? Our support team is here to help!
                                </p>
                                <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm">
                                    Contact Support
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </UserLayout>
    );
}
