import React, { useState, useEffect, useRef } from 'react';
import { Head, Link, usePage, router } from '@inertiajs/react';
import { ThemeProvider, useTheme } from '@/Contexts/ThemeContext';
import { ToastProvider } from '@/Contexts/ToastContext';
import ThemeSelectorModal from '@/Components/ThemeSelectorModal';
import SearchSuggestions from '@/Components/Search/SearchSuggestions';
import { TierStyles, TierIcon, ExclusiveCrownIcon, TIER_LABEL, TIER_COLOR, TIER_GRADIENT, TIER_GLOW, asTier, isPaidTier, tierRingStyle } from '@/lib/tier';


interface User {
  id: number;
  display_name: string;
  email: string;
  coins: number;
  membership_tier: 'basic' | 'premium' | 'exclusive';
  membership_expires_at?: string;
  avatar?: string;
  avatar_url?: string;
}

interface SearchSuggestion {
  id: number;
  title: string;
  author: string;
  slug: string;
  cover_url: string | null;
  chapters_count: number;
  status: string;
  rating: number | string | null;
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
  hideMobileBottomNav?: boolean;
  hideSiteChrome?: boolean;
}

function UserLayoutContent({ children, title, hideMobileBottomNav = false, hideSiteChrome = false }: UserLayoutProps) {
  const { auth, flash } = usePage<PageProps>().props;
  const { currentTheme } = useTheme();
  const [showSearch, setShowSearch] = useState(false);
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [showPremiumCongrats, setShowPremiumCongrats] = useState(false);
  const [premiumGrantedData, setPremiumGrantedData] = useState<any>(null);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [showShopDropdown, setShowShopDropdown] = useState(false);
  const [showMobileShopExpand, setShowMobileShopExpand] = useState(false);
  const shopDropdownRef = useRef<HTMLDivElement>(null);
  const shopHoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // Page transition progress bar
  const [pageLoading, setPageLoading] = useState(false);

  useEffect(() => {
    const startLoading = () => setPageLoading(true);
    const stopLoading  = () => setPageLoading(false);

    const removeStart  = router.on('start',  startLoading);
    const removeFinish = router.on('finish', stopLoading);
    const removeError  = router.on('error',  stopLoading);

    return () => {
      removeStart();
      removeFinish();
      removeError();
    };
  }, []);

  // Lock body scroll when mobile sidebar is open
  useEffect(() => {
    if (showMobileSidebar) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    // Cleanup on unmount
    return () => {
      document.body.style.overflow = '';
    };
  }, [showMobileSidebar]);
  
  // Auto-hide/show navbar on scroll with delay
  const [showNavbar, setShowNavbar] = useState(true);
  const hideDelayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  // Close shop dropdown when clicking outside
  useEffect(() => {
    if (!showShopDropdown) return;
    const handleClick = (e: MouseEvent) => {
      if (shopDropdownRef.current && !shopDropdownRef.current.contains(e.target as Node)) {
        setShowShopDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showShopDropdown]);

  // Premium congratulations modal detection
  useEffect(() => {
    if (flash?.premium_granted) {
      setPremiumGrantedData(flash.premium_granted);
      setShowPremiumCongrats(true);
    }
  }, [flash]);

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

  // Active nav link helper
  const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
  const isNavActive = (path: string) =>
    path === '/' ? currentPath === '/' : currentPath === path || currentPath.startsWith(path + '/');

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
      data-tier={asTier(auth?.user?.membership_tier)}
    >
      {title && <Head title={title} />}

      {/* Tier keyframes, mounted once for the whole page */}
      <TierStyles />

      {/* Page transition progress bar */}
      {pageLoading && <div className="page-progress-bar" />}

      {/* Navbar */}
      <nav 
        className={`fixed top-0 left-0 right-0 z-50 border-b transition-transform duration-200 ease-out ${hideSiteChrome ? 'hidden' : ''} ${
          showNavbar ? 'translate-y-0' : '-translate-y-full'
        }`}
        style={{ 
          backgroundColor: currentTheme.background,
          borderColor: `${currentTheme.foreground}15`
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo - Always visible */}
            <div className="flex-shrink-0">
              <Link 
                href="/" 
                className="flex items-center space-x-3 text-xl font-semibold tracking-tight rounded-lg px-2.5 py-1.5 transition-opacity hover:opacity-80" 
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
                  prefetch
                  className={`px-3 py-2 text-sm font-medium transition-all nav-link rounded-lg${isNavActive('/') ? ' nav-active-dot' : ''}`}
                  style={{ color: currentTheme.foreground }}
                >
                  Home
                </Link>
                <Link
                  href="/explore"
                  prefetch
                  className={`px-3 py-2 text-sm font-medium transition-all nav-link rounded-lg${isNavActive('/explore') ? ' nav-active-dot' : ''}`}
                  style={{ color: currentTheme.foreground }}
                >
                  Explore
                </Link>
                <Link
                  href="/epub-novels"
                  prefetch
                  className={`px-3 py-2 text-sm font-medium transition-all nav-link rounded-lg${isNavActive('/epub-novels') ? ' nav-active-dot' : ''}`}
                  style={{ color: currentTheme.foreground }}
                >
                  Epub Novels
                </Link>
                {/* Shop dropdown */}
                <div
                  ref={shopDropdownRef}
                  className="relative"
                  onMouseEnter={() => {
                    if (shopHoverTimerRef.current) clearTimeout(shopHoverTimerRef.current);
                    setShowShopDropdown(true);
                  }}
                  onMouseLeave={() => {
                    shopHoverTimerRef.current = setTimeout(() => setShowShopDropdown(false), 150);
                  }}
                >
                  <button
                    onClick={() => setShowShopDropdown(v => !v)}
                    className={`flex items-center gap-1 px-3 py-2 text-sm font-medium transition-all nav-link rounded-lg${isNavActive('/shop') ? ' nav-active-dot' : ''}`}
                    style={{ color: currentTheme.foreground }}
                  >
                    Shop
                    <svg
                      className={`w-3.5 h-3.5 transition-transform duration-200 ${showShopDropdown ? 'rotate-180' : ''}`}
                      fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {showShopDropdown && (
                    <div
                      className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-44 rounded-lg border overflow-hidden shadow-lg z-50 py-1"
                      style={{
                        backgroundColor: currentTheme.background,
                        borderColor: `${currentTheme.foreground}15`,
                      }}
                    >
                      <Link
                        href="/shop?tab=coins"
                        prefetch
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium transition-colors hover:opacity-75"
                        style={{ color: currentTheme.foreground }}
                        onClick={() => setShowShopDropdown(false)}
                      >
                        <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Coins
                      </Link>
                      <div style={{ height: '1px', backgroundColor: `${currentTheme.foreground}10`, margin: '4px 0' }} />
                      <Link
                        href="/shop?tab=membership"
                        prefetch
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium transition-colors hover:opacity-75"
                        style={{ color: currentTheme.foreground }}
                        onClick={() => setShowShopDropdown(false)}
                      >
                        <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                        </svg>
                        Membership
                      </Link>
                    </div>
                  )}
                </div>
                <Link
                  href="/request"
                  prefetch
                  className={`px-3 py-2 text-sm font-medium transition-all nav-link rounded-lg${isNavActive('/request') ? ' nav-active-dot' : ''}`}
                  style={{ color: currentTheme.foreground }}
                >
                  Request
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
            <div className="flex items-center space-x-2">
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

              {/* Theme Settings Button — desktop only */}
              <button
                onClick={() => setShowThemeModal(true)}
                className="hidden md:flex btn-ripple interactive-scale p-2 rounded-lg focus-ring"
                style={{ color: currentTheme.foreground }}
                title="Theme Settings"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9c.83 0 1.5-.67 1.5-1.5 0-.39-.15-.74-.39-1.01-.23-.26-.38-.61-.38-.99 0-.83.67-1.5 1.5-1.5H16c2.76 0 5-2.24 5-5 0-4.42-4.03-8-9-8zm-5.5 9c-.83 0-1.5-.67-1.5-1.5S5.67 9 6.5 9 8 9.67 8 10.5 7.33 12 6.5 12zm3-4C8.67 8 8 7.33 8 6.5S8.67 5 9.5 5s1.5.67 1.5 1.5S10.33 8 9.5 8zm5 0c-.83 0-1.5-.67-1.5-1.5S13.67 5 14.5 5s1.5.67 1.5 1.5S15.33 8 14.5 8zm3 4c-.83 0-1.5-.67-1.5-1.5S16.67 9 17.5 9s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
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
                      className="p-0.5 rounded-full transition-all"
                      style={isPaidTier(auth.user.membership_tier) ? tierRingStyle(auth.user.membership_tier) : {
                        backgroundColor: showAccountMenu ? `${currentTheme.foreground}10` : 'transparent',
                      }}
                      data-tier={asTier(auth.user.membership_tier)}
                      title={auth.user.display_name}
                    >
                      <div className="rounded-full overflow-hidden"
                        style={isPaidTier(auth.user.membership_tier) ? { background: currentTheme.background } : {}}>
                        {auth.user.avatar_url ? (
                          <img
                            src={auth.user.avatar_url}
                            alt={auth.user.display_name}
                            className="w-8 h-8 rounded-full object-cover block"
                          />
                        ) : (
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium"
                            style={{
                              backgroundColor: currentTheme.foreground,
                              color: currentTheme.background,
                            }}
                          >
                            {getUserInitials(auth.user.display_name)}
                          </div>
                        )}
                      </div>
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
                      {/* User info + Coin Balance */}
                      <div
                        className="px-4 py-3 text-sm border-b"
                        style={{ borderColor: `${currentTheme.foreground}20` }}
                      >
                        <p className="font-semibold truncate mb-1.5" style={{ color: currentTheme.foreground }}>
                          {auth.user.display_name}
                        </p>
                        <Link
                          href="/account/coins"
                          className="flex items-center justify-between hover:opacity-70 transition-opacity"
                        >
                          <span style={{ color: currentTheme.foreground, opacity: 0.6, fontSize: '0.75rem' }}>
                            Coin Balance
                          </span>
                          <span className="font-bold" style={{ color: '#f59e0b' }}>
                            ¢{auth.user.coins?.toLocaleString() || 0}
                          </span>
                        </Link>
                      </div>

                      {/* Membership Status */}
                      <div
                        className="px-4 py-2.5 text-sm border-b"
                        style={{ borderColor: `${currentTheme.foreground}20` }}
                      >
                        {isPaidTier(auth.user.membership_tier) ? (
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <TierIcon tier={auth.user.membership_tier} size={16} />
                              <span className="font-semibold" style={{ color: TIER_COLOR[asTier(auth.user.membership_tier)] }}>{TIER_LABEL[asTier(auth.user.membership_tier)]}</span>
                            </div>
                            {auth.user.membership_expires_at && (
                              <span className="text-xs" style={{ color: `${currentTheme.foreground}50` }}>
                                Exp. {new Date(auth.user.membership_expires_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs" style={{ color: `${currentTheme.foreground}50` }}>Basic Member</span>
                        )}
                      </div>
                      
                      {/* Dashboard */}
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
                      
                      {/* My Request */}
                      <Link 
                        href="/request?tab=mine" 
                        className="flex items-center gap-2 px-4 py-2 text-sm transition-colors hover:opacity-70"
                        style={{ color: currentTheme.foreground }}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M9 11.75 11 13.75 15.5 9.25M8 3h8l1.2 2H20c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V7c0-1.1.9-2 2-2h2.8L8 3Zm.9 2-.6 1h9.4l-.6-1H8.9Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        My Request
                      </Link>
                       
                      {/* My Chart */}
                      <Link 
                        href="/my-chart" 
                        className="flex items-center gap-2 px-4 py-2 text-sm transition-colors hover:opacity-70"
                        style={{ color: currentTheme.foreground }}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.08-.14.12-.31.12-.48 0-.55-.45-1-1-1H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z" fill="currentColor"/>
                        </svg>
                        My Chart
                      </Link>
                      
                      {/* Bookshelf */}
                      <Link 
                        href="/bookshelf" 
                        className="flex items-center gap-2 px-4 py-2 text-sm transition-colors hover:opacity-70"
                        style={{ color: currentTheme.foreground }}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M19 2H9c-1.1 0-2 .9-2 2v5.5c0 .83.67 1.5 1.5 1.5S10 10.33 10 9.5V4h8v16H5V10H3v10c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM9 9.5C9 9.78 8.78 10 8.5 10S8 9.78 8 9.5V4H2v5.5C2 10.33 2.67 11 3.5 11S5 10.33 5 9.5V4" fill="currentColor"/>
                        </svg>
                        Bookshelf
                      </Link>
                      
                      {/* Bookmark */}
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
                      
                      {/* Settings */}
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
                  href="/auth"
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
            className="fixed inset-0 z-[70] bg-black/50 md:hidden"
            onClick={toggleMobileSidebar}
          />
          
          {/* Sidebar */}
          <div
            className={`fixed top-0 left-0 h-full w-80 z-[75] transform transition-transform duration-200 ease-out md:hidden overflow-hidden flex flex-col ${
              showMobileSidebar ? 'translate-x-0' : '-translate-x-full'
            }`}
            style={{ 
              backgroundColor: currentTheme.background,
              borderRight: `1px solid ${currentTheme.foreground}15`
            }}
          >
            <div className="h-full overflow-y-auto p-6 scrollbar-hide">
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
                  prefetch
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
                  prefetch
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
                  href="/epub-novels" 
                  prefetch
                  className="block px-4 py-3 text-lg font-medium transition-colors hover:opacity-70 rounded-lg"
                  style={{ 
                    color: currentTheme.foreground,
                    backgroundColor: `${currentTheme.foreground}05`
                  }}
                  onClick={toggleMobileSidebar}
                >
                  Epub Novels
                </Link>
                {/* Shop expandable */}
                <div>
                  <button
                    className="flex items-center justify-between w-full px-4 py-3 text-lg font-medium transition-colors hover:opacity-70 rounded-lg text-left"
                    style={{ color: currentTheme.foreground, backgroundColor: `${currentTheme.foreground}05` }}
                    onClick={() => setShowMobileShopExpand(v => !v)}
                  >
                    Shop
                    <svg
                      className={`w-4 h-4 transition-transform duration-200 ${showMobileShopExpand ? 'rotate-180' : ''}`}
                      fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {showMobileShopExpand && (
                    <div className="mt-1 ml-4 space-y-1">
                      <Link
                        href="/shop?tab=coins"
                        prefetch
                        className="flex items-center gap-2.5 px-4 py-2.5 text-base font-medium transition-colors hover:opacity-70 rounded-lg"
                        style={{ color: currentTheme.foreground, backgroundColor: `${currentTheme.foreground}08` }}
                        onClick={toggleMobileSidebar}
                      >
                        <svg className="w-4 h-4 opacity-60" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Coins
                      </Link>
                      <Link
                        href="/shop?tab=membership"
                        prefetch
                        className="flex items-center gap-2.5 px-4 py-2.5 text-base font-medium transition-colors hover:opacity-70 rounded-lg"
                        style={{ color: currentTheme.foreground, backgroundColor: `${currentTheme.foreground}08` }}
                        onClick={toggleMobileSidebar}
                      >
                        <svg className="w-4 h-4 opacity-60" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                        </svg>
                        Membership
                      </Link>
                    </div>
                  )}
                </div>
                <Link 
                  href="/request" 
                  prefetch
                  className="block px-4 py-3 text-lg font-medium transition-colors hover:opacity-70 rounded-lg"
                  style={{ 
                    color: currentTheme.foreground,
                    backgroundColor: `${currentTheme.foreground}05`
                  }}
                  onClick={toggleMobileSidebar}
                >
                  Request
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
                    {auth.user.avatar_url ? (
                      <img
                        src={auth.user.avatar_url}
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
                      <Link 
                        href="/account/coins" 
                        className="text-sm font-semibold mt-0.5 inline-block hover:opacity-70 transition-opacity"
                        style={{ color: '#f59e0b' }}
                        onClick={toggleMobileSidebar}
                      >
                        ¢{auth.user.coins?.toLocaleString() || 0}
                      </Link>
                      {isPaidTier(auth.user.membership_tier) && auth.user.membership_expires_at && new Date(auth.user.membership_expires_at) > new Date() ? (
                        <div className="text-xs flex items-center gap-1 mt-1" style={{ color: TIER_COLOR[asTier(auth.user.membership_tier)] }}>
                          <TierIcon tier={auth.user.membership_tier} size={14} />
                          <span className="font-semibold">{TIER_LABEL[asTier(auth.user.membership_tier)]} Member</span>
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
                      href="/request?tab=mine"
                      className="flex items-center gap-3 px-4 py-2 text-sm transition-colors hover:opacity-70 rounded-lg"
                      style={{ 
                        color: currentTheme.foreground,
                        backgroundColor: `${currentTheme.foreground}05`
                      }}
                      onClick={toggleMobileSidebar}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M9 11.75 11 13.75 15.5 9.25M8 3h8l1.2 2H20c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V7c0-1.1.9-2 2-2h2.8L8 3Zm.9 2-.6 1h9.4l-.6-1H8.9Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      My Request
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
                    href="/auth"
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
          className={`fixed z-[60] border-b p-4 transition-all duration-200 ${
            showNavbar ? 'top-16' : 'top-0'
          } left-0 right-0`}
          style={{
            backgroundColor: currentTheme.background,
            borderColor: `${currentTheme.foreground}15`,
            pointerEvents: 'auto'
          }}
        >
          <div className="max-w-7xl mx-auto">
            <div className="w-full sm:w-3/4 mx-auto">
              <div id="search-container" className="relative" style={{ pointerEvents: 'auto' }}>
                <form onSubmit={handleSearchSubmit}>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                    }}
                    onFocus={() => {
                      searchQuery.trim() && setShowSuggestions(true);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleSearchSubmit(e);
                      }
                    }}
                    placeholder="Search novels..."
                    className="w-full px-4 py-2.5 pl-10 pr-20 border rounded-lg focus:outline-none focus-ring text-sm"
                    style={{
                      backgroundColor: `${currentTheme.foreground}06`,
                      borderColor: `${currentTheme.foreground}15`,
                      color: currentTheme.foreground,
                      pointerEvents: 'auto'
                    }}
                    autoFocus
                  />
                  <svg 
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4"
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
                      handleSearchSubmit(e);
                    }}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 px-3 py-1 rounded-md text-xs font-medium transition-opacity hover:opacity-85 cursor-pointer"
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

      {/* Spacer for fixed navbar */}
      <div className={hideSiteChrome ? 'h-0' : 'h-16'} />

      {/* Main Content */}
      <main className={`transition-all duration-200 has-bottom-nav ${
        showSearch
          ? (showNavbar ? 'pt-16' : 'pt-4')
          : 'pt-0'
      }`}>
        {children}
      </main>

      {/* Footer */}
      <footer
        className={`border-t py-8 ${hideSiteChrome ? 'hidden' : ''}`}
        style={{
          backgroundColor: currentTheme.background,
          borderColor: `${currentTheme.foreground}15`
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
              Veinovel © 2026
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

      {/* Premium Congratulations Modal */}
      {showPremiumCongrats && premiumGrantedData && (() => {
        // Dressed for whichever tier was actually granted — the flash carries
        // the slug, so an Exclusive purchase never congratulates you on Premium.
        const grantedTier = asTier(premiumGrantedData.tier);
        const accent = TIER_COLOR[grantedTier];
        const exclusive = grantedTier === 'exclusive';

        return (
        <div 
          className="fixed inset-0 flex items-center justify-center z-50 p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}
          onClick={() => setShowPremiumCongrats(false)}
        >
          <div 
            className={`rounded-lg p-8 max-w-md w-full shadow-xl border${exclusive ? ' tier-neon' : ''}`}
            style={exclusive ? {
              backgroundColor: currentTheme.background,
              border: '2px solid transparent',
              backgroundImage: `linear-gradient(${currentTheme.background}, ${currentTheme.background}), ${TIER_GRADIENT.exclusive}`,
              backgroundOrigin: 'border-box',
              backgroundClip: 'padding-box, border-box',
              backgroundSize: 'auto, 300% 300%',
              boxShadow: TIER_GLOW.exclusive,
            } : { 
              backgroundColor: currentTheme.background,
              borderColor: `${currentTheme.foreground}20`
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Success Icon */}
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: `${accent}20` }}>
                {exclusive ? (
                  <ExclusiveCrownIcon size={34} />
                ) : (
                  <svg className="w-8 h-8" style={{ color: accent }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
            </div>

            {/* Title */}
            <h3 
              className="text-2xl font-bold text-center mb-2"
              style={{ 
                fontFamily: 'Poppins, sans-serif',
                color: currentTheme.foreground
              }}
            >
              Congratulations!
            </h3>

            {/* Message */}
            <p 
              className="text-center mb-6"
              style={{ 
                fontFamily: 'Poppins, sans-serif',
                color: `${currentTheme.foreground}80`
              }}
            >
              {premiumGrantedData.days} Day{premiumGrantedData.days !== 1 ? 's' : ''} of {TIER_LABEL[grantedTier]} Has Been Added to Your Account!
            </p>

            {/* Package Badge */}
            <div className="flex justify-center mb-6">
              <span 
                className="px-4 py-2 rounded-full text-sm font-semibold inline-flex items-center gap-1.5"
                style={{
                  backgroundColor: `${accent}20`,
                  color: accent,
                  fontFamily: 'Poppins, sans-serif'
                }}
              >
                <TierIcon tier={grantedTier} size={14} />
                {premiumGrantedData.package_name}
              </span>
            </div>

            {/* Close Button */}
            <button
              onClick={() => setShowPremiumCongrats(false)}
              className="w-full py-3 rounded-lg font-semibold transition-all duration-200 hover:opacity-90"
              style={{
                backgroundColor: accent,
                color: exclusive ? '#3b2a00' : 'white',
                fontFamily: 'Poppins, sans-serif'
              }}
            >
              Got it!
            </button>
          </div>
        </div>
        );
      })()}

      {/* Mobile Bottom Navigation */}
      {!hideMobileBottomNav && <MobileBottomNav currentPath={currentPath} user={auth?.user} />}
    </div>
  );
}

// ─── Mobile Bottom Nav ────────────────────────────────────────────────────────

function MobileBottomNav({ currentPath, user }: { currentPath: string; user?: { display_name: string; membership_tier?: string } | null }) {
  const { currentTheme } = useTheme();
  const [visible, setVisible] = useState(true);
  const [showShopPopup, setShowShopPopup] = useState(false);
  const shopPopupRef = useRef<HTMLDivElement>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Scroll: hide after 1.5s of scrolling down, show immediately on scroll up
  useEffect(() => {
    let lastY = window.scrollY;

    const handleScroll = () => {
      const currentY = window.scrollY;
      if (currentY < 20) {
        if (hideTimerRef.current) { clearTimeout(hideTimerRef.current); hideTimerRef.current = null; }
        setVisible(true);
      } else if (currentY > lastY + 4) {
        if (!hideTimerRef.current) {
          hideTimerRef.current = setTimeout(() => {
            setVisible(false);
            hideTimerRef.current = null;
          }, 1500);
        }
      } else if (currentY < lastY - 4) {
        if (hideTimerRef.current) { clearTimeout(hideTimerRef.current); hideTimerRef.current = null; }
        setVisible(true);
      }
      lastY = currentY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, []);

  // Long press anywhere (0.5s) to show when hidden
  useEffect(() => {
    if (visible) return;
    let pressTimer: ReturnType<typeof setTimeout> | null = null;

    const handleDown = () => {
      pressTimer = setTimeout(() => setVisible(true), 500);
    };
    const handleUp = () => {
      if (pressTimer) { clearTimeout(pressTimer); pressTimer = null; }
    };

    document.addEventListener('pointerdown', handleDown);
    document.addEventListener('pointerup', handleUp);
    document.addEventListener('pointercancel', handleUp);
    return () => {
      document.removeEventListener('pointerdown', handleDown);
      document.removeEventListener('pointerup', handleUp);
      document.removeEventListener('pointercancel', handleUp);
      if (pressTimer) clearTimeout(pressTimer);
    };
  }, [visible]);

  const isActive = (path: string) =>
    path === '/' ? currentPath === '/' : currentPath === path || currentPath.startsWith(path + '/');

  const navItems = [
    {
      path: '/',
      label: 'Home',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
    },
    {
      path: '/explore',
      label: 'Explore',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      ),
    },
    {
      path: '/account/bookmarks',
      label: 'Library',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
    },
    {
      path: '/account',
      label: 'Account',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
    },
  ];

  const shopActive = currentPath === '/shop' || currentPath.startsWith('/shop/');

  return (
    <>
      {/* Shop popup overlay */}
      {showShopPopup && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowShopPopup(false)}
          />
          <div
            ref={shopPopupRef}
            className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 rounded-lg border shadow-xl overflow-hidden py-1"
            style={{
              backgroundColor: currentTheme.background,
              borderColor: `${currentTheme.foreground}15`,
              minWidth: '200px',
            }}
          >
            <div className="px-4 pt-2 pb-1.5">
              <p className="text-[11px] font-medium uppercase tracking-wider opacity-45" style={{ color: currentTheme.foreground }}>Shop</p>
            </div>
            <Link
              href="/shop?tab=coins"
              prefetch
              className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:opacity-75"
              style={{ color: currentTheme.foreground }}
              onClick={() => setShowShopPopup(false)}
            >
              <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm font-medium">Coins</span>
            </Link>
            <div style={{ height: '1px', backgroundColor: `${currentTheme.foreground}10`, margin: '4px 0' }} />
            <Link
              href="/shop?tab=membership"
              prefetch
              className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:opacity-75"
              style={{ color: currentTheme.foreground }}
              onClick={() => setShowShopPopup(false)}
            >
              <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
              <span className="text-sm font-medium">Membership</span>
            </Link>
          </div>
        </>
      )}

      <nav
        className={`mobile-bottom-nav transition-transform duration-200 ease-out ${visible ? 'translate-y-0' : 'translate-y-full'}`}
        style={{
          backgroundColor: currentTheme.background,
          borderColor: `${currentTheme.foreground}15`,
        }}
      >
        {navItems.map(item => {
          const active = isActive(item.path);
          return (
            <Link
              key={item.path}
              href={item.path}
              className={`mobile-nav-item${active ? ' active' : ''}`}
              style={{ color: active ? currentTheme.foreground : `${currentTheme.foreground}60` }}
            >
              <span className="mobile-nav-icon">{item.icon}</span>
              <span className="mobile-nav-label">{item.label}</span>
              {active && <span className="mobile-nav-dot" />}
            </Link>
          );
        })}

        {/* Shop button with popup */}
        <button
          className={`mobile-nav-item${shopActive || showShopPopup ? ' active' : ''}`}
          style={{ color: shopActive || showShopPopup ? currentTheme.foreground : `${currentTheme.foreground}60` }}
          onClick={() => setShowShopPopup(v => !v)}
        >
          <span className="mobile-nav-icon">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          </span>
          <span className="mobile-nav-label">Shop</span>
          {(shopActive || showShopPopup) && <span className="mobile-nav-dot" />}
        </button>
      </nav>
    </>
  );
}

export default function UserLayout({ children, title, hideMobileBottomNav, hideSiteChrome }: UserLayoutProps) {
  return (
    <ThemeProvider>
      <ToastProvider>
        <UserLayoutContent children={children} title={title} hideMobileBottomNav={hideMobileBottomNav} hideSiteChrome={hideSiteChrome} />
      </ToastProvider>
    </ThemeProvider>
  );
}
