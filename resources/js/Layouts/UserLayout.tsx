import React, { useState, useEffect } from 'react';
import { Head, Link, usePage } from '@inertiajs/react';

interface User {
  id: number;
  display_name: string;
  email: string;
  coin_balance: number;
  avatar?: string;
}

interface PageProps {
  auth?: {
    user?: User;
  };
  title?: string;
  [key: string]: any;
}

interface UserLayoutProps {
  children: React.ReactNode;
  title?: string;
}

export default function UserLayout({ children, title }: UserLayoutProps) {
  const { auth } = usePage<PageProps>().props;
  const [showSearch, setShowSearch] = useState(false);
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const toggleSearch = () => {
    setShowSearch(!showSearch);
  };

  const toggleAccountMenu = () => {
    setShowAccountMenu(!showAccountMenu);
  };

  // Helper function to get user initials
  const getUserInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="min-h-screen bg-white">
      {title && <Head title={title} />}
      
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-[20px] bg-white/80 border-b border-gray-200/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex-shrink-0">
              <Link href="/" className="text-2xl font-semibold text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>
                VEINOVEL
              </Link>
            </div>

            {/* Navigation Links */}
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-8">
                <Link href="/" className="text-gray-700 hover:text-gray-900 px-3 py-2 text-sm font-medium">
                  Home
                </Link>
                <Link href="/series" className="text-gray-700 hover:text-gray-900 px-3 py-2 text-sm font-medium">
                  Explore
                </Link>
                <Link href="/shop" className="text-gray-700 hover:text-gray-900 px-3 py-2 text-sm font-medium">
                  Buy Coins
                </Link>
                <a href="#" className="text-gray-700 hover:text-gray-900 px-3 py-2 text-sm font-medium">
                  Discord
                </a>
              </div>
            </div>

            {/* Right side */}
            <div className="flex items-center space-x-4">
              {/* Search Button */}
              <button
                onClick={toggleSearch}
                className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>

              {/* User Menu or Login */}
              {auth?.user ? (
                <div className="relative">
                  <button
                    onClick={toggleAccountMenu}
                    className="flex items-center space-x-2 p-2 rounded-full hover:bg-gray-100 transition-colors"
                  >
                    {auth.user.avatar ? (
                      <img
                        src={auth.user.avatar}
                        alt={auth.user.display_name}
                        className="w-8 h-8 rounded-full object-cover"
                        onError={(e) => {
                          // Fallback to initials if image fails to load
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const parent = target.parentElement;
                          if (parent && !parent.querySelector('.avatar-initials') && auth.user) {
                            const initialsDiv = document.createElement('div');
                            initialsDiv.className = 'avatar-initials w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-medium';
                            initialsDiv.textContent = getUserInitials(auth.user.display_name);
                            parent.appendChild(initialsDiv);
                          }
                        }}
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-medium">
                        {getUserInitials(auth.user.display_name)}
                      </div>
                    )}
                    <span className="hidden md:block text-sm font-medium text-gray-700">
                      {auth.user.display_name}
                    </span>
                  </button>

                  {/* Account Dropdown */}
                  {showAccountMenu && (
                    <div className="absolute right-0 mt-2 w-48 backdrop-blur-[20px] bg-white/90 rounded-md shadow-lg border border-gray-200/20 py-1">
                      <div className="px-4 py-2 text-xs text-gray-500 border-b border-gray-200/20">
                        Coins: {auth.user.coin_balance?.toLocaleString() || '0'}
                      </div>
                      <Link href="/account/settings" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100/50">
                        Settings
                      </Link>
                      <Link href="/account/bookmarks" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100/50">
                        Bookmark
                      </Link>
                      <Link href="/account/history" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100/50">
                        History
                      </Link>
                      <div className="border-t border-gray-200/20 mt-1">
                        <Link
                          href="/logout"
                          method="post"
                          as="button"
                          className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100/50"
                        >
                          Logout
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  href="/login"
                  className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  Login
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Search Bar */}
      {showSearch && (
        <div className="fixed top-16 left-0 right-0 z-40 backdrop-blur-[20px] bg-white/80 border-b border-gray-200/20 p-4">
          <div className="max-w-7xl mx-auto">
            <div className="w-3/4 mx-auto">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search novels..."
                  className="w-full px-4 py-3 pl-10 bg-white/50 backdrop-blur-sm border border-gray-300/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent"
                  autoFocus
                />
                <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <Link
                  href={`/series?search=${encodeURIComponent(searchQuery)}`}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-blue-600 text-white px-4 py-1 rounded text-sm hover:bg-blue-700 transition-colors"
                >
                  Search
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className={`${showSearch ? 'pt-32' : 'pt-16'} transition-all duration-300`}>
        {children}
      </main>

      {/* Footer */}
      <footer className="backdrop-blur-[20px] bg-white/80 border-t border-gray-200/20 py-8 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center text-gray-600">
            <p style={{ fontFamily: 'Poppins, sans-serif' }}>
              Veinovel © 2025
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
