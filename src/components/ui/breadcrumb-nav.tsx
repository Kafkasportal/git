'use client';

import { memo } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BreadcrumbItem {
  label: string;
  href: string;
  current?: boolean;
}

const PATH_TRANSLATIONS: Record<string, string> = {
  yardim: 'Yardım Yönetimi',
  'ihtiyac-sahipleri': 'İhtiyaç Sahipleri',
  basvurular: 'Başvurular',
  liste: 'Liste',
  bagis: 'Bağış Yönetimi',
  raporlar: 'Raporlar',
  kumbara: 'Kumbara',
  burs: 'Burs Yönetimi',
  ogrenciler: 'Öğrenciler',
  yetim: 'Yetim Burs',
  financial: 'Mali Raporlar',
  'financial-dashboard': 'Mali Kontrol Paneli',
  'gelir-gider': 'Gelir-Gider',
  fon: 'Fon Yönetimi',
  genel: 'Genel Dashboard',
  is: 'İş Yönetimi',
  gorevler: 'Görevler',
  toplantilar: 'Toplantılar',
  yonetim: 'Yönetim',
  kullanici: 'Kullanıcı Yönetimi',
  mesaj: 'Mesajlaşma',
  'kurum-ici': 'Kurum İçi',
  toplu: 'Toplu Mesaj',
  partner: 'İş Ortakları',
  ayarlar: 'Ayarlar',
  parametreler: 'Parametreler',
  settings: 'Ayarlar',
  profil: 'Profil',
};

function BreadcrumbNavComponent() {
  const pathname = usePathname();

  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    const paths = pathname.split('/').filter((p) => p);
    const relevantPaths = paths.filter((p) => p !== 'dashboard' && p !== '');

    if (pathname === '/genel' || relevantPaths.length === 0) {
      return [];
    }

    const items: BreadcrumbItem[] = [
      { label: 'Anasayfa', href: '/genel' },
    ];

    let currentPath = '';
    relevantPaths.forEach((path, index) => {
      currentPath += `/${path}`;
      const label = PATH_TRANSLATIONS[path] || path.replace(/-/g, ' ');

      items.push({
        label: label.charAt(0).toUpperCase() + label.slice(1),
        href: currentPath,
        current: index === relevantPaths.length - 1,
      });
    });

    return items.length > 1 ? items : [];
  };

  const breadcrumbs = generateBreadcrumbs();

  if (breadcrumbs.length === 0) {
    return null;
  }

  return (
    <nav
      aria-label="Breadcrumb navigation"
      className="mb-6 px-1"
      role="navigation"
    >
      <ol className="flex items-center gap-0 text-sm">
        {breadcrumbs.map((item, index) => (
          <li key={`${item.href}-${index}`} className="flex items-center">
            {/* Separator */}
            {index > 0 && (
              <ChevronRight
                className="h-4 w-4 text-muted-foreground/50 mx-1 flex-shrink-0"
                aria-hidden="true"
              />
            )}

            {/* Home link */}
            {(() => {
              if (index === 0) {
                return (
                  <Link
                    href={item.href}
                    className={cn(
                      'inline-flex items-center gap-1.5 px-2 py-1.5 rounded-md transition-all duration-150',
                      'text-muted-foreground hover:text-primary',
                      'hover:bg-primary/5',
                      'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1'
                    )}
                    aria-label="Anasayfa (Dashboard)"
                  >
                    <Home className="h-4 w-4 flex-shrink-0" />
                    <span className="sr-only">{item.label}</span>
                  </Link>
                );
              }
              
              if (item.current) {
                return (
                  <span
                    className="px-2 py-1.5 text-foreground font-bold bg-muted rounded-md"
                    aria-current="page"
                  >
                    {item.label}
                  </span>
                );
              }
              
              return (
                <Link
                  href={item.href}
                  className={cn(
                    'px-2 py-1.5 rounded-md transition-all duration-150',
                    'text-muted-foreground hover:text-primary',
                    'hover:bg-primary/5',
                    'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1'
                  )}
                >
                  {item.label}
                </Link>
              );
            })()}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export const BreadcrumbNav = memo(BreadcrumbNavComponent);
