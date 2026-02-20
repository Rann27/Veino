import { Link, router, usePage } from '@inertiajs/react';
import { ReactNode, useState } from 'react';
import { ThemeProvider, useTheme, defaultThemes } from '@/Contexts/ThemeContext';

// ─── SVG Icon Components ──────────────────────────────────────────────────────
const Icon = ({ d, className = 'w-5 h-5' }: { d: string | string[]; className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
    {Array.isArray(d)
      ? d.map((path, i) => <path key={i} strokeLinecap="round" strokeLinejoin="round" d={path} />)
      : <path strokeLinecap="round" strokeLinejoin="round" d={d} />}
  </svg>
);

const Icons = {
  dashboard: 'M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z',
  series: 'M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25',
  ebook: 'M10.5 1.5H8.25A2.25 2.25 0 0 0 6 3.75v16.5a2.25 2.25 0 0 0 2.25 2.25h7.5A2.25 2.25 0 0 0 18 20.25V3.75a2.25 2.25 0 0 0-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 8.25h3m-3 3.75h3m-3 3.75h3M6.75 20.25v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v3.375',
  users: 'M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z',
  payment: 'M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Z',
  transaction: 'M9 14.25l6-6m4.5-3.493V21.75l-3.75-1.5-3.75 1.5-3.75-1.5-3.75 1.5V4.757c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0c1.1.128 1.907 1.077 1.907 2.185ZM9.75 9h.008v.008H9.75V9Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm4.125 4.5h.008v.008h-.008V13.5Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z',
  blog: 'M16.862 4.487l1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10',
  voucher: 'M16.5 6v.75a3 3 0 0 1-3 3h-6a3 3 0 0 1-3-3V6m16.5 0a.75.75 0 0 0-.75-.75H3.75a.75.75 0 0 0-.75.75m16.5 0v11.25A2.25 2.25 0 0 1 18 19.5H6a2.25 2.25 0 0 1-2.25-2.25V6',
  ads: 'M10.34 15.84c-.688-.06-1.386-.09-2.09-.09H7.5a4.5 4.5 0 1 1 0-9h.75c.704 0 1.402-.03 2.09-.09m0 9.18c.253.962.584 1.892.985 2.783.247.55.06 1.21-.463 1.511l-.657.38c-.551.318-1.26.117-1.527-.461a20.845 20.845 0 0 1-1.44-4.282m3.102.069a18.03 18.03 0 0 1-.59-4.59c0-1.586.205-3.124.59-4.59m0 9.18a23.848 23.848 0 0 1 8.835 2.535M10.34 6.66a23.847 23.847 0 0 1 8.835-2.535m0 0A23.74 23.74 0 0 1 18 4.5c0 2.308-.584 4.492-1.625 6.396m0 0A18.048 18.048 0 0 1 10.34 15.84',
  monitoring: ['M7.5 14.25v2.25m3-4.5v4.5m3-6.75v6.75m3-9v9M6 20.25h12A2.25 2.25 0 0 0 20.25 18V6A2.25 2.25 0 0 0 18 3.75H6A2.25 2.25 0 0 0 3.75 6v12A2.25 2.25 0 0 0 6 20.25Z'],
  misc: 'M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z',
  sun: 'M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z',
  moon: 'M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z',
  logout: 'M8.25 9V5.25A2.25 2.25 0 0 1 10.5 3h6a2.25 2.25 0 0 1 2.25 2.25v13.5A2.25 2.25 0 0 1 16.5 21h-6a2.25 2.25 0 0 1-2.25-2.25V15m-3 0-3-3m0 0 3-3m-3 3H15',
  chevronRight: 'M8.25 4.5l7.5 7.5-7.5 7.5',
  home: 'M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25',
};

// ─── Colour Helpers ───────────────────────────────────────────────────────────
function hexToRgb(hex: string) {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return { r, g, b };
}
function isLight(hex: string) {
  const { r, g, b } = hexToRgb(hex);
  return (r * 0.299 + g * 0.587 + b * 0.114) / 255 > 0.5;
}
function withAlpha(hex: string, alpha: number) {
  try {
    const { r, g, b } = hexToRgb(hex);
    return `rgba(${r},${g},${b},${alpha})`;
  } catch {
    return `rgba(0,0,0,${alpha})`;
  }
}

// ─── Menu Config ─────────────────────────────────────────────────────────────
const menuSections = [
  {
    label: 'Overview',
    items: [{ href: '/admin', label: 'Dashboard', icon: Icons.dashboard, exact: true }],
  },
  {
    label: 'Content',
    items: [
      { href: '/admin/series', label: 'Series', icon: Icons.series },
      { href: '/admin/ebookseries', label: 'Ebook Series', icon: Icons.ebook },
      { href: '/admin/blog', label: 'Blog', icon: Icons.blog },
    ],
  },
  {
    label: 'Commerce',
    items: [
      { href: '/admin/payment-management', label: 'Payment', icon: Icons.payment },
      { href: '/admin/transaction-history', label: 'Transactions', icon: Icons.transaction },
      { href: '/admin/voucher', label: 'Voucher', icon: Icons.voucher },
      { href: '/admin/advertisement-management', label: 'Ads', icon: Icons.ads },
    ],
  },
  {
    label: 'Community',
    items: [
      { href: '/admin/user-management', label: 'Users', icon: Icons.users },
      { href: '/admin/monitoring', label: 'Monitoring', icon: Icons.monitoring },
    ],
  },
  {
    label: 'System',
    items: [{ href: '/admin/misc', label: 'Misc', icon: Icons.misc }],
  },
];

// ─── Admin Layout Inner (uses theme) ─────────────────────────────────────────
interface AdminLayoutProps {
  children: ReactNode;
  title?: string;
}

function AdminLayoutContent({ children, title }: AdminLayoutProps) {
  const { currentTheme, setTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [themeMenuOpen, setThemeMenuOpen] = useState(false);
  const { auth } = usePage<any>().props;

  const light = isLight(currentTheme.background);

  // Derived colours
  const sidebarBg    = light ? withAlpha(currentTheme.foreground, 0.04) : withAlpha(currentTheme.foreground, 0.07);
  const headerBg     = currentTheme.background + 'f2';
  const borderColor  = withAlpha(currentTheme.foreground, 0.1);
  const mutedText    = withAlpha(currentTheme.foreground, 0.45);
  const hoverBg      = withAlpha(currentTheme.foreground, 0.07);
  const activeBg     = light ? 'rgba(217,119,6,0.12)' : 'rgba(251,191,36,0.15)';
  const activeText   = light ? '#b45309' : '#fbbf24';
  const activeBorder = light ? '#d97706' : '#f59e0b';

  const handleLogout = () => router.post('/logout');

  const isActive = (href: string, exact = false) => {
    const p = window.location.pathname;
    return exact ? p === href : (p === href || p.startsWith(href + '/'));
  };

  const getUserInitials = (name: string) =>
    name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="min-h-screen" style={{ backgroundColor: currentTheme.background, color: currentTheme.foreground }}>

      {/* ── Header ──────────────────────────────────────────────────── */}
      <header
        className="fixed top-0 left-0 right-0 z-40 h-14 backdrop-blur-md border-b"
        style={{ backgroundColor: headerBg, borderColor }}
      >
        <div className="flex items-center justify-between h-full px-4">
          {/* Left: burger + brand */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(v => !v)}
              className="p-2 rounded-lg transition-colors"
              style={{ color: mutedText }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = hoverBg)}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            </button>

            <Link href="/admin" className="flex items-center gap-2">
              <span className="text-sm font-bold tracking-widest uppercase" style={{ color: activeText, letterSpacing: '0.15em' }}>
                Veinovel
              </span>
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded" style={{ backgroundColor: activeBg, color: activeText }}>
                ADMIN
              </span>
            </Link>
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-2">
            {title && (
              <span className="hidden md:block text-xs mr-2" style={{ color: mutedText }}>{title}</span>
            )}

            {/* Theme picker */}
            <div className="relative">
              <button
                onClick={() => setThemeMenuOpen(v => !v)}
                className="p-2 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-medium"
                style={{ color: mutedText }}
                title="Switch theme"
              >
                <Icon d={light ? Icons.sun : Icons.moon} className="w-4 h-4" />
                <span className="hidden sm:block">{currentTheme.name}</span>
              </button>

              {themeMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setThemeMenuOpen(false)} />
                  <div
                    className="absolute right-0 top-full mt-1 z-50 rounded-xl shadow-2xl border p-2 w-52"
                    style={{ backgroundColor: currentTheme.background, borderColor }}
                  >
                    <p className="text-[10px] font-semibold uppercase tracking-widest px-2 pb-2" style={{ color: mutedText }}>
                      Theme
                    </p>
                    {defaultThemes.map(t => (
                      <button
                        key={t.name}
                        onClick={() => { setTheme(t); setThemeMenuOpen(false); }}
                        className="flex items-center gap-2.5 w-full px-2 py-2 rounded-lg text-left text-sm"
                        style={{
                          color: currentTheme.name === t.name ? activeText : currentTheme.foreground,
                          backgroundColor: currentTheme.name === t.name ? activeBg : 'transparent',
                        }}
                      >
                        <span
                          className="w-4 h-4 rounded-full border flex-shrink-0"
                          style={{ backgroundColor: t.background, borderColor: t.foreground + '40' }}
                        />
                        {t.name}
                        {currentTheme.name === t.name && (
                          <svg className="w-3.5 h-3.5 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
                          </svg>
                        )}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* View site */}
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg border"
              style={{ color: mutedText, borderColor }}
            >
              <Icon d={Icons.home} className="w-3.5 h-3.5" />
              Site
            </a>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium ml-1"
              style={{ color: currentTheme.background, backgroundColor: activeText }}
            >
              <Icon d={Icons.logout} className="w-3.5 h-3.5" />
              <span className="hidden sm:block">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── Sidebar ──────────────────────────────────────────────────── */}
      <aside
        className="fixed top-14 left-0 bottom-0 z-30 transition-all duration-300 ease-in-out overflow-hidden border-r"
        style={{ width: sidebarOpen ? 220 : 0, backgroundColor: sidebarBg, borderColor }}
      >
        <div className="h-full overflow-y-auto py-4 px-2" style={{ width: 220 }}>
          <nav className="space-y-5">
            {menuSections.map(section => (
              <div key={section.label}>
                <p className="text-[10px] font-semibold uppercase tracking-widest px-3 mb-1" style={{ color: mutedText }}>
                  {section.label}
                </p>
                <div className="space-y-0.5">
                  {section.items.map(item => {
                    const active = isActive(item.href, item.exact);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 border-l-2"
                        style={{
                          color: active ? activeText : currentTheme.foreground,
                          backgroundColor: active ? activeBg : 'transparent',
                          borderLeftColor: active ? activeBorder : 'transparent',
                        }}
                        onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.backgroundColor = hoverBg; }}
                        onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; }}
                      >
                        <Icon d={item.icon as any} className="w-4 h-4 flex-shrink-0" />
                        <span className="whitespace-nowrap">{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          {/* Admin info */}
          {auth?.user && (
            <div className="mt-6 mx-1 p-3 rounded-xl border" style={{ borderColor, backgroundColor: withAlpha(currentTheme.foreground, 0.04) }}>
              <div className="flex items-center gap-2.5">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                  style={{ backgroundColor: activeText + '25', color: activeText }}
                >
                  {getUserInitials(auth.user.display_name || auth.user.email || 'A')}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold truncate" style={{ color: currentTheme.foreground }}>
                    {auth.user.display_name || 'Admin'}
                  </p>
                  <p className="text-[10px] truncate" style={{ color: mutedText }}>{auth.user.email}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 lg:hidden"
          style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Main Content ──────────────────────────────────────────────── */}
      <main
        className="pt-14 transition-all duration-300 ease-in-out min-h-screen"
        style={{ marginLeft: sidebarOpen ? 220 : 0 }}
      >
        {title && (
          <div className="px-6 py-3.5 border-b flex items-center gap-2 text-sm" style={{ borderColor }}>
            <Link href="/admin" className="hover:underline" style={{ color: mutedText }}>Admin</Link>
            <svg className="w-3.5 h-3.5" style={{ color: mutedText }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
            <span style={{ color: currentTheme.foreground, fontWeight: 600 }}>{title}</span>
          </div>
        )}
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}

// ─── Public Export (wraps with ThemeProvider) ─────────────────────────────────
export default function AdminLayout(props: AdminLayoutProps) {
  return (
    <ThemeProvider>
      <AdminLayoutContent {...props} />
    </ThemeProvider>
  );
}
