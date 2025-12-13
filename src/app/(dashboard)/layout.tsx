'use client';

import { useEffect, useState, useCallback, useRef, useMemo, memo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/stores/authStore';
import { ModernSidebar } from '@/components/ui/modern-sidebar';
import { BreadcrumbNav } from '@/components/ui/breadcrumb-nav';
import dynamic from 'next/dynamic';

const CommandPalette = dynamic(
  () => import('@/components/ui/command-palette').then((mod) => ({ default: mod.CommandPalette })),
  { ssr: false }
);
const OfflineSyncIndicator = dynamic(
  () => import('@/components/pwa/offline-sync-indicator').then((mod) => ({ default: mod.OfflineSyncIndicator })),
  { ssr: false }
);

import { useCommandPalette } from '@/components/ui/command-palette';
import {
  LogOut,
  Menu,
  ChevronDown,
  Settings,
  Building2,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Bell,
  User,
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
import { useQueryClient } from '@tanstack/react-query';
import { useDeviceDetection } from '@/hooks/useDeviceDetection';

function DashboardLayoutComponent({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const { isAuthenticated, isInitialized, user, logout, initializeAuth } = useAuthStore();
  const { open: isSearchOpen, setOpen: setSearchOpen } = useCommandPalette();
  const deviceInfo = useDeviceDetection();

  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.localStorage.getItem('sidebar-collapsed') === 'true';
  });
  const [isScrolled, setIsScrolled] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const rafIdRef = useRef<number | null>(null);

  const getInitials = useCallback((name: string): string => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }, []);

  const userInitials = useMemo(() => user?.name ? getInitials(user.name) : 'U', [user?.name, getInitials]);

  // Initialize auth
  useEffect(() => {
    const storedSession = localStorage.getItem('auth-session');
    if (storedSession) {
      try {
        const sessionData = JSON.parse(storedSession);
        if (sessionData.isDemo && sessionData.isAuthenticated) {
          if (isAuthenticated && isInitialized) return;
        }
      } catch { /* Invalid session */ }
    }
    if (!isInitialized) initializeAuth();
  }, [isAuthenticated, isInitialized, initializeAuth]);

  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isInitialized, router]);

  // Sync sidebar state
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleStorageChange = () => {
      setIsSidebarCollapsed(window.localStorage.getItem('sidebar-collapsed') === 'true');
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Scroll detection
  useEffect(() => {
    const handleScroll = () => {
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = requestAnimationFrame(() => {
        setIsScrolled(window.scrollY > 10);
        rafIdRef.current = null;
      });
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    };
  }, []);

  const handleLogout = useCallback(() => {
    logout(() => {
      toast.success('Başarıyla çıkış yaptınız');
      router.push('/login');
    });
  }, [logout, router]);

  const toggleSidebar = useCallback(() => {
    const newState = !isSidebarCollapsed;
    setIsSidebarCollapsed(newState);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('sidebar-collapsed', String(newState));
      window.dispatchEvent(new Event('storage'));
    }
  }, [isSidebarCollapsed]);

  // Demo session check
  const [hasDemoSession, setHasDemoSession] = useState(false);
  useEffect(() => {
    try {
      const stored = localStorage.getItem('auth-session');
      if (stored) {
        const data = JSON.parse(stored);
        if (data.isDemo && data.isAuthenticated) setHasDemoSession(true);
      }
    } catch { /* Invalid */ }
  }, []);

  if ((!isInitialized || !isAuthenticated) && !hasDemoSession) {
    return <LoadingOverlay variant="pulse" fullscreen={true} text="Yükleniyor..." />;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Skip Link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[60] focus:px-4 focus:py-2 focus:bg-indigo-600 focus:text-white focus:rounded-lg focus:outline-none"
      >
        Ana içeriğe atla
      </a>

      {/* Header */}
      <header
        className={cn(
          'sticky top-0 z-50 h-16 bg-white dark:bg-slate-900 border-b transition-all duration-200',
          isScrolled 
            ? 'border-slate-200 dark:border-slate-800 shadow-sm' 
            : 'border-transparent'
        )}
      >
        <div className="flex h-full items-center justify-between px-4 lg:px-6">
          {/* Left Section */}
          <div className="flex items-center gap-3">
            {/* Mobile Menu */}
            <button
              className="lg:hidden p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800 transition-colors"
              onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
              aria-label="Menüyü aç"
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Desktop Sidebar Toggle */}
            <button
              className="hidden lg:flex p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800 transition-colors"
              onClick={toggleSidebar}
              aria-label={isSidebarCollapsed ? 'Menüyü genişlet' : 'Menüyü daralt'}
            >
              {isSidebarCollapsed ? (
                <PanelLeftOpen className="h-5 w-5" />
              ) : (
                <PanelLeftClose className="h-5 w-5" />
              )}
            </button>

            {/* Logo */}
            <Link href="/genel" className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-md shadow-indigo-500/20">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <span className="hidden md:block text-lg font-semibold text-slate-800 dark:text-white">
                Dernek Yönetim
              </span>
            </Link>
          </div>

          {/* Search Bar - Desktop */}
          <div className="hidden lg:flex flex-1 max-w-md mx-8">
            <button
              onClick={() => setSearchOpen(true)}
              className={cn(
                'w-full h-10 px-4 flex items-center gap-3 rounded-lg border transition-all',
                'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700',
                'text-slate-500 dark:text-slate-400 text-sm',
                'hover:bg-slate-100 dark:hover:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
              )}
            >
              <Search className="h-4 w-4" />
              <span className="flex-1 text-left">Hızlı arama...</span>
              <kbd className="hidden sm:inline-flex px-2 py-0.5 text-xs font-medium bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded">
                ⌘K
              </kbd>
            </button>
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-2">
            {/* Mobile Search */}
            <button
              onClick={() => setSearchOpen(true)}
              className="lg:hidden p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800 transition-colors"
            >
              <Search className="h-5 w-5" />
            </button>

            {/* Notifications */}
            <button className="p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800 transition-colors relative">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
            </button>

            {/* User Menu */}
            <Popover open={isUserMenuOpen} onOpenChange={setIsUserMenuOpen}>
              <PopoverTrigger asChild>
                <button className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                  <Avatar className="h-8 w-8 ring-2 ring-slate-200 dark:ring-slate-700">
                    <AvatarImage src={user?.avatar ?? undefined} alt={user?.name} />
                    <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-violet-600 text-white text-xs font-semibold">
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                  <ChevronDown className={cn(
                    'hidden sm:block h-4 w-4 text-slate-400 transition-transform duration-200',
                    isUserMenuOpen && 'rotate-180'
                  )} />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-0" align="end">
                {/* User Info */}
                <div className="p-4 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user?.avatar ?? undefined} />
                      <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-violet-600 text-white font-semibold">
                        {userInitials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-slate-900 dark:text-white truncate">
                        {user?.name || 'Kullanıcı'}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        {user?.email || ''}
                      </p>
                    </div>
                  </div>
                  {user?.role && (
                    <Badge variant="secondary" className="mt-3 text-xs">
                      {user.role}
                    </Badge>
                  )}
                </div>

                {/* Menu Items */}
                <div className="p-2">
                  <Link
                    href="/ayarlar/profil"
                    onClick={() => setIsUserMenuOpen(false)}
                    className="flex items-center gap-3 w-full px-3 py-2 text-sm text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <User className="h-4 w-4" />
                    Profilim
                  </Link>
                  <Link
                    href="/ayarlar"
                    onClick={() => setIsUserMenuOpen(false)}
                    className="flex items-center gap-3 w-full px-3 py-2 text-sm text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <Settings className="h-4 w-4" />
                    Ayarlar
                  </Link>
                  <Separator className="my-2" />
                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      handleLogout();
                    }}
                    className="flex items-center gap-3 w-full px-3 py-2 text-sm text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    Çıkış Yap
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

        {/* Sidebar Spacer */}
        <div
          className={cn(
            'hidden lg:block flex-shrink-0 transition-all duration-300',
            isSidebarCollapsed ? 'w-[68px]' : 'w-64'
          )}
        />

        {/* Main Content */}
        <main
          id="main-content"
          className="flex-1 min-w-0 min-h-[calc(100vh-4rem)]"
          tabIndex={-1}
        >
          <div className={cn(
            'mx-auto w-full',
            deviceInfo.isMobile ? 'p-4' : 'p-6 lg:p-8',
            'max-w-[1600px]'
          )}>
            <BreadcrumbNav />
            
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={pathname}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                <SuspenseBoundary loadingVariant="pulse" loadingText="">
                  {children}
                </SuspenseBoundary>
              </motion.div>
            </AnimatePresence>
          </div>
        </main>

        {/* Command Palette */}
        <CommandPalette open={isSearchOpen} onOpenChange={setSearchOpen} />
        
        {/* Offline Indicator */}
        <OfflineSyncIndicator />
      </div>
    </div>
  );
}

export default memo(DashboardLayoutComponent);
