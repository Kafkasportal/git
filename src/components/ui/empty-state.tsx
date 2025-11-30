'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './button';

export interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  variant?: 'default' | 'minimal' | 'illustration';
  illustration?: 'no-data' | 'no-results' | 'no-users' | 'no-donations' | 'no-tasks' | 'no-meetings' | 'empty-inbox' | 'empty-folder';
  className?: string;
}

// SVG Illustrations
const illustrations = {
  'no-data': (
    <svg className="w-full h-full" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="100" cy="100" r="80" className="fill-muted/30" />
      <rect x="60" y="70" width="80" height="60" rx="8" className="fill-muted" />
      <rect x="70" y="85" width="60" height="4" rx="2" className="fill-muted-foreground/20" />
      <rect x="70" y="95" width="40" height="4" rx="2" className="fill-muted-foreground/20" />
      <rect x="70" y="105" width="50" height="4" rx="2" className="fill-muted-foreground/20" />
      <circle cx="140" cy="140" r="25" className="fill-primary/10 stroke-primary/30" strokeWidth="2" />
      <path d="M130 140 L140 150 L155 130" className="stroke-primary" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  ),
  'no-results': (
    <svg className="w-full h-full" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="90" cy="90" r="50" className="stroke-muted-foreground/30" strokeWidth="8" fill="none" />
      <line x1="125" y1="125" x2="165" y2="165" className="stroke-muted-foreground/30" strokeWidth="8" strokeLinecap="round" />
      <circle cx="90" cy="90" r="25" className="fill-muted/50" />
      <path d="M80 90 L100 90 M90 80 L90 100" className="stroke-muted-foreground/20" strokeWidth="4" strokeLinecap="round" />
    </svg>
  ),
  'no-users': (
    <svg className="w-full h-full" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="100" cy="100" r="80" className="fill-blue-50 dark:fill-blue-950/20" />
      <circle cx="100" cy="75" r="25" className="fill-blue-200 dark:fill-blue-800/50" />
      <ellipse cx="100" cy="140" rx="40" ry="25" className="fill-blue-200 dark:fill-blue-800/50" />
      <circle cx="60" cy="85" r="15" className="fill-blue-100 dark:fill-blue-900/30" opacity="0.7" />
      <ellipse cx="60" cy="115" rx="20" ry="12" className="fill-blue-100 dark:fill-blue-900/30" opacity="0.7" />
      <circle cx="140" cy="85" r="15" className="fill-blue-100 dark:fill-blue-900/30" opacity="0.7" />
      <ellipse cx="140" cy="115" rx="20" ry="12" className="fill-blue-100 dark:fill-blue-900/30" opacity="0.7" />
    </svg>
  ),
  'no-donations': (
    <svg className="w-full h-full" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="100" cy="100" r="80" className="fill-green-50 dark:fill-green-950/20" />
      <path d="M100 50 C60 50 50 80 50 100 C50 130 75 160 100 180 C125 160 150 130 150 100 C150 80 140 50 100 50Z" className="fill-green-200 dark:fill-green-800/50" />
      <path d="M90 100 L100 110 L120 85" className="stroke-green-500" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  ),
  'no-tasks': (
    <svg className="w-full h-full" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="100" cy="100" r="80" className="fill-purple-50 dark:fill-purple-950/20" />
      <rect x="55" y="45" width="90" height="110" rx="8" className="fill-purple-200 dark:fill-purple-800/50" />
      <rect x="70" y="65" width="20" height="20" rx="4" className="fill-purple-100 dark:fill-purple-900/30" />
      <rect x="100" y="70" width="30" height="4" rx="2" className="fill-purple-300 dark:fill-purple-700/50" />
      <rect x="100" y="78" width="20" height="3" rx="1" className="fill-purple-200 dark:fill-purple-800/30" />
      <rect x="70" y="95" width="20" height="20" rx="4" className="fill-purple-100 dark:fill-purple-900/30" />
      <rect x="100" y="100" width="35" height="4" rx="2" className="fill-purple-300 dark:fill-purple-700/50" />
      <rect x="100" y="108" width="25" height="3" rx="1" className="fill-purple-200 dark:fill-purple-800/30" />
      <rect x="70" y="125" width="20" height="20" rx="4" className="fill-purple-100 dark:fill-purple-900/30" />
      <rect x="100" y="130" width="28" height="4" rx="2" className="fill-purple-300 dark:fill-purple-700/50" />
    </svg>
  ),
  'no-meetings': (
    <svg className="w-full h-full" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="100" cy="100" r="80" className="fill-cyan-50 dark:fill-cyan-950/20" />
      <rect x="50" y="55" width="100" height="90" rx="8" className="fill-cyan-200 dark:fill-cyan-800/50" />
      <rect x="50" y="55" width="100" height="25" rx="8" className="fill-cyan-300 dark:fill-cyan-700/50" />
      <circle cx="70" cy="67" r="5" className="fill-cyan-100" />
      <circle cx="85" cy="67" r="5" className="fill-cyan-100" />
      <circle cx="100" cy="67" r="5" className="fill-cyan-100" />
      <rect x="65" y="95" width="15" height="15" rx="2" className="fill-cyan-100 dark:fill-cyan-900/30" />
      <rect x="92" y="95" width="15" height="15" rx="2" className="fill-cyan-100 dark:fill-cyan-900/30" />
      <rect x="119" y="95" width="15" height="15" rx="2" className="fill-cyan-100 dark:fill-cyan-900/30" />
      <rect x="65" y="120" width="15" height="15" rx="2" className="fill-cyan-100 dark:fill-cyan-900/30" />
      <rect x="92" y="120" width="15" height="15" rx="2" className="fill-primary/20" />
      <rect x="119" y="120" width="15" height="15" rx="2" className="fill-cyan-100 dark:fill-cyan-900/30" />
    </svg>
  ),
  'empty-inbox': (
    <svg className="w-full h-full" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="100" cy="100" r="80" className="fill-amber-50 dark:fill-amber-950/20" />
      <path d="M50 90 L100 60 L150 90 L150 150 L50 150 Z" className="fill-amber-200 dark:fill-amber-800/50" />
      <path d="M50 90 L100 120 L150 90" className="stroke-amber-300 dark:stroke-amber-700" strokeWidth="2" fill="none" />
      <line x1="50" y1="90" x2="50" y2="150" className="stroke-amber-300 dark:stroke-amber-700" strokeWidth="2" />
      <line x1="150" y1="90" x2="150" y2="150" className="stroke-amber-300 dark:stroke-amber-700" strokeWidth="2" />
    </svg>
  ),
  'empty-folder': (
    <svg className="w-full h-full" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="100" cy="100" r="80" className="fill-slate-50 dark:fill-slate-950/20" />
      <path d="M45 70 L45 145 C45 150 50 155 55 155 L145 155 C150 155 155 150 155 145 L155 80 C155 75 150 70 145 70 L105 70 L95 55 L55 55 C50 55 45 60 45 65 L45 70Z" className="fill-slate-200 dark:fill-slate-800/50" />
      <ellipse cx="100" cy="115" rx="30" ry="8" className="fill-slate-300 dark:fill-slate-700/50" opacity="0.5" />
    </svg>
  ),
};

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  actionLabel,
  onAction,
  variant = 'default',
  illustration,
  className,
}: EmptyStateProps) {
  const containerVariants = {
    default: 'py-12',
    minimal: 'py-8',
    illustration: 'py-16',
  };

  const iconSizeVariants = {
    default: 'h-8 w-8',
    minimal: 'h-6 w-6',
    illustration: 'h-16 w-16',
  };

  const titleSizeVariants = {
    default: 'text-lg',
    minimal: 'text-base',
    illustration: 'text-xl',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        'flex flex-col items-center justify-center px-4 text-center',
        containerVariants[variant],
        className
      )}
    >
      {/* SVG Illustration */}
      {illustration && variant === 'illustration' && (
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="w-40 h-40 mb-6"
        >
          {illustrations[illustration]}
        </motion.div>
      )}

      {/* Icon (when no illustration) */}
      {Icon && !illustration && (
        <div
          className={cn(
            'flex items-center justify-center mb-4',
            variant === 'default' && 'rounded-full bg-muted/50 p-4',
            variant === 'minimal' && '',
            variant === 'illustration' && 'rounded-full bg-muted/30 p-6'
          )}
        >
          <Icon className={cn('text-muted-foreground', iconSizeVariants[variant])} />
        </div>
      )}

      <h3
        className={cn(
          'font-heading font-semibold text-foreground mb-2',
          titleSizeVariants[variant]
        )}
      >
        {title}
      </h3>

      {description && (
        <p className="font-body text-sm text-muted-foreground max-w-md mb-4">{description}</p>
      )}

      {action && <div className="mt-4">{action}</div>}

      {actionLabel && onAction && !action && (
        <Button onClick={onAction} className="mt-4">
          {actionLabel}
        </Button>
      )}
    </motion.div>
  );
}

// Pre-configured empty states
export function NoDataEmptyState({ onAction }: { onAction?: () => void }) {
  return (
    <EmptyState
      illustration="no-data"
      variant="illustration"
      title="Veri bulunamadı"
      description="Henüz kayıt eklenmemiş. Yeni bir kayıt ekleyerek başlayın."
      actionLabel={onAction ? 'Yeni Kayıt Ekle' : undefined}
      onAction={onAction}
    />
  );
}

export function NoResultsEmptyState({ query }: { query?: string }) {
  return (
    <EmptyState
      illustration="no-results"
      variant="illustration"
      title="Sonuç bulunamadı"
      description={query ? `"${query}" için sonuç bulunamadı. Farklı anahtar kelimeler deneyin.` : 'Arama kriterlerinize uygun sonuç bulunamadı.'}
    />
  );
}

export function NoBeneficiariesEmptyState({ onAction }: { onAction?: () => void }) {
  return (
    <EmptyState
      illustration="no-users"
      variant="illustration"
      title="Henüz ihtiyaç sahibi yok"
      description="İhtiyaç sahiplerini ekleyerek yardım dağıtımına başlayın."
      actionLabel="İhtiyaç Sahibi Ekle"
      onAction={onAction}
    />
  );
}

export function NoDonationsEmptyState({ onAction }: { onAction?: () => void }) {
  return (
    <EmptyState
      illustration="no-donations"
      variant="illustration"
      title="Henüz bağış yok"
      description="Bağış kayıtlarını ekleyerek takip etmeye başlayın."
      actionLabel="Bağış Ekle"
      onAction={onAction}
    />
  );
}

export function NoTasksEmptyState({ onAction }: { onAction?: () => void }) {
  return (
    <EmptyState
      illustration="no-tasks"
      variant="illustration"
      title="Görev bulunamadı"
      description="Yeni görevler oluşturarak iş akışınızı organize edin."
      actionLabel="Görev Oluştur"
      onAction={onAction}
    />
  );
}

export function NoMeetingsEmptyState({ onAction }: { onAction?: () => void }) {
  return (
    <EmptyState
      illustration="no-meetings"
      variant="illustration"
      title="Planlanmış toplantı yok"
      description="Yeni bir toplantı planlayarak ekibinizle koordinasyon sağlayın."
      actionLabel="Toplantı Planla"
      onAction={onAction}
    />
  );
}

export function EmptyInboxEmptyState() {
  return (
    <EmptyState
      illustration="empty-inbox"
      variant="illustration"
      title="Gelen kutusu boş"
      description="Yeni mesajlar burada görünecek."
    />
  );
}

export function EmptyFolderEmptyState() {
  return (
    <EmptyState
      illustration="empty-folder"
      variant="illustration"
      title="Klasör boş"
      description="Bu klasörde henüz dosya bulunmuyor."
    />
  );
}
