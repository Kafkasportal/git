'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { motion, AnimatePresence } from 'framer-motion';
import { navigationModules, type NavigationModule } from '@/config/navigation';
import { useAuthStore } from '@/stores/authStore';
import { MODULE_PERMISSIONS } from '@/types/permissions';

interface ModernSidebarProps {
  isMobileOpen?: boolean;
  onMobileToggle?: () => void;
  className?: string;
}

export function ModernSidebar({
  isMobileOpen = false,
  onMobileToggle,
  className,
}: ModernSidebarProps) {
  const pathname = usePathname();
  const userPermissions = useAuthStore((state) => state.user?.permissions ?? []);

  // Check if user has wildcard permission (full access)
  const hasWildcardPermission = userPermissions.includes('*' as any);
  
  // DEV MODE: If no permissions, show all modules (for development/testing)
  const hasNoPermissions = userPermissions.length === 0;
  const effectivePermissions = hasWildcardPermission || hasNoPermissions
    ? Object.values(MODULE_PERMISSIONS)
    : userPermissions;

  const [expandedModules, setExpandedModules] = useState<string[]>([]);
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('sidebar-collapsed');
      return stored === 'true';
    }
    return false;
  });

  useEffect(() => {
    const handleStorageChange = () => {
      const stored = localStorage.getItem('sidebar-collapsed');
      if (stored !== null) {
        setIsCollapsed(stored === 'true');
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const toggleModule = (moduleId: string) => {
    setExpandedModules((prev) =>
      prev.includes(moduleId) ? prev.filter((id) => id !== moduleId) : [...prev, moduleId]
    );
  };

  const isActive = (href: string) => pathname === href;
  const hasActiveSubpage = (module: NavigationModule) =>
    module.subPages.some((sub) => isActive(sub.href));

  return (
    <TooltipProvider delayDuration={100}>
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
            onClick={onMobileToggle}
          />
        )}
      </AnimatePresence>

      <aside
        className={cn(
          'fixed left-0 top-16 h-[calc(100vh-4rem)] bg-slate-800 border-r border-slate-700/50 z-40 transition-all duration-300 ease-in-out flex flex-col overflow-hidden',
          isCollapsed ? 'w-16' : 'w-64',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
          className
        )}
      >
        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 scrollbar-hide">
          {navigationModules.map((module) => {
            if (module.permission && !effectivePermissions.includes(module.permission)) {
              return null;
            }

            const visibleSubPages = module.subPages.filter(
              (subPage) => !subPage.permission || effectivePermissions.includes(subPage.permission)
            );

            if (visibleSubPages.length === 0) {
              return null;
            }

            const isExpanded = expandedModules.includes(module.id);
            const moduleWithVisiblePages: NavigationModule = {
              ...module,
              subPages: visibleSubPages,
            };
            const active = hasActiveSubpage(moduleWithVisiblePages);
            const hasSubPages = visibleSubPages.length > 1;

            return (
              <div key={module.id} className="px-1.5 mb-1">
                {hasSubPages ? (
                  <button
                    onClick={() => toggleModule(module.id)}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                      active
                        ? 'bg-blue-600/20 text-blue-300 border border-blue-500/30 shadow-sm'
                        : 'text-slate-300 hover:bg-slate-700/50 hover:text-slate-100',
                      isCollapsed && 'justify-center'
                    )}
                  >
                    <module.icon
                      className={cn('w-5 h-5 flex-shrink-0', isCollapsed && 'w-6 h-6')}
                    />
                    {!isCollapsed && (
                      <>
                        <span className="flex-1 text-left">{module.name}</span>
                        <ChevronRight
                          className={cn(
                            'w-4 h-4 transition-transform duration-200',
                            isExpanded && 'rotate-90'
                          )}
                        />
                      </>
                    )}
                  </button>
                ) : (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Link
                        href={visibleSubPages[0].href}
                        prefetch={true}
                        onClick={onMobileToggle}
                        className={cn(
                          'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                          isActive(visibleSubPages[0].href)
                            ? 'bg-blue-600/20 text-blue-300 border border-blue-500/30 shadow-sm'
                            : 'text-slate-300 hover:bg-slate-700/50 hover:text-slate-100',
                          isCollapsed && 'justify-center'
                        )}
                      >
                        <module.icon
                          className={cn('w-5 h-5 flex-shrink-0', isCollapsed && 'w-6 h-6')}
                        />
                        {!isCollapsed && <span>{module.name}</span>}
                      </Link>
                    </TooltipTrigger>
                    {isCollapsed && <TooltipContent side="right">{module.name}</TooltipContent>}
                  </Tooltip>
                )}

                {/* Sub Pages */}
                {hasSubPages && !isCollapsed && (
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="ml-8 mt-1.5 space-y-1">
                          {visibleSubPages.map((subPage) => (
                            <Link
                              key={subPage.href}
                              href={subPage.href}
                              prefetch={true}
                              onClick={onMobileToggle}
                              className={cn(
                                'block px-3 py-2 rounded-md text-sm transition-colors duration-200',
                                isActive(subPage.href)
                                  ? 'bg-blue-600/20 text-blue-300 border-l-2 border-blue-500'
                                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/30'
                              )}
                            >
                              {subPage.name}
                            </Link>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                )}
              </div>
            );
          })}
        </nav>

        {/* Footer */}
        {(effectivePermissions.includes(MODULE_PERMISSIONS.SETTINGS) || hasNoPermissions) && (
          <div className="border-t border-slate-700/50 p-3">
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  href="/settings"
                  prefetch={true}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                    isActive('/settings')
                      ? 'bg-blue-600/20 text-blue-300 border border-blue-500/30 shadow-sm'
                      : 'text-slate-300 hover:bg-slate-700/50 hover:text-slate-100',
                    isCollapsed && 'justify-center'
                  )}
                >
                  <Settings className="w-5 h-5 flex-shrink-0" />
                  {!isCollapsed && <span>Ayarlar</span>}
                </Link>
              </TooltipTrigger>
              {isCollapsed && <TooltipContent side="right">Ayarlar</TooltipContent>}
            </Tooltip>
          </div>
        )}
      </aside>
    </TooltipProvider>
  );
}
