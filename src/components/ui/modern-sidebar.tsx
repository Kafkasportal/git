'use client';

import { useState, useEffect, memo, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Settings, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { motion, AnimatePresence } from 'framer-motion';
import { navigationModules, type NavigationModule } from '@/config/navigation';
import { useAuthStore } from '@/stores/authStore';
import { MODULE_PERMISSIONS } from '@/types/permissions';

// Helper function to find active module ID from pathname
function getActiveModuleId(pathname: string): string | null {
  const activeModule = navigationModules.find(m =>
    m.subPages.some(sp => pathname.startsWith(sp.href))
  );
  return activeModule?.id ?? null;
}

interface ModernSidebarProps {
  className?: string;
}

function ModernSidebarComponent({
  className,
}: ModernSidebarProps) {
  const pathname = usePathname();
  const userPermissions = useAuthStore((state) => state.user?.permissions ?? []);

  const hasWildcardPermission = userPermissions.includes('*' as never);
  const hasNoPermissions = userPermissions.length === 0;
  const effectivePermissions = hasWildcardPermission || hasNoPermissions
    ? Object.values(MODULE_PERMISSIONS)
    : userPermissions;

  // Track the active module from pathname
  const activeModuleId = getActiveModuleId(pathname);
  const previousPathRef = useRef(pathname);

  // Initialize with active module already expanded
  const [expandedModules, setExpandedModules] = useState<string[]>(() => {
    if (typeof window === 'undefined') return [];
    const activeId = getActiveModuleId(pathname);
    return activeId ? [activeId] : [];
  });

  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('sidebar-collapsed') === 'true';
    }
    return false;
  });

  // Auto-expand active module when navigating to a new path
  // This responds to external navigation events from Next.js router
  useEffect(() => {
    // Only expand when pathname actually changes (navigation event)
    if (pathname !== previousPathRef.current) {
      previousPathRef.current = pathname;
      if (activeModuleId && !expandedModules.includes(activeModuleId)) {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- Responding to router navigation
        setExpandedModules(prev => [...prev, activeModuleId]);
      }
    }
  }, [pathname, activeModuleId, expandedModules]);

  useEffect(() => {
    const handleStorageChange = () => {
      const stored = localStorage.getItem('sidebar-collapsed');
      if (stored !== null) {
        setIsCollapsed(stored === 'true');
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const toggleModule = (moduleId: string) => {
    setExpandedModules(prev =>
      prev.includes(moduleId)
        ? prev.filter(id => id !== moduleId)
        : [...prev, moduleId]
    );
  };

  const isActive = (href: string) => pathname === href;
  const isModuleActive = (module: NavigationModule) =>
    module.subPages.some(sub => pathname.startsWith(sub.href));

  return (
    <TooltipProvider delayDuration={100}>
      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-16 h-[calc(100vh-4rem)] z-40',
          'bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800',
          'transition-all duration-300 ease-out flex flex-col',
          isCollapsed ? 'w-[68px]' : 'w-64',
          className
        )}
      >
        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700">
          <div className="space-y-1">
            {navigationModules.map((module) => {
              if (module.permission && !effectivePermissions.includes(module.permission)) {
                return null;
              }

              const visibleSubPages = module.subPages.filter(
                (subPage) => !subPage.permission || effectivePermissions.includes(subPage.permission)
              );

              if (visibleSubPages.length === 0) return null;

              const isExpanded = expandedModules.includes(module.id);
              const moduleActive = isModuleActive({ ...module, subPages: visibleSubPages });
              const hasSubPages = visibleSubPages.length > 1;
              const Icon = module.icon;

              return (
                <div key={module.id}>
                  {/* Module Header */}
                  {hasSubPages ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => toggleModule(module.id)}
                          className={cn(
                            'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium',
                            'transition-all duration-200',
                            moduleActive
                              ? 'bg-teal-50 dark:bg-teal-500/10 text-teal-600 dark:text-teal-400'
                              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200',
                            isCollapsed && 'justify-center px-2'
                          )}
                        >
                          <Icon className={cn(
                            'flex-shrink-0 transition-colors',
                            isCollapsed ? 'w-5 h-5' : 'w-[18px] h-[18px]',
                            moduleActive && 'text-teal-500 dark:text-teal-400'
                          )} />
                          {!isCollapsed && (
                            <>
                              <span className="flex-1 text-left truncate">{module.name}</span>
                              <ChevronDown className={cn(
                                'w-4 h-4 text-slate-400 transition-transform duration-200',
                                isExpanded && 'rotate-180'
                              )} />
                            </>
                          )}
                        </button>
                      </TooltipTrigger>
                      {isCollapsed && (
                        <TooltipContent side="right" className="font-medium">
                          {module.name}
                        </TooltipContent>
                      )}
                    </Tooltip>
                  ) : (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Link
                          href={visibleSubPages[0].href}
                          prefetch={true}
                          className={cn(
                            'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium',
                            'transition-all duration-200',
                            isActive(visibleSubPages[0].href)
                              ? 'bg-teal-50 dark:bg-teal-500/10 text-teal-600 dark:text-teal-400'
                              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200',
                            isCollapsed && 'justify-center px-2'
                          )}
                        >
                          <Icon className={cn(
                            'flex-shrink-0',
                            isCollapsed ? 'w-5 h-5' : 'w-[18px] h-[18px]'
                          )} />
                          {!isCollapsed && <span className="truncate">{module.name}</span>}
                        </Link>
                      </TooltipTrigger>
                      {isCollapsed && (
                        <TooltipContent side="right" className="font-medium">
                          {module.name}
                        </TooltipContent>
                      )}
                    </Tooltip>
                  )}

                  {/* Sub Pages */}
                  {hasSubPages && !isCollapsed && (
                    <AnimatePresence initial={false}>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="ml-4 mt-1 pl-4 border-l border-slate-200 dark:border-slate-700 space-y-0.5">
                            {visibleSubPages.map((subPage) => (
                              <Link
                                key={subPage.href}
                                href={subPage.href}
                                prefetch={true}
                                className={cn(
                                  'block px-3 py-2 rounded-md text-sm transition-all duration-150',
                                  isActive(subPage.href)
                                    ? 'bg-teal-50 dark:bg-teal-500/10 text-teal-600 dark:text-teal-400 font-medium'
                                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50'
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
          </div>
        </nav>

        {/* Footer - Settings */}
        {(effectivePermissions.includes(MODULE_PERMISSIONS.SETTINGS) || hasNoPermissions) && (
          <div className="border-t border-slate-200 dark:border-slate-800 p-3">
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  href="/ayarlar"
                  prefetch={true}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium',
                    'transition-all duration-200',
                    pathname.startsWith('/ayarlar')
                      ? 'bg-teal-50 dark:bg-teal-500/10 text-teal-600 dark:text-teal-400'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200',
                    isCollapsed && 'justify-center px-2'
                  )}
                >
                  <Settings className={cn('flex-shrink-0', isCollapsed ? 'w-5 h-5' : 'w-[18px] h-[18px]')} />
                  {!isCollapsed && <span>Ayarlar</span>}
                </Link>
              </TooltipTrigger>
              {isCollapsed && (
                <TooltipContent side="right" className="font-medium">
                  Ayarlar
                </TooltipContent>
              )}
            </Tooltip>
          </div>
        )}
      </aside>
    </TooltipProvider>
  );
}

export const ModernSidebar = memo(ModernSidebarComponent);
