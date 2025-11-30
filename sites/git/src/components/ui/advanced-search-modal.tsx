'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Search, Clock, Zap, ArrowRight, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SearchResult {
  id: string;
  title: string;
  description?: string;
  category: string;
  href: string;
  icon?: React.ReactNode;
}

interface AdvancedSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  results?: SearchResult[];
  onSearch?: (query: string) => Promise<SearchResult[]>;
}

const defaultSearchItems: SearchResult[] = [
  // İhtiyaç Sahipleri
  {
    id: '1',
    title: 'İhtiyaç Sahipleri',
    description: 'İhtiyaç sahiplerini görüntüle ve yönet',
    category: 'Yardım Yönetimi',
    href: '/yardim/ihtiyac-sahipleri',
  },
  {
    id: '2',
    title: 'Yardım Başvuruları',
    description: 'Yardım taleplerini incele ve işle',
    category: 'Yardım Yönetimi',
    href: '/yardim/basvurular',
  },
  {
    id: '3',
    title: 'Yardım Listesi',
    description: 'Verilen yardımların listesini görüntüle',
    category: 'Yardım Yönetimi',
    href: '/yardim/liste',
  },
  // Bağış Yönetimi
  {
    id: '4',
    title: 'Bağış Listesi',
    description: 'Tüm bağışları görüntüle',
    category: 'Bağış Yönetimi',
    href: '/bagis/liste',
  },
  {
    id: '5',
    title: 'Bağış Raporları',
    description: 'Bağış istatistikleri ve raporları',
    category: 'Bağış Yönetimi',
    href: '/bagis/raporlar',
  },
  {
    id: '6',
    title: 'Kumbara',
    description: 'Kumbara yönetimi',
    category: 'Bağış Yönetimi',
    href: '/bagis/kumbara',
  },
  // Burs Yönetimi
  {
    id: '7',
    title: 'Burs Başvuruları',
    description: 'Burs başvurusu işlemleri',
    category: 'Burs Yönetimi',
    href: '/burs/basvurular',
  },
  {
    id: '8',
    title: 'Öğrenciler',
    description: 'Burs alanların listesi',
    category: 'Burs Yönetimi',
    href: '/burs/ogrenciler',
  },
  // Mali Yönetim
  {
    id: '9',
    title: 'Mali Kontrol Paneli',
    description: 'Mali raporlar ve analizler',
    category: 'Mali Yönetim',
    href: '/financial-dashboard',
  },
  {
    id: '10',
    title: 'Gelir-Gider',
    description: 'Gelir ve gider kayıtları',
    category: 'Mali Yönetim',
    href: '/fon/gelir-gider',
  },
  // İş Yönetimi
  {
    id: '11',
    title: 'Görevler',
    description: 'Görev ve proje yönetimi',
    category: 'İş Yönetimi',
    href: '/is/gorevler',
  },
  {
    id: '12',
    title: 'Toplantılar',
    description: 'Toplantı planlaması ve yönetimi',
    category: 'İş Yönetimi',
    href: '/is/toplantilar',
  },
  // Kullanıcı Yönetimi
  {
    id: '13',
    title: 'Kullanıcı Yönetimi',
    description: 'Sistem kullanıcılarını yönet',
    category: 'Sistem',
    href: '/kullanici',
  },
  {
    id: '14',
    title: 'Ayarlar',
    description: 'Sistem ayarlarını düzenle',
    category: 'Sistem',
    href: '/settings',
  },
];

export function AdvancedSearchModal({
  isOpen,
  onClose,
  results = defaultSearchItems,
  onSearch,
}: AdvancedSearchModalProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [filteredResults, setFilteredResults] = useState<SearchResult[]>(results);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load recent searches
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('recent-searches');
      if (stored) {
        setRecentSearches(JSON.parse(stored).slice(0, 5));
      }
    }
  }, []);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Handle search
  const handleSearch = useCallback(
    async (q: string) => {
      setQuery(q);
      setSelectedIndex(0);

      if (!q.trim()) {
        setFilteredResults(results);
        return;
      }

      setIsLoading(true);

      try {
        let searchResults = results;

        if (onSearch) {
          searchResults = await onSearch(q);
        } else {
          // Default filtering
          const lowerQ = q.toLowerCase();
          searchResults = results.filter(
            (item) =>
              item.title.toLowerCase().includes(lowerQ) ||
              item.description?.toLowerCase().includes(lowerQ) ||
              item.category.toLowerCase().includes(lowerQ)
          );
        }

        setFilteredResults(searchResults);
      } finally {
        setIsLoading(false);
      }
    },
    [results, onSearch]
  );

  const handleSelectResult = (result: SearchResult) => {
    // Save to recent searches
    setRecentSearches((prev) => {
      const filtered = prev.filter((s) => s !== result.title);
      const updated = [result.title, ...filtered].slice(0, 5);
      localStorage.setItem('recent-searches', JSON.stringify(updated));
      return updated;
    });

    // Navigate
    router.push(result.href);
    onClose();
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) => (prev < filteredResults.length - 1 ? prev + 1 : prev));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (filteredResults[selectedIndex]) {
          handleSelectResult(filteredResults[selectedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        onClose();
        break;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden">
        <div className="bg-white">
          {/* Search Input */}
          <div className="border-b border-slate-200 p-4">
            <div className="flex items-center gap-3">
              <Search className="h-5 w-5 text-slate-400 shrink-0" />
              <input
                ref={inputRef}
                type="text"
                placeholder="Ara... (Sayfalar, görevler, kullanıcılar)"
                value={query}
                onChange={(e) => handleSearch(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-1 bg-transparent text-base outline-none text-slate-900 placeholder:text-slate-400"
              />
              {query && (
                <button
                  onClick={() => {
                    setQuery('');
                    setFilteredResults(results);
                  }}
                  className="p-1 hover:bg-slate-100 rounded-md transition-colors"
                  aria-label="Clear search"
                >
                  <X className="h-5 w-5 text-slate-400" />
                </button>
              )}
            </div>
          </div>

          {/* Results or Recent */}
          <div className="max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="p-8 text-center text-slate-500">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
              </div>
            ) : filteredResults.length > 0 ? (
              <div>
                {/* Group by category */}
                {!query && (
                  <div className="px-4 py-3">
                    <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                      Tüm Sayfalar
                    </h3>
                  </div>
                )}

                {filteredResults.map((result, index) => (
                  <button
                    key={result.id}
                    onClick={() => handleSelectResult(result)}
                    className={cn(
                      'w-full px-4 py-3 text-left transition-colors border-l-2',
                      index === selectedIndex
                        ? 'bg-blue-50 border-blue-600'
                        : 'border-transparent hover:bg-slate-50'
                    )}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900">{result.title}</p>
                        {result.description && (
                          <p className="text-xs text-slate-500 mt-0.5">{result.description}</p>
                        )}
                      </div>
                      <span className="text-xs text-slate-400 ml-2 shrink-0">
                        {result.category}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            ) : query ? (
              <div className="p-8 text-center">
                <Search className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-600 font-medium">Sonuç bulunamadı</p>
                <p className="text-sm text-slate-500 mt-1">
                  &quot;{query}&quot; ile ilgili bir sayfa yok
                </p>
              </div>
            ) : (
              <div className="p-4">
                {/* Recent searches */}
                {recentSearches.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 px-2">
                      <Clock className="h-3 w-3 inline mr-1" />
                      Son Aramalar
                    </h3>
                    <div className="space-y-1">
                      {recentSearches.map((search) => (
                        <button
                          key={search}
                          onClick={() => handleSearch(search)}
                          className="w-full px-3 py-2 text-left text-sm text-slate-600 hover:bg-slate-50 rounded-md transition-colors flex items-center justify-between"
                        >
                          <span>{search}</span>
                          <ArrowRight className="h-3 w-3" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quick actions */}
                <div>
                  <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 px-2">
                    <Zap className="h-3 w-3 inline mr-1" />
                    Hızlı Erişim
                  </h3>
                  <div className="space-y-1">
                    {results.slice(0, 5).map((result) => (
                      <button
                        key={result.id}
                        onClick={() => handleSelectResult(result)}
                        className="w-full px-3 py-2 text-left text-sm text-slate-600 hover:bg-slate-50 rounded-md transition-colors"
                      >
                        {result.title}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-slate-200 px-4 py-3 bg-slate-50 text-xs text-slate-500 space-y-1">
            <div className="flex gap-4">
              <div className="flex items-center gap-1">
                <kbd className="px-2 py-1 bg-white border border-slate-300 rounded text-xs font-semibold">
                  ↑↓
                </kbd>
                <span>Seç</span>
              </div>
              <div className="flex items-center gap-1">
                <kbd className="px-2 py-1 bg-white border border-slate-300 rounded text-xs font-semibold">
                  Enter
                </kbd>
                <span>Aç</span>
              </div>
              <div className="flex items-center gap-1">
                <kbd className="px-2 py-1 bg-white border border-slate-300 rounded text-xs font-semibold">
                  Esc
                </kbd>
                <span>Kapat</span>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function useAdvancedSearch() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return {
    isOpen,
    onOpen: () => {
      setIsOpen(true);
    },
    onClose: () => {
      setIsOpen(false);
    },
  };
}
