'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Command } from 'cmdk';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import {
  Search,
  Users,
  Gift,
  Calendar,
  CheckSquare,
  Settings,
  Home,
  FileText,
  DollarSign,
  GraduationCap,
  Clock,
  ArrowRight,
  Loader2,
  X,
  Command as CommandIcon,
} from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';

// Search result types
export interface SearchResult {
  id: string;
  type: 'beneficiary' | 'donation' | 'task' | 'meeting' | 'user' | 'page';
  title: string;
  subtitle?: string;
  href: string;
  icon?: React.ReactNode;
  metadata?: Record<string, unknown>;
}

// Navigation items
const navigationItems: SearchResult[] = [
  { id: 'nav-1', type: 'page', title: 'Ana Sayfa', subtitle: 'Dashboard', href: '/genel', icon: <Home className="h-4 w-4" /> },
  { id: 'nav-2', type: 'page', title: 'İhtiyaç Sahipleri', subtitle: 'Yardım yönetimi', href: '/yardim/ihtiyac-sahipleri', icon: <Users className="h-4 w-4" /> },
  { id: 'nav-3', type: 'page', title: 'Bağış Listesi', subtitle: 'Bağış yönetimi', href: '/bagis/liste', icon: <Gift className="h-4 w-4" /> },
  { id: 'nav-4', type: 'page', title: 'Görevler', subtitle: 'İş yönetimi', href: '/is/gorevler', icon: <CheckSquare className="h-4 w-4" /> },
  { id: 'nav-5', type: 'page', title: 'Toplantılar', subtitle: 'Takvim', href: '/is/toplantilar', icon: <Calendar className="h-4 w-4" /> },
  { id: 'nav-6', type: 'page', title: 'Kullanıcılar', subtitle: 'Kullanıcı yönetimi', href: '/kullanici', icon: <Users className="h-4 w-4" /> },
  { id: 'nav-7', type: 'page', title: 'Mali Dashboard', subtitle: 'Finansal raporlar', href: '/financial-dashboard', icon: <DollarSign className="h-4 w-4" /> },
  { id: 'nav-8', type: 'page', title: 'Gelir-Gider', subtitle: 'Finansal işlemler', href: '/fon/gelir-gider', icon: <FileText className="h-4 w-4" /> },
  { id: 'nav-9', type: 'page', title: 'Burs Öğrencileri', subtitle: 'Burs yönetimi', href: '/burs/ogrenciler', icon: <GraduationCap className="h-4 w-4" /> },
  { id: 'nav-10', type: 'page', title: 'Ayarlar', subtitle: 'Sistem ayarları', href: '/settings', icon: <Settings className="h-4 w-4" /> },
  { id: 'nav-11', type: 'page', title: 'Analitik', subtitle: 'İstatistikler', href: '/analitik', icon: <FileText className="h-4 w-4" /> },
  { id: 'nav-12', type: 'page', title: 'Denetim Kayıtları', subtitle: 'Audit logs', href: '/denetim-kayitlari', icon: <FileText className="h-4 w-4" /> },
];

// Icon mapping by type
const typeIcons: Record<string, React.ReactNode> = {
  beneficiary: <Users className="h-4 w-4 text-blue-500" />,
  donation: <Gift className="h-4 w-4 text-green-500" />,
  task: <CheckSquare className="h-4 w-4 text-orange-500" />,
  meeting: <Calendar className="h-4 w-4 text-purple-500" />,
  user: <Users className="h-4 w-4 text-cyan-500" />,
  page: <FileText className="h-4 w-4 text-slate-500" />,
};

// Type labels
const typeLabels: Record<string, string> = {
  beneficiary: 'İhtiyaç Sahibi',
  donation: 'Bağış',
  task: 'Görev',
  meeting: 'Toplantı',
  user: 'Kullanıcı',
  page: 'Sayfa',
};

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const router = useRouter();
  const [query, setQuery] = React.useState('');
  const [results, setResults] = React.useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [recentSearches, setRecentSearches] = React.useState<SearchResult[]>([]);
  const inputRef = React.useRef<HTMLInputElement>(null);
  
  const debouncedQuery = useDebounce(query, 300);

  // Load recent searches from localStorage
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('command-palette-recent');
      if (stored) {
        try {
          setRecentSearches(JSON.parse(stored).slice(0, 5));
        } catch {
          // Ignore parse errors
        }
      }
    }
  }, []);

  // Focus input when opened
  React.useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  // Reset when closed
  React.useEffect(() => {
    if (!open) {
      setQuery('');
      setResults([]);
    }
  }, [open]);

  // Search API
  React.useEffect(() => {
    if (!debouncedQuery.trim()) {
      setResults([]);
      return;
    }

    const searchData = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(debouncedQuery)}&limit=10`);
        if (response.ok) {
          const data = await response.json();
          setResults(data.results || []);
        }
      } catch (error) {
        console.error('Search error:', error);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    };

    searchData();
  }, [debouncedQuery]);

  // Filter navigation items based on query
  const filteredNavigation = React.useMemo(() => {
    if (!query.trim()) return navigationItems;
    const lowerQuery = query.toLowerCase();
    return navigationItems.filter(
      item => 
        item.title.toLowerCase().includes(lowerQuery) ||
        item.subtitle?.toLowerCase().includes(lowerQuery)
    );
  }, [query]);

  // Handle selection
  const handleSelect = React.useCallback((result: SearchResult) => {
    // Save to recent
    const newRecent = [result, ...recentSearches.filter(r => r.id !== result.id)].slice(0, 5);
    setRecentSearches(newRecent);
    if (typeof window !== 'undefined') {
      localStorage.setItem('command-palette-recent', JSON.stringify(newRecent));
    }
    
    // Navigate
    router.push(result.href);
    onOpenChange(false);
  }, [recentSearches, router, onOpenChange]);

  // Clear recent
  const clearRecent = React.useCallback(() => {
    setRecentSearches([]);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('command-palette-recent');
    }
  }, []);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden bg-white dark:bg-slate-900 shadow-2xl border-0">
        <Command className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-slate-500 [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-input-wrapper]_svg]:h-5 [&_[cmdk-input-wrapper]_svg]:w-5 [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-3 [&_[cmdk-item]_svg]:h-5 [&_[cmdk-item]_svg]:w-5">
          {/* Search Input */}
          <div className="flex items-center border-b px-4" cmdk-input-wrapper="">
            <Search className="mr-2 h-5 w-5 shrink-0 text-slate-400" />
            <Command.Input
              ref={inputRef}
              placeholder="Sayfa, kişi, bağış veya görev ara..."
              value={query}
              onValueChange={setQuery}
              className="flex h-12 w-full bg-transparent py-3 text-base outline-none placeholder:text-slate-400 disabled:cursor-not-allowed disabled:opacity-50"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="p-1 hover:bg-slate-100 rounded-md transition-colors"
              >
                <X className="h-4 w-4 text-slate-400" />
              </button>
            )}
            {isLoading && (
              <Loader2 className="h-5 w-5 text-slate-400 animate-spin ml-2" />
            )}
          </div>

          <Command.List className="max-h-[400px] overflow-y-auto overflow-x-hidden">
            <Command.Empty className="py-12 text-center">
              <Search className="h-12 w-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-600 font-medium">Sonuç bulunamadı</p>
              <p className="text-sm text-slate-500 mt-1">
                Farklı anahtar kelimeler deneyin
              </p>
            </Command.Empty>

            {/* Data Results */}
            {results.length > 0 && (
              <Command.Group heading="Sonuçlar">
                {results.map((result) => (
                  <Command.Item
                    key={result.id}
                    value={`${result.type}-${result.title}`}
                    onSelect={() => handleSelect(result)}
                    className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-slate-100 data-[selected=true]:bg-slate-100 transition-colors"
                  >
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-slate-100">
                      {result.icon || typeIcons[result.type]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">
                        {result.title}
                      </p>
                      {result.subtitle && (
                        <p className="text-xs text-slate-500 truncate">
                          {result.subtitle}
                        </p>
                      )}
                    </div>
                    <span className="text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded">
                      {typeLabels[result.type]}
                    </span>
                    <ArrowRight className="h-4 w-4 text-slate-400" />
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {/* Recent Searches */}
            {!query && recentSearches.length > 0 && (
              <Command.Group heading={
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Son Aramalar
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      clearRecent();
                    }}
                    className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    Temizle
                  </button>
                </div>
              }>
                {recentSearches.map((result) => (
                  <Command.Item
                    key={`recent-${result.id}`}
                    value={`recent-${result.title}`}
                    onSelect={() => handleSelect(result)}
                    className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-slate-100 data-[selected=true]:bg-slate-100 transition-colors"
                  >
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-slate-100">
                      {result.icon || typeIcons[result.type]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">
                        {result.title}
                      </p>
                    </div>
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {/* Navigation */}
            <Command.Group heading="Sayfalar">
              {filteredNavigation.map((item) => (
                <Command.Item
                  key={item.id}
                  value={`page-${item.title}`}
                  onSelect={() => handleSelect(item)}
                  className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-slate-100 data-[selected=true]:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-slate-100">
                    {item.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">
                      {item.title}
                    </p>
                    {item.subtitle && (
                      <p className="text-xs text-slate-500 truncate">
                        {item.subtitle}
                      </p>
                    )}
                  </div>
                  <ArrowRight className="h-4 w-4 text-slate-400" />
                </Command.Item>
              ))}
            </Command.Group>
          </Command.List>

          {/* Footer */}
          <div className="flex items-center justify-between border-t px-4 py-3 bg-slate-50">
            <div className="flex items-center gap-4 text-xs text-slate-500">
              <div className="flex items-center gap-1">
                <kbd className="px-2 py-1 bg-white border border-slate-200 rounded text-xs font-semibold shadow-sm">
                  ↑↓
                </kbd>
                <span>Gezin</span>
              </div>
              <div className="flex items-center gap-1">
                <kbd className="px-2 py-1 bg-white border border-slate-200 rounded text-xs font-semibold shadow-sm">
                  Enter
                </kbd>
                <span>Seç</span>
              </div>
              <div className="flex items-center gap-1">
                <kbd className="px-2 py-1 bg-white border border-slate-200 rounded text-xs font-semibold shadow-sm">
                  Esc
                </kbd>
                <span>Kapat</span>
              </div>
            </div>
            <div className="flex items-center gap-1 text-xs text-slate-400">
              <CommandIcon className="h-3 w-3" />
              <span>Command Palette</span>
            </div>
          </div>
        </Command>
      </DialogContent>
    </Dialog>
  );
}

// Hook to control command palette
export function useCommandPalette() {
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return {
    open,
    setOpen,
    toggle: () => setOpen((prev) => !prev),
  };
}

