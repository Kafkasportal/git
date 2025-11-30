'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useDeviceDetection } from '@/hooks/useDeviceDetection';
import {
  Home,
  Users,
  Gift,
  CheckSquare,
  Menu,
  Search,
  Bell,
  Plus,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  badge?: number;
}

const mainNavItems: NavItem[] = [
  { href: '/genel', label: 'Ana Sayfa', icon: <Home className="h-5 w-5" /> },
  { href: '/yardim/ihtiyac-sahipleri', label: 'Yardım', icon: <Users className="h-5 w-5" /> },
  { href: '/bagis/liste', label: 'Bağış', icon: <Gift className="h-5 w-5" /> },
  { href: '/is/gorevler', label: 'Görevler', icon: <CheckSquare className="h-5 w-5" /> },
];

interface MobileBottomNavProps {
  className?: string;
  onSearchClick?: () => void;
  onNotificationClick?: () => void;
  notificationCount?: number;
}

export function MobileBottomNav({
  className,
  onSearchClick,
  onNotificationClick,
  notificationCount = 0,
}: MobileBottomNavProps) {
  const pathname = usePathname();
  const { isMobile } = useDeviceDetection();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  // Hide on scroll down, show on scroll up
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  if (!isMobile) return null;

  const isActive = (href: string) => {
    if (href === '/genel') return pathname === '/genel' || pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Spacer to prevent content from being hidden behind nav */}
      <div className="h-16 md:hidden" />
      
      {/* Bottom Navigation */}
      <nav
        className={cn(
          'fixed bottom-0 left-0 right-0 z-50',
          'bg-background/95 backdrop-blur-lg border-t border-border',
          'transition-transform duration-300 ease-in-out',
          'safe-area-bottom',
          isVisible ? 'translate-y-0' : 'translate-y-full',
          className
        )}
        role="navigation"
        aria-label="Ana menü"
      >
        <div className="flex items-center justify-around h-16 px-2">
          {/* Main nav items */}
          {mainNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center gap-0.5 flex-1 py-2',
                'text-xs font-medium transition-colors',
                'active:scale-95',
                isActive(item.href)
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
              aria-current={isActive(item.href) ? 'page' : undefined}
            >
              <span className={cn(
                'p-1.5 rounded-xl transition-colors',
                isActive(item.href) && 'bg-primary/10'
              )}>
                {item.icon}
              </span>
              <span className="truncate max-w-[60px]">{item.label}</span>
            </Link>
          ))}

          {/* More menu trigger */}
          <button
            onClick={() => setIsMenuOpen(true)}
            className={cn(
              'flex flex-col items-center justify-center gap-0.5 flex-1 py-2',
              'text-xs font-medium text-muted-foreground hover:text-foreground',
              'active:scale-95 transition-all'
            )}
            aria-label="Daha fazla seçenek"
          >
            <span className="p-1.5 rounded-xl">
              <Menu className="h-5 w-5" />
            </span>
            <span>Daha</span>
          </button>
          
          {/* Menu Dialog */}
          <Dialog open={isMenuOpen} onOpenChange={setIsMenuOpen}>
            <DialogContent className="sm:max-w-md fixed bottom-0 top-auto translate-y-0 rounded-t-2xl rounded-b-none max-h-[60vh]">
              <DialogHeader className="pb-4">
                <DialogTitle className="flex items-center justify-between">
                  Menü
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => setIsMenuOpen(false)}
                    className="h-8 w-8"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </DialogTitle>
              </DialogHeader>
              <MobileMenuContent
                onSearchClick={() => {
                  setIsMenuOpen(false);
                  onSearchClick?.();
                }}
                onNotificationClick={() => {
                  setIsMenuOpen(false);
                  onNotificationClick?.();
                }}
                notificationCount={notificationCount}
                onClose={() => setIsMenuOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
      </nav>
    </>
  );
}

interface MobileMenuContentProps {
  onSearchClick?: () => void;
  onNotificationClick?: () => void;
  notificationCount?: number;
  onClose?: () => void;
}

function MobileMenuContent({
  onSearchClick,
  onNotificationClick,
  notificationCount = 0,
  onClose,
}: MobileMenuContentProps) {
  const additionalNavItems = [
    { href: '/is/toplantilar', label: 'Toplantılar', icon: '📅' },
    { href: '/financial-dashboard', label: 'Mali Durum', icon: '💰' },
    { href: '/burs/ogrenciler', label: 'Burs Öğrencileri', icon: '🎓' },
    { href: '/kullanici', label: 'Kullanıcılar', icon: '👥' },
    { href: '/analitik', label: 'Analitik', icon: '📊' },
    { href: '/settings', label: 'Ayarlar', icon: '⚙️' },
  ];

  return (
    <div className="space-y-6">
      {/* Quick actions */}
      <div className="flex gap-3">
        <Button
          variant="outline"
          className="flex-1 h-12"
          onClick={onSearchClick}
        >
          <Search className="h-4 w-4 mr-2" />
          Ara
        </Button>
        <Button
          variant="outline"
          className="relative h-12 px-4"
          onClick={onNotificationClick}
        >
          <Bell className="h-4 w-4" />
          {notificationCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center">
              {notificationCount > 9 ? '9+' : notificationCount}
            </span>
          )}
        </Button>
      </div>

      {/* Navigation grid */}
      <div className="grid grid-cols-3 gap-3">
        {additionalNavItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={onClose}
            className={cn(
              'flex flex-col items-center justify-center gap-2 p-4',
              'bg-muted/50 rounded-xl',
              'hover:bg-muted transition-colors',
              'active:scale-95'
            )}
          >
            <span className="text-2xl">{item.icon}</span>
            <span className="text-xs font-medium text-center">{item.label}</span>
          </Link>
        ))}
      </div>

      {/* Quick add button */}
      <Button
        className="w-full h-12"
        onClick={() => {
          onClose?.();
          // Trigger add action
        }}
      >
        <Plus className="h-4 w-4 mr-2" />
        Hızlı Ekle
      </Button>
    </div>
  );
}

/**
 * Floating Action Button for mobile
 */
export function MobileFAB({
  onClick,
  icon = <Plus className="h-6 w-6" />,
  label = 'Ekle',
  className,
}: {
  onClick?: () => void;
  icon?: React.ReactNode;
  label?: string;
  className?: string;
}) {
  const { isMobile } = useDeviceDetection();

  if (!isMobile) return null;

  return (
    <button
      onClick={onClick}
      className={cn(
        'fixed bottom-20 right-4 z-40',
        'h-14 w-14 rounded-full',
        'bg-primary text-primary-foreground shadow-lg',
        'flex items-center justify-center',
        'active:scale-95 transition-transform',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
        className
      )}
      aria-label={label}
    >
      {icon}
    </button>
  );
}
