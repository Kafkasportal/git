'use client';

import { type ReactNode, useRef } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  GripVertical,
  MoreVertical,
  Settings,
  EyeOff,
  Maximize2,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { WidgetConfig } from '@/types/dashboard';

interface WidgetContainerProps {
  widget: WidgetConfig;
  children: ReactNode;
  isEditMode?: boolean;
  onHide?: () => void;
  onSettings?: () => void;
  onRefresh?: () => void;
  onExpand?: () => void;
  isLoading?: boolean;
  error?: string | null;
  className?: string;
  headerActions?: ReactNode;
}

export function WidgetContainer({
  widget,
  children,
  isEditMode = false,
  onHide,
  onSettings,
  onRefresh,
  onExpand,
  isLoading = false,
  error = null,
  className,
  headerActions,
}: WidgetContainerProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  return (
    <Card
      ref={cardRef}
      className={cn(
        'group/widget h-full flex flex-col relative overflow-hidden',
        'bg-card/80 backdrop-blur-sm',
        'border border-border/60',
        'shadow-sm hover:shadow-md',
        'transition-all duration-300 ease-out',
        '!gap-0 !py-0',
        isEditMode && [
          'ring-2 ring-dashed ring-primary/40',
          'cursor-move',
          'hover:ring-primary/60',
        ],
        !isEditMode && [
          'hover:border-primary/30',
          'hover:bg-card',
        ],
        className
      )}
    >
      {/* Subtle gradient overlay on hover */}
      <div
        className={cn(
          'absolute inset-0 opacity-0 transition-opacity duration-300 pointer-events-none',
          'bg-gradient-to-br from-primary/[0.02] via-transparent to-accent/[0.02]',
          'group-hover/widget:opacity-100'
        )}
      />

      {/* Top accent line */}
      <div
        className={cn(
          'absolute top-0 left-0 right-0 h-[2px]',
          'bg-gradient-to-r from-transparent via-primary/20 to-transparent',
          'opacity-0 group-hover/widget:opacity-100',
          'transition-opacity duration-300'
        )}
      />

      <CardHeader className="flex flex-row items-center justify-between space-y-0 py-2 px-3 relative z-10">
        <div className="flex items-center gap-2 min-w-0">
          {isEditMode && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
            >
              <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab active:cursor-grabbing hover:text-primary transition-colors" />
            </motion.div>
          )}
          <CardTitle
            className={cn(
              'text-xs font-semibold tracking-tight truncate',
              'text-foreground/90 group-hover/widget:text-foreground',
              'transition-colors duration-200'
            )}
          >
            {widget.title}
          </CardTitle>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {headerActions}

          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mr-1"
            >
              <RefreshCw className="h-3.5 w-3.5 text-primary animate-spin" />
            </motion.div>
          )}

          <DropdownMenu>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Widget seçenekleri"
                    className={cn(
                      'h-7 w-7',
                      'opacity-0 group-hover/widget:opacity-100',
                      'focus:opacity-100',
                      'transition-opacity duration-200',
                      'hover:bg-primary/10 hover:text-primary'
                    )}
                  >
                    <MoreVertical className="h-3.5 w-3.5" />
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent>
                <p>Widget seçenekleri</p>
              </TooltipContent>
            </Tooltip>
            <DropdownMenuContent
              align="end"
              className="w-48 bg-card/95 backdrop-blur-md border-border/60"
            >
              {onRefresh && (
                <DropdownMenuItem
                  onClick={onRefresh}
                  className="gap-2 cursor-pointer hover:bg-primary/10 focus:bg-primary/10"
                >
                  <RefreshCw className="h-4 w-4 text-primary" />
                  <span>Yenile</span>
                </DropdownMenuItem>
              )}
              {onExpand && (
                <DropdownMenuItem
                  onClick={onExpand}
                  className="gap-2 cursor-pointer hover:bg-primary/10 focus:bg-primary/10"
                >
                  <Maximize2 className="h-4 w-4 text-primary" />
                  <span>Genişlet</span>
                </DropdownMenuItem>
              )}
              {onSettings && (
                <DropdownMenuItem
                  onClick={onSettings}
                  className="gap-2 cursor-pointer hover:bg-primary/10 focus:bg-primary/10"
                >
                  <Settings className="h-4 w-4 text-primary" />
                  <span>Ayarlar</span>
                </DropdownMenuItem>
              )}
              {(onRefresh || onExpand || onSettings) && onHide && (
                <DropdownMenuSeparator className="bg-border/60" />
              )}
              {onHide && (
                <DropdownMenuItem
                  onClick={onHide}
                  className="gap-2 cursor-pointer text-muted-foreground hover:text-foreground hover:bg-muted/50 focus:bg-muted/50"
                >
                  <EyeOff className="h-4 w-4" />
                  <span>Gizle</span>
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="flex-1 !px-3 !pb-3 pt-0 relative z-10">
        {error ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center justify-center h-full text-center py-6"
          >
            <div className="space-y-3">
              <div className="w-12 h-12 mx-auto rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-destructive" />
              </div>
              <div>
                <p className="text-sm font-medium text-destructive">Hata</p>
                <p className="text-xs text-muted-foreground mt-1 max-w-[200px]">
                  {error}
                </p>
              </div>
              {onRefresh && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onRefresh}
                  className="mt-2 hover:bg-primary/10 hover:text-primary hover:border-primary/30"
                >
                  <RefreshCw className="h-3.5 w-3.5 mr-2" />
                  Tekrar Dene
                </Button>
              )}
            </div>
          </motion.div>
        ) : (
          children
        )}
      </CardContent>
    </Card>
  );
}

export default WidgetContainer;
