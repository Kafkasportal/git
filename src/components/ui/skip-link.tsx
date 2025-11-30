'use client';

import { cn } from '@/lib/utils';

interface SkipLinkProps {
  targetId: string;
  children?: React.ReactNode;
  className?: string;
}

/**
 * Skip link component for accessibility
 * Allows keyboard users to skip to main content
 */
export function SkipLink({ 
  targetId, 
  children = 'İçeriğe atla',
  className,
}: SkipLinkProps) {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    const target = document.getElementById(targetId);
    if (target) {
      target.focus();
      target.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <a
      href={`#${targetId}`}
      onClick={handleClick}
      className={cn(
        'sr-only focus:not-sr-only',
        'focus:absolute focus:z-[100] focus:top-4 focus:left-4',
        'focus:px-4 focus:py-2',
        'focus:bg-primary focus:text-primary-foreground',
        'focus:rounded-md focus:shadow-lg',
        'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
        className
      )}
    >
      {children}
    </a>
  );
}

/**
 * Skip links container with multiple targets
 */
export function SkipLinks({ 
  links = [
    { id: 'main-content', label: 'Ana içeriğe atla' },
    { id: 'main-navigation', label: 'Ana menüye atla' },
  ]
}: {
  links?: { id: string; label: string }[];
}) {
  return (
    <div className="skip-links">
      {links.map((link) => (
        <SkipLink key={link.id} targetId={link.id}>
          {link.label}
        </SkipLink>
      ))}
    </div>
  );
}
