'use client';

import { useEffect, useState, useCallback, useRef, useMemo, memo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/stores/authStore';
import { ModernSidebar } from '@/components/ui/modern-sidebar';
import { BreadcrumbNav } from '@/components/ui/breadcrumb-nav';
import { DashboardHeader } from '@/components/layouts/DashboardHeader';
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
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { LoadingOverlay } from '@/components/ui/loading-overlay';
import { SuspenseBoundary } from '@/components/ui/suspense-boundary';
import { useDeviceDetection } from '@/hooks/useDeviceDetection';

function DashboardLayoutComponent({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
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
      <DashboardHeader
        user={user}
        userInitials={userInitials}
        isScrolled={isScrolled}
        isSidebarCollapsed={isSidebarCollapsed}
        isMobileSidebarOpen={isMobileSidebarOpen}
        isUserMenuOpen={isUserMenuOpen}
        onToggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
        onToggleSidebar={toggleSidebar}
        onOpenSearch={() => setSearchOpen(true)}
        onUserMenuChange={setIsUserMenuOpen}
        onLogout={handleLogout}
      />

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
