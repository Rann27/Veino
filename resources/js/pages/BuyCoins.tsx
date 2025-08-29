import { Head, Link } from '@inertiajs/react';
import UserLayout from '@/Layouts/UserLayout';

interface CoinPackage {
    id: number;
    coins: number;
    price: number;
    bonus: number;
    is_popular: boolean;
}

interface Props {
    coinPackages: CoinPackage[];
}

export default function BuyCoins({ coinPackages }: Props) {
    return (
        <UserLayout>
            <Head title="Buy Coins" />
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 pt-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="text-center mb-8">
                        <h1 className="text-4xl font-bold text-white mb-4">Buy Coins</h1>
                        <p className="text-xl text-gray-300">Purchase coins to unlock premium chapters</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {coinPackages && coinPackages.map((pkg) => (
                            <div 
                                key={pkg.id} 
                                className={`bg-black/30 backdrop-blur-md rounded-xl p-6 border ${
                                    pkg.is_popular 
                                        ? 'border-yellow-400 ring-2 ring-yellow-400/50' 
                                        : 'border-white/10'
                                } relative`}
                            >
                                {pkg.is_popular && (
                                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                                        <span className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black px-4 py-1 rounded-full text-sm font-bold">
                                            MOST POPULAR
                                        </span>
                                    </div>
                                )}
                                
                                <div className="text-center">
                                    <div className="text-4xl mb-2">💰</div>
                                    <h3 className="text-2xl font-bold text-white mb-2">
                                        {pkg.coins.toLocaleString()} Coins
                                    </h3>
                                    {pkg.bonus > 0 && (
                                        <p className="text-green-400 text-sm mb-2">
                                            +{pkg.bonus} Bonus Coins
                                        </p>
                                    )}
                                    <div className="text-3xl font-bold text-blue-400 mb-4">
                                        ${pkg.price}
                                    </div>
                                    <button className={`w-full py-3 rounded-lg font-semibold transition-all ${
                                        pkg.is_popular
                                            ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-black hover:from-yellow-500 hover:to-orange-600'
                                            : 'bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700'
                                    }`}>
                                        Purchase
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-12 bg-black/30 backdrop-blur-md rounded-xl p-6 border border-white/10">
                        <h2 className="text-2xl font-bold text-white mb-4">How It Works</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="text-center">
                                <div className="text-4xl mb-2">1️⃣</div>
                                <h3 className="text-lg font-semibold text-white mb-2">Choose Package</h3>
                                <p className="text-gray-400">Select the coin package that suits your needs</p>
                            </div>
                            <div className="text-center">
                                <div className="text-4xl mb-2">2️⃣</div>
                                <h3 className="text-lg font-semibold text-white mb-2">Secure Payment</h3>
                                <p className="text-gray-400">Pay securely using PayPal or credit card</p>
                            </div>
                            <div className="text-center">
                                <div className="text-4xl mb-2">3️⃣</div>
                                <h3 className="text-lg font-semibold text-white mb-2">Unlock Content</h3>
                                <p className="text-gray-400">Use coins to unlock premium chapters instantly</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </UserLayout>
    );
}
