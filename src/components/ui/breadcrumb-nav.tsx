'use client';

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
  'performance-monitoring': 'Performans İzleme',
};

export function BreadcrumbNav() {
  const pathname = usePathname();

  // Generate breadcrumb items from pathname
  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    const paths = pathname.split('/').filter((p) => p);

    // Remove 'dashboard' or similar prefixes
    const relevantPaths = paths.filter((p) => p !== 'dashboard' && p !== '');

    // If we're on the home/genel page, don't show breadcrumbs
    if (pathname === '/genel' || relevantPaths.length === 0) {
      return [];
    }

    const items: BreadcrumbItem[] = [
      {
        label: 'Anasayfa',
        href: '/genel',
      },
    ];

    let currentPath = '';
    relevantPaths.forEach((path, index) => {
      currentPath += `/${path}`;
      const label = PATH_TRANSLATIONS[path] || path.replace(/-/g, ' ');

      if (index === relevantPaths.length - 1) {
        items.push({
          label: label.charAt(0).toUpperCase() + label.slice(1),
          href: currentPath,
          current: true,
        });
      } else {
        items.push({
          label: label.charAt(0).toUpperCase() + label.slice(1),
          href: currentPath,
        });
      }
    });

    return items.length > 1 ? items : [];
  };

  const breadcrumbs = generateBreadcrumbs();

  if (breadcrumbs.length === 0) {
    return null;
  }

  return (
    <nav aria-label="Breadcrumb" className="mb-4">
      <ol className="flex items-center gap-1 text-sm">
        {breadcrumbs.map((item, index) => (
          <li key={`${item.href}-${index}`} className="flex items-center gap-1">
            {index === 0 ? (
              <Link
                href={item.href}
                className={cn(
                  'inline-flex items-center gap-1.5 px-2 py-1 rounded-md transition-colors duration-200',
                  'hover:bg-slate-100/60 text-slate-600 hover:text-slate-900'
                )}
                aria-label="Anasayfa"
              >
                <Home className="h-4 w-4" />
              </Link>
            ) : item.current ? (
              <span className="px-2 py-1 text-slate-900 font-medium" aria-current="page">
                {item.label}
              </span>
            ) : (
              <>
                <ChevronRight className="h-4 w-4 text-slate-400" aria-hidden="true" />
                <Link
                  href={item.href}
                  className={cn(
                    'px-2 py-1 rounded-md transition-colors duration-200',
                    'hover:bg-slate-100/60 text-slate-600 hover:text-slate-900'
                  )}
                >
                  {item.label}
                </Link>
              </>
            )}

            {index === breadcrumbs.length - 1 && index !== 0 && (
              <ChevronRight className="h-4 w-4 text-slate-400 ml-1" aria-hidden="true" />
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
