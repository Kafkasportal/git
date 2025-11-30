'use client';

import { useState, useEffect, startTransition } from 'react';
import { Moon, Sun, Monitor } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/components/ui/theme-provider';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

interface ThemeSwitcherProps {
  className?: string;
  variant?: 'toggle' | 'dropdown';
  size?: 'sm' | 'default' | 'lg';
}

export function ThemeSwitcher({ 
  className,
  variant = 'toggle',
  size = 'default',
}: ThemeSwitcherProps) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    startTransition(() => setMounted(true));
  }, []);

  if (!mounted) {
    return null;
  }

  const sizeClasses = {
    sm: 'h-8 w-8',
    default: 'h-9 w-9',
    lg: 'h-10 w-10',
  };

  const iconSizes = {
    sm: 'h-4 w-4',
    default: 'h-5 w-5',
    lg: 'h-6 w-6',
  };

  // Simple toggle between light and dark
  if (variant === 'toggle') {
    return (
      <button
        onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
        className={cn(
          'inline-flex items-center justify-center rounded-lg',
          'transition-all duration-200 ease-in-out',
          'hover:bg-slate-100 dark:hover:bg-slate-800',
          'text-slate-600 dark:text-slate-400',
          'active:scale-95',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
          sizeClasses[size],
          className
        )}
        aria-label={`${resolvedTheme === 'dark' ? 'Açık' : 'Koyu'} temaya geç`}
        title={`${resolvedTheme === 'dark' ? 'Açık' : 'Koyu'} tema`}
      >
        {resolvedTheme === 'dark' ? (
          <Sun className={cn(iconSizes[size], 'text-yellow-500')} />
        ) : (
          <Moon className={cn(iconSizes[size], 'text-slate-700')} />
        )}
      </button>
    );
  }

  // Dropdown with system option
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            'focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
            sizeClasses[size],
            className
          )}
          aria-label="Tema seç"
        >
          {resolvedTheme === 'dark' ? (
            <Moon className={cn(iconSizes[size], 'text-slate-400')} />
          ) : (
            <Sun className={cn(iconSizes[size], 'text-yellow-500')} />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[140px]">
        <DropdownMenuItem 
          onClick={() => setTheme('light')}
          className={cn(
            'flex items-center gap-2 cursor-pointer',
            theme === 'light' && 'bg-primary/10 text-primary'
          )}
        >
          <Sun className="h-4 w-4" />
          <span>Açık</span>
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => setTheme('dark')}
          className={cn(
            'flex items-center gap-2 cursor-pointer',
            theme === 'dark' && 'bg-primary/10 text-primary'
          )}
        >
          <Moon className="h-4 w-4" />
          <span>Koyu</span>
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => setTheme('system')}
          className={cn(
            'flex items-center gap-2 cursor-pointer',
            theme === 'system' && 'bg-primary/10 text-primary'
          )}
        >
          <Monitor className="h-4 w-4" />
          <span>Sistem</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export { useTheme } from '@/components/ui/theme-provider';
