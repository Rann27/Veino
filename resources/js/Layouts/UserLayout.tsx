import React, { useState, useEffect, useRef } from 'react';
import { Head, Link, usePage, router } from '@inertiajs/react';
import { ThemeProvider, useTheme } from '@/Contexts/ThemeContext';
import ThemeSelectorModal from '@/Components/ThemeSelectorModal';
import SearchSuggestions from '@/Components/Search/SearchSuggestions';

interface User {
  id: number;
  display_name: string;
  email: string;
  coins: number;
  membership_tier: 'basic' | 'premium';
  membership_expires_at?: string;
  avatar?: string;
}

interface SearchSuggestion {
  id: number;
  title: string;
  author: string;
  slug: string;
  cover_url: string | null;
  chapters_count: number;
  status: string;
  rating: number;
  genres: Array<{ id: number; name: string; }>;
  native_language: { id: number; name: string; };
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
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Auto-hide/show navbar on scroll with delay
  const [showNavbar, setShowNavbar] = useState(true);
  const hideDelayTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-hide navbar effect
  useEffect(() => {
    let lastY = 0;
    
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY < 10) {
        // Always show navbar at the top
        if (hideDelayTimerRef.current) {
          clearTimeout(hideDelayTimerRef.current);
          hideDelayTimerRef.current = null;
        }
        setShowNavbar(true);
      } else if (currentScrollY > lastY && currentScrollY > 80) {
        // Scrolling down & past 80px - hide navbar after 1 second delay
        if (hideDelayTimerRef.current) {
          clearTimeout(hideDelayTimerRef.current);
        }
        hideDelayTimerRef.current = setTimeout(() => {
          setShowNavbar(false);
          setShowAccountMenu(false); // Close account menu if open
          setShowSearch(false); // Close search if open
        }, 1000); // 1 second delay
      } else if (currentScrollY < lastY) {
        // Scrolling up - show navbar immediately
        if (hideDelayTimerRef.current) {
          clearTimeout(hideDelayTimerRef.current);
          hideDelayTimerRef.current = null;
        }
        setShowNavbar(true);
      }
      
      lastY = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (hideDelayTimerRef.current) {
        clearTimeout(hideDelayTimerRef.current);
      }
    };
  }, []);

  // Search suggestions effect
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Set new timeout for debouncing
    searchTimeoutRef.current = setTimeout(async () => {
      setIsLoadingSuggestions(true);
      try {
        const response = await fetch(`/api/search/suggestions?q=${encodeURIComponent(searchQuery)}`);
        if (response.ok) {
          const data = await response.json();
          setSuggestions(data);
          setShowSuggestions(true);
        }
      } catch (error) {
        console.error('Failed to fetch suggestions:', error);
      } finally {
        setIsLoadingSuggestions(false);
      }
    }, 300); // 300ms debounce

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const searchContainer = document.getElementById('search-container');
      if (searchContainer && !searchContainer.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    if (showSuggestions) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showSuggestions]);

  // Children should use useTheme hook instead of receiving currentTheme as prop

  // Helper function to convert hex to filter for SVG
  const toggleSearch = () => {
    setShowSearch(!showSearch);
    if (!showSearch) {
      setSearchQuery('');
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Search submitted:', searchQuery);
    if (searchQuery.trim()) {
      router.get(`/search?q=${encodeURIComponent(searchQuery)}`);
      setShowSearch(false);
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = () => {
    setShowSearch(false);
    setShowSuggestions(false);
    setSearchQuery('');
  };

  const toggleAccountMenu = () => {
    setShowAccountMenu(!showAccountMenu);
  };

  const toggleMobileSidebar = () => {
    setShowMobileSidebar(!showMobileSidebar);
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
        className={`fixed top-0 left-0 right-0 z-50 backdrop-blur-[50px] border-b transition-all duration-500 ease-in-out ${
          showNavbar ? 'translate-y-0' : '-translate-y-full'
        }`}
        style={{ 
          backgroundColor: `${currentTheme.background}80`,
          borderColor: `${currentTheme.foreground}20`
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo - Always visible */}
            <div className="flex-shrink-0">
              <Link 
                href="/" 
                className="flex items-center space-x-3 text-2xl font-semibold nav-link rounded-lg px-3 py-2" 
                style={{ 
                  fontFamily: 'Poppins, sans-serif',
                  color: currentTheme.foreground
                }}
              >
                <span>VEINOVEL</span>
              </Link>
            </div>

            {/* Navigation Links */}
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-8">
                <Link 
                  href="/" 
                  className="px-3 py-2 text-sm font-medium transition-all nav-link rounded-lg"
                  style={{ color: currentTheme.foreground }}
                >
                  Home
                </Link>
                <Link 
                  href="/explore" 
                  className="px-3 py-2 text-sm font-medium transition-all nav-link rounded-lg"
                  style={{ color: currentTheme.foreground }}
                >
                  Explore
                </Link>
                <Link 
                  href="/membership" 
                  className="px-3 py-2 text-sm font-medium transition-all nav-link rounded-lg"
                  style={{ color: currentTheme.foreground }}
                >
                  Membership
                </Link>
                <a 
                  href="https://discord.gg/5HcJf7p3ZG" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-2 text-sm font-medium transition-colors hover:opacity-70"
                  style={{ color: currentTheme.foreground }}
                >
                  Discord
                </a>
              </div>
            </div>

            {/* Right side */}
            <div className="flex items-center space-x-4">
              {/* Search Button */}
              <button
                onClick={toggleSearch}
                className="btn-ripple interactive-scale p-2 rounded-lg focus-ring"
                style={{ color: currentTheme.foreground }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>

              {/* Mobile burger menu */}
              <div className="md:hidden">
                <button
                  onClick={toggleMobileSidebar}
                  className="btn-ripple interactive-scale p-2 rounded-lg focus-ring"
                  style={{ color: currentTheme.foreground }}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              </div>

              {/* User Menu or Login - Desktop only */}
              <div className="hidden md:block">
                {auth?.user ? (
                  <div className="relative">
                    <button
                      onClick={toggleAccountMenu}
                      className="flex items-center space-x-2 p-2 rounded-full transition-colors"
                      style={{ 
                        color: currentTheme.foreground,
                        backgroundColor: showAccountMenu ? `${currentTheme.foreground}10` : 'transparent',
                        ...(auth.user.membership_tier === 'premium' && {
                          border: '2px solid #a78bfa',
                          boxShadow: '0 0 15px rgba(167, 139, 250, 0.5)',
                        })
                      }}
                    >
                    {auth.user.avatar ? (
                      <img
                        src={auth.user.avatar}
                        alt={auth.user.display_name}
                        className="w-8 h-8 rounded-full object-cover"
                        style={{
                          ...(auth.user.membership_tier === 'premium' && {
                            border: '2px solid #a78bfa'
                          })
                        }}
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
                            if (auth.user.membership_tier === 'premium') {
                              initialsDiv.style.border = '2px solid #a78bfa';
                            }
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
                          color: currentTheme.background,
                          ...(auth.user.membership_tier === 'premium' && {
                            border: '2px solid #a78bfa'
                          })
                        }}
                      >
                        {getUserInitials(auth.user.display_name)}
                      </div>
                    )}
                    <span 
                      className="hidden md:block text-sm font-medium"
                      style={{ 
                        color: auth.user.membership_tier === 'premium' ? '#a78bfa' : currentTheme.foreground
                      }}
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
                      {/* Membership Status */}
                      <div 
                        className="px-4 py-3 text-sm border-b font-medium flex items-center gap-2"
                        style={{
                          color: auth.user.membership_tier === 'premium' ? '#a78bfa' : currentTheme.foreground,
                          borderColor: `${currentTheme.foreground}20`
                        }}
                      >
                        {auth.user.membership_tier === 'premium' ? (
                          <>
                            {/* Shiny Diamond SVG */}
                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                              <defs>
                                <linearGradient id="diamondGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                  <stop offset="0%" style={{ stopColor: '#c084fc', stopOpacity: 1 }} />
                                  <stop offset="50%" style={{ stopColor: '#e879f9', stopOpacity: 1 }} />
                                  <stop offset="100%" style={{ stopColor: '#a78bfa', stopOpacity: 1 }} />
                                </linearGradient>
                              </defs>
                              <path 
                                d="M12 2L3 9L12 22L21 9L12 2Z" 
                                fill="url(#diamondGradient)"
                                stroke="#fff"
                                strokeWidth="0.5"
                              />
                              <path 
                                d="M12 2L12 22M3 9L21 9M7 5.5L17 5.5M7 9L12 22M17 9L12 22" 
                                stroke="#fff" 
                                strokeWidth="0.3" 
                                opacity="0.6"
                              />
                            </svg>
                            <span className="font-semibold">Premium Member</span>
                          </>
                        ) : (
                          <span>Basic Member</span>
                        )}
                      </div>
                      
                      <Link 
                        href="/account" 
                        className="flex items-center gap-2 px-4 py-2 text-sm transition-colors hover:opacity-70"
                        style={{ color: currentTheme.foreground }}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" fill="currentColor"/>
                        </svg>
                        Dashboard
                      </Link>
                      
                      <Link 
                        href="/account/settings" 
                        className="flex items-center gap-2 px-4 py-2 text-sm transition-colors hover:opacity-70"
                        style={{ color: currentTheme.foreground }}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" fill="currentColor"/>
                        </svg>
                        Settings
                      </Link>
                      
                      <Link 
                        href="/account/bookmarks" 
                        className="flex items-center gap-2 px-4 py-2 text-sm transition-colors hover:opacity-70"
                        style={{ color: currentTheme.foreground }}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M17 3H7c-1.1 0-1.99.9-1.99 2L5 21l7-3 7 3V5c0-1.1-.9-2-2-2z" fill="currentColor"/>
                        </svg>
                        Bookmark
                      </Link>
                      
                      {/* Theme Selector */}
                      <button
                        onClick={() => {
                          setShowThemeModal(true);
                          setShowAccountMenu(false);
                        }}
                        className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm transition-colors hover:opacity-70"
                        style={{ color: currentTheme.foreground }}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9c.83 0 1.5-.67 1.5-1.5 0-.39-.15-.74-.39-1.01-.23-.26-.38-.61-.38-.99 0-.83.67-1.5 1.5-1.5H16c2.76 0 5-2.24 5-5 0-4.42-4.03-8-9-8zm-5.5 9c-.83 0-1.5-.67-1.5-1.5S5.67 9 6.5 9 8 9.67 8 10.5 7.33 12 6.5 12zm3-4C8.67 8 8 7.33 8 6.5S8.67 5 9.5 5s1.5.67 1.5 1.5S10.33 8 9.5 8zm5 0c-.83 0-1.5-.67-1.5-1.5S13.67 5 14.5 5s1.5.67 1.5 1.5S15.33 8 14.5 8zm3 4c-.83 0-1.5-.67-1.5-1.5S16.67 9 17.5 9s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" fill="currentColor"/>
                        </svg>
                        Theme Settings
                      </button>
                      
                      <div 
                        className="border-t mt-1"
                        style={{ borderColor: `${currentTheme.foreground}20` }}
                      >
                        <Link
                          href="/logout"
                          method="post"
                          as="button"
                          className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm transition-colors hover:opacity-70"
                          style={{ color: '#ef4444' }}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z" fill="currentColor"/>
                          </svg>
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
        </div>
      </nav>

      {/* Mobile Sidebar */}
      {showMobileSidebar && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-[70] bg-black bg-opacity-50 md:hidden"
            onClick={toggleMobileSidebar}
          />
          
          {/* Sidebar */}
          <div 
            className={`fixed top-0 left-0 h-full w-80 z-[75] transform transition-transform duration-300 ease-in-out md:hidden ${
              showMobileSidebar ? 'translate-x-0' : '-translate-x-full'
            }`}
            style={{ 
              backgroundColor: currentTheme.background,
              borderRight: `1px solid ${currentTheme.foreground}20`
            }}
          >
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-8">
                <Link 
                  href="/" 
                  className="text-2xl font-semibold" 
                  style={{ 
                    fontFamily: 'Poppins, sans-serif',
                    color: currentTheme.foreground
                  }}
                  onClick={toggleMobileSidebar}
                >
                  VEINOVEL
                </Link>
                <button
                  onClick={toggleMobileSidebar}
                  className="p-2 transition-colors hover:opacity-70"
                  style={{ color: currentTheme.foreground }}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Navigation Menu */}
              <nav className="space-y-4">
                <Link 
                  href="/" 
                  className="block px-4 py-3 text-lg font-medium transition-colors hover:opacity-70 rounded-lg"
                  style={{ 
                    color: currentTheme.foreground,
                    backgroundColor: `${currentTheme.foreground}05`
                  }}
                  onClick={toggleMobileSidebar}
                >
                  Home
                </Link>
                <Link 
                  href="/explore" 
                  className="block px-4 py-3 text-lg font-medium transition-colors hover:opacity-70 rounded-lg"
                  style={{ 
                    color: currentTheme.foreground,
                    backgroundColor: `${currentTheme.foreground}05`
                  }}
                  onClick={toggleMobileSidebar}
                >
                  Explore
                </Link>
                <Link 
                  href="/membership" 
                  className="block px-4 py-3 text-lg font-medium transition-colors hover:opacity-70 rounded-lg"
                  style={{ 
                    color: currentTheme.foreground,
                    backgroundColor: `${currentTheme.foreground}05`
                  }}
                  onClick={toggleMobileSidebar}
                >
                  Membership
                </Link>
                <a 
                  href="https://discord.gg/5HcJf7p3ZG" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block px-4 py-3 text-lg font-medium transition-colors hover:opacity-70 rounded-lg"
                  style={{ 
                    color: currentTheme.foreground,
                    backgroundColor: `${currentTheme.foreground}05`
                  }}
                  onClick={toggleMobileSidebar}
                >
                  Discord
                </a>
              </nav>

              {/* User Section */}
              {auth?.user ? (
                <div className="mt-8 pt-6 border-t" style={{ borderColor: `${currentTheme.foreground}20` }}>
                  <div className="flex items-center space-x-3 mb-4">
                    {auth.user.avatar ? (
                      <img
                        src={auth.user.avatar}
                        alt={auth.user.display_name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div 
                        className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium"
                        style={{
                          backgroundColor: currentTheme.foreground,
                          color: currentTheme.background
                        }}
                      >
                        {getUserInitials(auth.user.display_name)}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate" style={{ color: currentTheme.foreground }}>
                        {auth.user.display_name}
                      </p>
                      {auth.user.membership_tier === 'premium' && auth.user.membership_expires_at && new Date(auth.user.membership_expires_at) > new Date() ? (
                        <div className="text-xs flex items-center gap-1 mt-1" style={{ color: '#a78bfa' }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <defs>
                              <linearGradient id="diamondGradientMobile" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" style={{ stopColor: '#c084fc', stopOpacity: 1 }} />
                                <stop offset="50%" style={{ stopColor: '#e879f9', stopOpacity: 1 }} />
                                <stop offset="100%" style={{ stopColor: '#a78bfa', stopOpacity: 1 }} />
                              </linearGradient>
                            </defs>
                            <path 
                              d="M12 2L3 9L12 22L21 9L12 2Z" 
                              fill="url(#diamondGradientMobile)"
                              stroke="#fff"
                              strokeWidth="0.5"
                            />
                            <path 
                              d="M12 2L12 22M3 9L21 9M7 5.5L17 5.5M7 9L12 22M17 9L12 22" 
                              stroke="#fff" 
                              strokeWidth="0.3" 
                              opacity="0.6"
                            />
                          </svg>
                          <span className="font-semibold">Premium Member</span>
                        </div>
                      ) : (
                        <p className="text-xs mt-1" style={{ color: `${currentTheme.foreground}60` }}>
                          Basic Member
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Link
                      href="/account"
                      className="flex items-center gap-3 px-4 py-2 text-sm transition-colors hover:opacity-70 rounded-lg"
                      style={{ 
                        color: currentTheme.foreground,
                        backgroundColor: `${currentTheme.foreground}05`
                      }}
                      onClick={toggleMobileSidebar}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" fill="currentColor"/>
                      </svg>
                      Dashboard
                    </Link>
                    <Link
                      href="/account/settings"
                      className="flex items-center gap-3 px-4 py-2 text-sm transition-colors hover:opacity-70 rounded-lg"
                      style={{ 
                        color: currentTheme.foreground,
                        backgroundColor: `${currentTheme.foreground}05`
                      }}
                      onClick={toggleMobileSidebar}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" fill="currentColor"/>
                      </svg>
                      Settings
                    </Link>
                    <Link
                      href="/account/bookmarks"
                      className="flex items-center gap-3 px-4 py-2 text-sm transition-colors hover:opacity-70 rounded-lg"
                      style={{ 
                        color: currentTheme.foreground,
                        backgroundColor: `${currentTheme.foreground}05`
                      }}
                      onClick={toggleMobileSidebar}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M17 3H7c-1.1 0-1.99.9-1.99 2L5 21l7-3 7 3V5c0-1.1-.9-2-2-2z" fill="currentColor"/>
                      </svg>
                      Bookmark
                    </Link>
                    <button
                      onClick={() => {
                        setShowThemeModal(true);
                        toggleMobileSidebar();
                      }}
                      className="flex items-center gap-3 w-full text-left px-4 py-2 text-sm transition-colors hover:opacity-70 rounded-lg"
                      style={{ 
                        color: currentTheme.foreground,
                        backgroundColor: `${currentTheme.foreground}05`
                      }}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9c.83 0 1.5-.67 1.5-1.5 0-.39-.15-.74-.39-1.01-.23-.26-.38-.61-.38-.99 0-.83.67-1.5 1.5-1.5H16c2.76 0 5-2.24 5-5 0-4.42-4.03-8-9-8zm-5.5 9c-.83 0-1.5-.67-1.5-1.5S5.67 9 6.5 9 8 9.67 8 10.5 7.33 12 6.5 12zm3-4C8.67 8 8 7.33 8 6.5S8.67 5 9.5 5s1.5.67 1.5 1.5S10.33 8 9.5 8zm5 0c-.83 0-1.5-.67-1.5-1.5S13.67 5 14.5 5s1.5.67 1.5 1.5S15.33 8 14.5 8zm3 4c-.83 0-1.5-.67-1.5-1.5S16.67 9 17.5 9s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" fill="currentColor"/>
                      </svg>
                      Theme Settings
                    </button>
                    <Link
                      href="/logout"
                      method="post"
                      as="button"
                      className="flex items-center gap-3 w-full text-left px-4 py-2 text-sm transition-colors hover:opacity-70 rounded-lg"
                      style={{ color: '#ef4444' }}
                      onClick={toggleMobileSidebar}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z" fill="currentColor"/>
                      </svg>
                      Logout
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="mt-8 pt-6 border-t" style={{ borderColor: `${currentTheme.foreground}20` }}>
                  <Link
                    href="/login"
                    className="block w-full text-center px-4 py-3 rounded-lg text-lg font-medium transition-colors"
                    style={{
                      backgroundColor: currentTheme.foreground,
                      color: currentTheme.background
                    }}
                    onClick={toggleMobileSidebar}
                  >
                    Login
                  </Link>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Search Bar */}
      {showSearch && (
        <div 
          className={`fixed z-[60] backdrop-blur-[50px] border-b p-4 transition-all duration-300 ${
            showNavbar ? 'top-16' : 'top-0'
          } left-0 right-0`}
          style={{
            backgroundColor: `${currentTheme.background}80`,
            borderColor: `${currentTheme.foreground}20`,
            pointerEvents: 'auto'
          }}
        >
          <div className="max-w-7xl mx-auto">
            <div className="w-3/4 mx-auto">
              <div id="search-container" className="relative" style={{ pointerEvents: 'auto' }}>
                <form onSubmit={handleSearchSubmit}>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      console.log('Input changed:', e.target.value);
                      setSearchQuery(e.target.value);
                    }}
                    onFocus={() => {
                      console.log('Input focused, query:', searchQuery);
                      searchQuery.trim() && setShowSuggestions(true);
                    }}
                    onKeyDown={(e) => {
                      console.log('Key pressed:', e.key);
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleSearchSubmit(e);
                      }
                    }}
                    placeholder="Search novels..."
                    className="w-full px-4 py-3 pl-10 pr-20 backdrop-blur-[50px] border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent"
                    style={{
                      backgroundColor: `${currentTheme.background}60`,
                      borderColor: `${currentTheme.foreground}30`,
                      color: currentTheme.foreground,
                      pointerEvents: 'auto'
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
                  
                  {/* Loading indicator */}
                  {isLoadingSuggestions && (
                    <div className="absolute right-16 top-1/2 transform -translate-y-1/2">
                      <svg className="animate-spin h-4 w-4" style={{ color: `${currentTheme.foreground}60` }} fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    </div>
                  )}
                  
                  <button
                    type="submit"
                    onClick={(e) => {
                      console.log('Search button clicked');
                      handleSearchSubmit(e);
                    }}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 px-4 py-1 rounded text-sm transition-colors cursor-pointer"
                    style={{
                      backgroundColor: currentTheme.foreground,
                      color: currentTheme.background,
                      pointerEvents: 'auto'
                    }}
                  >
                    Search
                  </button>
                </form>

                {/* Search Suggestions */}
                <SearchSuggestions
                  suggestions={suggestions}
                  query={searchQuery}
                  onSuggestionClick={handleSuggestionClick}
                  isVisible={showSuggestions}
                />
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
          <div className="flex flex-col sm:flex-row justify-between items-center">
            <p 
              style={{ 
                fontFamily: 'Poppins, sans-serif',
                color: `${currentTheme.foreground}80`
              }}
              className="mb-4 sm:mb-0"
            >
              Veinovel © 2025
            </p>
            <div className="flex space-x-6">
              <Link 
                href="/privacy"
                style={{ 
                  fontFamily: 'Poppins, sans-serif',
                  color: `${currentTheme.foreground}70`
                }}
                className="text-sm hover:opacity-100 transition-opacity duration-200"
              >
                Privacy Policy
              </Link>
              <Link 
                href="/dmca"
                style={{ 
                  fontFamily: 'Poppins, sans-serif',
                  color: `${currentTheme.foreground}70`
                }}
                className="text-sm hover:opacity-100 transition-opacity duration-200"
              >
                DMCA
              </Link>
              <Link 
                href="/contact"
                style={{ 
                  fontFamily: 'Poppins, sans-serif',
                  color: `${currentTheme.foreground}70`
                }}
                className="text-sm hover:opacity-100 transition-opacity duration-200"
              >
                Contact Us
              </Link>
            </div>
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
