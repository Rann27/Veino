import React, { useState, useEffect, useRef } from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import { ThemeProvider, useTheme } from '@/Contexts/ThemeContext';
import ThemeSelectorModal from '@/Components/ThemeSelectorModal';

interface User {
  id: number;
  display_name: string;
  email: string;
  coins: number; // Changed from coin_balance to coins
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

function UserLayoutContent({ children, title }: UserLayoutProps) {
  const { auth } = usePage<PageProps>().props;
  const { currentTheme } = useTheme();
  const [showSearch, setShowSearch] = useState(false);
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Auto-hide/show navbar on scroll
  const [showNavbar, setShowNavbar] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const scrollTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-hide navbar effect
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY < 10) {
        // Always show navbar at the top
        setShowNavbar(true);
      } else if (currentScrollY > lastScrollY && currentScrollY > 80) {
        // Scrolling down & past 80px - hide navbar
        setShowNavbar(false);
        setShowAccountMenu(false); // Close account menu if open
        setShowSearch(false); // Close search if open
      } else if (currentScrollY < lastScrollY) {
        // Scrolling up - show navbar
        setShowNavbar(true);
      }
      
      setLastScrollY(currentScrollY);
    };

    const throttledHandleScroll = () => {
      if (scrollTimerRef.current) {
        clearTimeout(scrollTimerRef.current);
      }
      scrollTimerRef.current = setTimeout(handleScroll, 10);
    };

    window.addEventListener('scroll', throttledHandleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', throttledHandleScroll);
      if (scrollTimerRef.current) {
        clearTimeout(scrollTimerRef.current);
      }
    };
  }, [lastScrollY]);

  // Children should use useTheme hook instead of receiving currentTheme as prop

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
    <div 
      className="min-h-screen"
      style={{ 
        backgroundColor: currentTheme.background,
        color: currentTheme.foreground 
      }}
    >
      {title && <Head title={title} />}
      
      {/* Navbar */}
      <nav 
        className={`fixed top-0 left-0 right-0 z-50 backdrop-blur-[50px] border-b transition-all duration-300 ${
          showNavbar ? 'translate-y-0' : '-translate-y-full'
        }`}
        style={{ 
          backgroundColor: `${currentTheme.background}80`,
          borderColor: `${currentTheme.foreground}20`
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex-shrink-0">
              <Link 
                href="/" 
                className="text-2xl font-semibold" 
                style={{ 
                  fontFamily: 'Poppins, sans-serif',
                  color: currentTheme.foreground
                }}
              >
                VEINOVEL
              </Link>
            </div>

            {/* Navigation Links */}
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-8">
                <Link 
                  href="/" 
                  className="px-3 py-2 text-sm font-medium transition-colors hover:opacity-70"
                  style={{ color: currentTheme.foreground }}
                >
                  Home
                </Link>
                <Link 
                  href="/explore" 
                  className="px-3 py-2 text-sm font-medium transition-colors hover:opacity-70"
                  style={{ color: currentTheme.foreground }}
                >
                  Explore
                </Link>
                <Link 
                  href="/buy-coins" 
                  className="px-3 py-2 text-sm font-medium transition-colors hover:opacity-70"
                  style={{ color: currentTheme.foreground }}
                >
                  Buy Coins
                </Link>
                <Link 
                  href="/discord" 
                  className="px-3 py-2 text-sm font-medium transition-colors hover:opacity-70"
                  style={{ color: currentTheme.foreground }}
                >
                  Discord
                </Link>
              </div>
            </div>

            {/* Right side */}
            <div className="flex items-center space-x-4">
              {/* Search Button */}
              <button
                onClick={toggleSearch}
                className="p-2 transition-colors hover:opacity-70"
                style={{ color: currentTheme.foreground }}
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
                    className="flex items-center space-x-2 p-2 rounded-full transition-colors"
                    style={{ 
                      color: currentTheme.foreground,
                      backgroundColor: showAccountMenu ? `${currentTheme.foreground}10` : 'transparent'
                    }}
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
                            initialsDiv.className = 'avatar-initials w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium';
                            initialsDiv.style.backgroundColor = currentTheme.foreground;
                            initialsDiv.style.color = currentTheme.background;
                            initialsDiv.textContent = getUserInitials(auth.user.display_name);
                            parent.appendChild(initialsDiv);
                          }
                        }}
                      />
                    ) : (
                      <div 
                        className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium"
                        style={{
                          backgroundColor: currentTheme.foreground,
                          color: currentTheme.background
                        }}
                      >
                        {getUserInitials(auth.user.display_name)}
                      </div>
                    )}
                    <span 
                      className="hidden md:block text-sm font-medium"
                      style={{ color: currentTheme.foreground }}
                    >
                      {auth.user.display_name}
                    </span>
                  </button>

                  {/* Account Dropdown */}
                  {showAccountMenu && (
                    <div 
                      className="absolute right-0 mt-2 w-56 backdrop-blur-[50px] rounded-md shadow-lg border py-1"
                      style={{
                        backgroundColor: `${currentTheme.background}E6`,
                        borderColor: `${currentTheme.foreground}20`
                      }}
                    >
                      <div 
                        className="px-4 py-2 text-xs border-b"
                        style={{
                          color: `${currentTheme.foreground}80`,
                          borderColor: `${currentTheme.foreground}20`
                        }}
                      >
                        Coins: {auth.user.coins?.toLocaleString() || '0'}
                      </div>
                      
                      <Link 
                        href="/account/settings" 
                        className="block px-4 py-2 text-sm transition-colors hover:opacity-70"
                        style={{ color: currentTheme.foreground }}
                      >
                        Settings
                      </Link>
                      <Link 
                        href="/account/bookmarks" 
                        className="block px-4 py-2 text-sm transition-colors hover:opacity-70"
                        style={{ color: currentTheme.foreground }}
                      >
                        Bookmark
                      </Link>
                      <Link 
                        href="/account/history" 
                        className="block px-4 py-2 text-sm transition-colors hover:opacity-70"
                        style={{ color: currentTheme.foreground }}
                      >
                        History
                      </Link>
                      
                      {/* Theme Selector */}
                      <button
                        onClick={() => {
                          setShowThemeModal(true);
                          setShowAccountMenu(false);
                        }}
                        className="block w-full text-left px-4 py-2 text-sm transition-colors hover:opacity-70"
                        style={{ color: currentTheme.foreground }}
                      >
                        🎨 Theme Settings
                      </button>
                      
                      <div 
                        className="border-t mt-1"
                        style={{ borderColor: `${currentTheme.foreground}20` }}
                      >
                        <Link
                          href="/logout"
                          method="post"
                          as="button"
                          className="block w-full text-left px-4 py-2 text-sm transition-colors hover:opacity-70"
                          style={{ color: '#ef4444' }}
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
                  className="px-4 py-2 rounded-md text-sm font-medium transition-colors"
                  style={{
                    backgroundColor: currentTheme.foreground,
                    color: currentTheme.background
                  }}
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
        <div 
          className={`fixed z-40 backdrop-blur-[50px] border-b p-4 transition-all duration-300 ${
            showNavbar ? 'top-16' : 'top-0'
          } left-0 right-0`}
          style={{
            backgroundColor: `${currentTheme.background}80`,
            borderColor: `${currentTheme.foreground}20`
          }}
        >
          <div className="max-w-7xl mx-auto">
            <div className="w-3/4 mx-auto">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search novels..."
                  className="w-full px-4 py-3 pl-10 backdrop-blur-[50px] border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent"
                  style={{
                    backgroundColor: `${currentTheme.background}60`,
                    borderColor: `${currentTheme.foreground}30`,
                    color: currentTheme.foreground
                  }}
                  autoFocus
                />
                <svg 
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5"
                  style={{ color: `${currentTheme.foreground}60` }}
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <Link
                  href={`/series?search=${encodeURIComponent(searchQuery)}`}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 px-4 py-1 rounded text-sm transition-colors"
                  style={{
                    backgroundColor: currentTheme.foreground,
                    color: currentTheme.background
                  }}
                >
                  Search
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className={`transition-all duration-300 ${
        showSearch 
          ? (showNavbar ? 'pt-32' : 'pt-20') 
          : 'pt-16'
      }`}>
        {children}
      </main>

      {/* Footer */}
      <footer 
        className="backdrop-blur-[50px] border-t py-8 mt-16"
        style={{
          backgroundColor: `${currentTheme.background}80`,
          borderColor: `${currentTheme.foreground}20`
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p 
              style={{ 
                fontFamily: 'Poppins, sans-serif',
                color: `${currentTheme.foreground}80`
              }}
            >
              Veinovel © 2025
            </p>
          </div>
        </div>
      </footer>

      {/* Theme Selector Modal */}
      <ThemeSelectorModal 
        isOpen={showThemeModal} 
        onClose={() => setShowThemeModal(false)} 
      />
    </div>
  );
}

export default function UserLayout({ children, title }: UserLayoutProps) {
  return (
    <ThemeProvider>
      <UserLayoutContent children={children} title={title} />
    </ThemeProvider>
  );
}
