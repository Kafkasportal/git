'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/stores/authStore';
import { ModernSidebar } from '@/components/ui/modern-sidebar';
import { BreadcrumbNav } from '@/components/ui/breadcrumb-nav';
import { AnalyticsTrackerComponent } from '@/components/ui/analytics-tracker';
import { KeyboardShortcuts } from '@/components/ui/keyboard-shortcuts';
import { AdvancedSearchModal, useAdvancedSearch } from '@/components/ui/advanced-search-modal';
import {
  LogOut,
  Menu,
  ChevronDown,
  Settings,
  Building2,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { LoadingOverlay } from '@/components/ui/loading-overlay';
import { SuspenseBoundary } from '@/components/ui/suspense-boundary';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import logger from '@/lib/logger';
import { useQueryClient } from '@tanstack/react-query';
import { prefetchData } from '@/lib/cache-config';
import { CACHE_KEYS } from '@/lib/cache-config';
import { apiClient } from '@/lib/api/api-client';
import { PerformanceMonitor } from '@/lib/performance-monitor';
import { useDeviceDetection } from '@/hooks/useDeviceDetection';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const { isAuthenticated, isInitialized, user, logout, initializeAuth } = useAuthStore();
  const { isOpen: isSearchOpen, onClose: closeSearch } = useAdvancedSearch();
  const deviceInfo = useDeviceDetection();

  // Keyboard shortcuts
  const keyboardShortcuts = [
    {
      key: 's',
      ctrl: true,
      description: 'Ayarlar',
      callback: () => {
        router.push('/settings');
      },
    },
  ];

  // Performance monitoring
  const handlePerformanceMetrics = useCallback(
    (metrics: unknown) => {
      // Log performance metrics in development
      if (process.env.NODE_ENV === 'development') {
        logger.debug('Performance metrics', {
          route: pathname,
          ...(metrics as Record<string, unknown>),
        });
      }

      // You can send metrics to analytics service here
      // Example: sendToAnalytics(metrics);
    },
    [pathname]
  );

  // Memoized state management to prevent unnecessary re-renders
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.localStorage.getItem('sidebar-collapsed') === 'true';
  });
  const [isScrolled, setIsScrolled] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const prevPathnameRef = useRef<string | null>(null);
  const rafIdRef = useRef<number | null>(null);

  // Memoized helper functions to prevent recreation on each render
  const getInitials = useCallback((name: string): string => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }, []);

  const getRoleBadgeVariant = useCallback(
    (role?: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
      const normalized = (role || '').toLowerCase();
      if (normalized.includes('başkan')) return 'destructive';
      if (normalized.includes('yönetici') || normalized.includes('muhasebe')) return 'default';
      if (normalized.includes('gönüllü') || normalized.includes('üye')) return 'secondary';
      if (normalized.includes('izleyici') || normalized.includes('görüntüleyici')) return 'outline';
      return 'default';
    },
    []
  );

  // Initialize auth on mount (only once)
  useEffect(() => {
    if (isInitialized) {
      // Already initialized, skip
      return;
    }

    if (process.env.NODE_ENV === 'development') {
      logger.debug('Dashboard: Initializing auth', { isInitialized, isAuthenticated });
      logger.debug('Dashboard: LocalStorage check', {
        hasSession: !!localStorage.getItem('auth-session'),
      });
      logger.debug('Dashboard: Hydration status', {
        hydrated: useAuthStore.persist?.hasHydrated?.(),
      });
    }

    initializeAuth();

    if (process.env.NODE_ENV === 'development') {
      logger.debug('Dashboard: Auth initialization called');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      if (process.env.NODE_ENV === 'development') {
        logger.debug('Dashboard: Redirecting to login', { isInitialized, isAuthenticated });
      }
      router.push('/login');
    }
  }, [isAuthenticated, isInitialized, router]);

  // Sync sidebar collapsed state across tabs
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const handleStorageChange = () => {
      const stored = window.localStorage.getItem('sidebar-collapsed');
      setIsSidebarCollapsed(stored === 'true');

      if (process.env.NODE_ENV === 'development') {
        logger.debug('Dashboard: Sidebar state changed', { collapsed: stored === 'true' });
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Detect scroll for header shadow effect - OPTIMIZED
  useEffect(() => {
    const handleScroll = () => {
      // Cache the DOM queries
      const scrollY = window.scrollY;
      const threshold = 20;

      // Batch updates using requestAnimationFrame
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }

      rafIdRef.current = requestAnimationFrame(() => {
        const shouldShowShadow = scrollY > threshold;
        setIsScrolled(shouldShowShadow);
        rafIdRef.current = null;
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
    };
  }, []);

  const handleLogout = useCallback(() => {
    logout(() => {
      toast.success('Başarıyla çıkış yaptınız');
      router.push('/login');
    });
  }, [logout, router]);

  // Memoize callbacks to prevent infinite loops
  const handlePageSuspend = useCallback(() => {
    if (process.env.NODE_ENV === 'development') {
      logger.debug('Dashboard: Page suspended', { pathname });
    }
  }, [pathname]);

  const handlePageResume = useCallback(() => {
    if (process.env.NODE_ENV === 'development') {
      logger.debug('Dashboard: Page resumed', { pathname });
    }
  }, [pathname]);

  // Prefetch data based on route - OPTIMIZED
  useEffect(() => {
    if (!isAuthenticated || !isInitialized || pathname === prevPathnameRef.current) {
      return;
    }

    prevPathnameRef.current = pathname;

    // Prefetch data based on current route
    const prefetchRouteData = async () => {
      try {
        if (pathname.startsWith('/yardim/ihtiyac-sahipleri')) {
          await prefetchData(
            queryClient,
            [CACHE_KEYS.BENEFICIARIES],
            () => apiClient.beneficiaries.getBeneficiaries({ limit: 20 }),
            'BENEFICIARIES'
          );
        } else if (pathname.startsWith('/bagis/liste') || pathname.startsWith('/bagis')) {
          await prefetchData(
            queryClient,
            [CACHE_KEYS.DONATIONS],
            () => apiClient.donations.getDonations({ limit: 20 }),
            'DONATIONS'
          );
        } else if (pathname.startsWith('/yardim/basvurular')) {
          // Prefetch aid applications if endpoint exists
          await prefetchData(
            queryClient,
            [CACHE_KEYS.AID_APPLICATIONS],
            async () => {
              const response = await fetch('/api/aid-applications?limit=20');
              return response.json();
            },
            'AID_REQUESTS'
          );
        } else if (pathname.startsWith('/is/gorevler')) {
          await prefetchData(
            queryClient,
            [CACHE_KEYS.TASKS],
            async () => {
              const response = await fetch('/api/tasks?limit=20');
              return response.json();
            },
            'TASKS'
          );
        } else if (pathname.startsWith('/is/toplantilar')) {
          await prefetchData(
            queryClient,
            [CACHE_KEYS.MEETINGS],
            async () => {
              const response = await fetch('/api/meetings?limit=20');
              return response.json();
            },
            'MEETINGS'
          );
        } else if (pathname.startsWith('/is/yonetim')) {
          await Promise.allSettled([
            prefetchData(
              queryClient,
              [CACHE_KEYS.MEETINGS],
              async () => {
                const response = await fetch('/api/meetings?limit=10');
                return response.json();
              },
              'MEETINGS'
            ),
            prefetchData(
              queryClient,
              [CACHE_KEYS.MEETING_DECISIONS],
              async () => {
                const response = await fetch('/api/meeting-decisions?limit=10');
                return response.json();
              },
              'MEETING_DECISIONS'
            ),
            prefetchData(
              queryClient,
              [CACHE_KEYS.MEETING_ACTION_ITEMS],
              async () => {
                const response = await fetch('/api/meeting-action-items?limit=20');
                return response.json();
              },
              'MEETING_ACTION_ITEMS'
            ),
          ]);
        }
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          logger.debug('Dashboard: Prefetch error', { pathname, error });
        }
      }
    };

    // Debounce prefetch to avoid too many requests
    const timeoutId = setTimeout(prefetchRouteData, 100);
    return () => clearTimeout(timeoutId);
  }, [pathname, isAuthenticated, isInitialized, queryClient]);

  if (!isInitialized || !isAuthenticated) {
    if (process.env.NODE_ENV === 'development') {
      logger.debug('Dashboard: Loading state', { isInitialized, isAuthenticated });
    }
    return <LoadingOverlay variant="pulse" fullscreen={true} text="Yükleniyor..." />;
  }

  const newLocal = 'bg-linear-to-br from-blue-600 to-blue-700 text-white';
  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-slate-50/50">
      {/* Skip to main content link for keyboard navigation */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-60 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded-md focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        Ana içeriğe atla
      </a>

      {/* Premium Header */}
      <header
        className={cn(
          'sticky top-0 z-50 h-16 bg-white/95 backdrop-blur-md border-b border-slate-200/60',
          'transition-all duration-300 ease-out',
          isScrolled && 'shadow-lg shadow-slate-200/50 bg-white/98'
        )}
      >
        <div className="flex h-full items-center justify-between px-4 lg:px-6">
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden p-2 rounded-lg hover:bg-slate-100/80 transition-all duration-200 active:scale-95"
              onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
              aria-label="Toggle menu"
            >
              <Menu className="h-5 w-5 text-slate-600" />
            </button>
            <button
              className="hidden lg:flex p-2 rounded-lg hover:bg-slate-100/80 transition-all duration-200 active:scale-95"
              onClick={() => {
                const newState = !isSidebarCollapsed;
                setIsSidebarCollapsed(newState);
                if (typeof window !== 'undefined') {
                  window.localStorage.setItem('sidebar-collapsed', String(newState));
                  window.dispatchEvent(new Event('storage'));
                }
              }}
              aria-label={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {isSidebarCollapsed ? (
                <PanelLeftOpen className="h-5 w-5 text-slate-600" />
              ) : (
                <PanelLeftClose className="h-5 w-5 text-slate-600" />
              )}
            </button>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-linear-to-br from-blue-600 via-blue-600 to-blue-700 flex items-center justify-center shadow-md shadow-blue-500/20">
                <Building2 className="w-4.5 h-4.5 text-white" />
              </div>
              <h1 className="hidden md:block text-lg font-semibold text-slate-800 tracking-tight">
                Dernek Yönetim Sistemi
              </h1>
            </div>
          </div>

          {/* Search Bar */}
          <div className="hidden lg:flex flex-1 max-w-md mx-4">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Ara..."
                className="w-full h-9 pl-9 pr-3 text-sm bg-slate-100/80 border border-slate-200/60 rounded-lg text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 focus:bg-white transition-all duration-200"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Popover open={isUserMenuOpen} onOpenChange={setIsUserMenuOpen}>
              <PopoverTrigger asChild>
                <button
                  className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-slate-100/80 transition-all duration-200 active:scale-95"
                  aria-label="Kullanıcı menüsünü aç"
                >
                  <Avatar size="sm" className="h-8 w-8 ring-2 ring-slate-200">
                    <AvatarImage src={user?.avatar ?? undefined} alt={user?.name} />
                    <AvatarFallback className="bg-linear-to-br from-blue-600 to-blue-700 text-white text-xs font-semibold">
                      {user?.name ? getInitials(user.name) : 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <ChevronDown
                    className={cn(
                      'h-4 w-4 text-slate-500 transition-transform duration-200',
                      isUserMenuOpen && 'rotate-180'
                    )}
                  />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-0 border-slate-200/60 shadow-xl" align="end">
                <div className="p-4 border-b border-slate-100 bg-linear-to-br from-slate-50 to-white">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-11 w-11 ring-2 ring-slate-200">
                      <AvatarImage src={user?.avatar ?? undefined} />
                      <AvatarFallback className={newLocal}>
                        {user?.name ? getInitials(user.name) : 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-slate-900 truncate">
                        {user?.name || 'Kullanıcı'}
                      </p>
                      <p className="text-xs text-slate-500 truncate mt-0.5">{user?.email || ''}</p>
                      <Badge variant={getRoleBadgeVariant(user?.role)} className="text-xs mt-2">
                        {user?.role || 'Viewer'}
                      </Badge>
                    </div>
                  </div>
                </div>
                <Separator />
                <div className="p-1.5">
                  <Link
                    href="/settings"
                    prefetch={true}
                    onClick={() => setIsUserMenuOpen(false)}
                    className="flex items-center gap-2.5 w-full px-3 py-2 text-sm rounded-lg hover:bg-slate-100/80 transition-colors duration-200 text-slate-700"
                  >
                    <Settings className="h-4 w-4" />
                    <span>Ayarlar</span>
                  </Link>
                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      handleLogout();
                    }}
                    className="flex items-center gap-2.5 w-full px-3 py-2 text-sm rounded-lg hover:bg-red-50/80 hover:text-red-600 transition-colors duration-200 text-left text-slate-700"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Çıkış Yap</span>
                  </button>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <SuspenseBoundary loadingVariant="spinner">
          <ModernSidebar
            isMobileOpen={isMobileSidebarOpen}
            onMobileToggle={() => setIsMobileSidebarOpen(false)}
          />
        </SuspenseBoundary>

        {/* Spacer for fixed sidebar - Hidden on mobile */}
        <div
          className={cn(
            'hidden lg:block transition-all duration-300',
            isSidebarCollapsed ? 'w-16' : 'w-64'
          )}
        />

        {/* Main Content - OPTIMIZED PAGE TRANSITIONS */}
        <main
          id="main-content"
          className="flex-1 w-full min-w-0 min-h-[calc(100vh-4rem)] overflow-x-hidden"
          tabIndex={-1}
          data-device-type={deviceInfo.deviceType}
          data-screen-size={deviceInfo.screenSize}
        >
          <div
            className={cn(
              'max-w-[95%] lg:max-w-[98%] xl:max-w-[1600px] mx-auto w-full',
              deviceInfo.isMobile ? 'p-3' : deviceInfo.isTablet ? 'p-4 md:p-6' : 'p-4 lg:p-6'
            )}
          >
            <BreadcrumbNav />
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={pathname}
                initial={{ opacity: 0, y: 8, scale: 0.995 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.995 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                style={{
                  willChange: 'transform, opacity',
                  backfaceVisibility: 'hidden',
                }}
              >
                <SuspenseBoundary
                  loadingVariant="pulse"
                  loadingText=""
                  onSuspend={handlePageSuspend}
                  onResume={handlePageResume}
                >
                  {children}
                </SuspenseBoundary>
              </motion.div>
            </AnimatePresence>
          </div>
        </main>

        {/* Advanced Search Modal */}
        <AdvancedSearchModal isOpen={isSearchOpen} onClose={closeSearch} />

        {/* Analytics & Performance Monitoring */}
        <AnalyticsTrackerComponent
          enabled={true}
          trackCoreWebVitals={true}
          trackUserInteractions={true}
        />

        <KeyboardShortcuts shortcuts={keyboardShortcuts} enabled={true} showHelpDialog={true} />

        <PerformanceMonitor
          enableWebVitals={true}
          enableCustomMetrics={true}
          onMetrics={handlePerformanceMetrics}
          routeName={pathname}
        />
      </div>
    </div>
  );
}
