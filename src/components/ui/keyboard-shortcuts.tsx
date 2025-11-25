'use client';

import { useEffect, useState } from 'react';
import { useCallback } from 'react';
import { Command } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Shortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean;
  callback: () => void;
  description: string;
}

interface KeyboardShortcutsProps {
  shortcuts: Shortcut[];
  enabled?: boolean;
  showHelpDialog?: boolean;
}

const commonShortcuts = [
  {
    key: '?',
    description: 'Klavye kısayollarını göster',
  },
  {
    key: 'Ctrl + K',
    description: 'Ara',
  },
  {
    key: 'Ctrl + /',
    description: 'Bu iletişim kutusunu aç',
  },
];

export function KeyboardShortcuts({
  shortcuts,
  enabled = true,
  showHelpDialog = true,
}: KeyboardShortcutsProps) {
  const [showDialog, setShowDialog] = useState(false);

  const matchesShortcut = useCallback((event: KeyboardEvent, shortcut: Shortcut): boolean => {
    const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();
    const ctrlMatch = shortcut.ctrl
      ? event.ctrlKey || event.metaKey
      : !event.ctrlKey && !event.metaKey;
    const shiftMatch = shortcut.shift ? event.shiftKey : !event.shiftKey;
    const altMatch = shortcut.alt ? event.altKey : !event.altKey;

    return keyMatch && ctrlMatch && shiftMatch && altMatch;
  }, []);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      // Check for help shortcut
      if (showHelpDialog && (event.key === '?' || (event.ctrlKey && event.key === '/'))) {
        event.preventDefault();
        setShowDialog(true);
        return;
      }

      // Check user shortcuts
      for (const shortcut of shortcuts) {
        if (matchesShortcut(event, shortcut)) {
          event.preventDefault();
          shortcut.callback();
          return;
        }
      }
    },
    [enabled, shortcuts, matchesShortcut, showHelpDialog]
  );

  useEffect(() => {
    if (!enabled) return;

    window.addEventListener('keydown', handleKeyDown, { passive: false });
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [enabled, handleKeyDown]);

  if (!showHelpDialog) {
    return null;
  }

  return (
    <Dialog open={showDialog} onOpenChange={setShowDialog}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Command className="h-5 w-5" />
            Klavye Kısayolları
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Common shortcuts */}
          <div>
            <h3 className="text-sm font-semibold text-slate-900 mb-3">Genel</h3>
            <div className="space-y-2">
              {commonShortcuts.map((item) => (
                <ShortcutItem key={item.key} shortcut={item.key} description={item.description} />
              ))}
            </div>
          </div>

          {/* User shortcuts */}
          {shortcuts.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-slate-900 mb-3">Uygulama Kısayolları</h3>
              <div className="space-y-2">
                {shortcuts.map((shortcut) => {
                  const keys: string[] = [];
                  if (shortcut.ctrl) keys.push('Ctrl');
                  if (shortcut.alt) keys.push('Alt');
                  if (shortcut.shift) keys.push('Shift');
                  keys.push(shortcut.key.toUpperCase());

                  return (
                    <ShortcutItem
                      key={`${keys.join('+')}${shortcut.description}`}
                      shortcut={keys.join(' + ')}
                      description={shortcut.description}
                    />
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
          <Button variant="outline" size="sm" onClick={() => setShowDialog(false)}>
            Kapat
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface ShortcutItemProps {
  shortcut: string;
  description: string;
}

function ShortcutItem({ shortcut, description }: ShortcutItemProps) {
  return (
    <div className="flex items-center justify-between py-2">
      <p className="text-sm text-slate-700">{description}</p>
      <kbd
        className={cn(
          'px-2 py-1 text-xs font-semibold text-slate-700',
          'bg-slate-100 border border-slate-300 rounded-md',
          'shadow-sm'
        )}
      >
        {shortcut}
      </kbd>
    </div>
  );
}

export function useKeyboardShortcuts(shortcuts: Shortcut[]) {
  const [isOpen, setIsOpen] = useState(false);

  return {
    shortcuts,
    showHelpDialog: true,
    enabled: true,
    isOpen,
    setIsOpen,
  };
}
