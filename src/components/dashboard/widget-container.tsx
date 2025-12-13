'use client';

import { ReactNode, useRef } from 'react';
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
  GripVertical,
  MoreVertical,
  Settings,
  EyeOff,
  Maximize2,
  RefreshCw,
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
        'h-full flex flex-col overflow-hidden transition-shadow',
        isEditMode && 'ring-2 ring-dashed ring-primary/30 cursor-move',
        className
      )}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-3 px-4">
        <div className="flex items-center gap-2">
          {isEditMode && (
            <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab active:cursor-grabbing" />
          )}
          <CardTitle className="text-sm font-medium">{widget.title}</CardTitle>
        </div>

        <div className="flex items-center gap-1">
          {headerActions}

          {isLoading && (
            <RefreshCw className="h-4 w-4 text-muted-foreground animate-spin" />
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onRefresh && (
                <DropdownMenuItem onClick={onRefresh} className="gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Yenile
                </DropdownMenuItem>
              )}
              {onExpand && (
                <DropdownMenuItem onClick={onExpand} className="gap-2">
                  <Maximize2 className="h-4 w-4" />
                  Genişlet
                </DropdownMenuItem>
              )}
              {onSettings && (
                <DropdownMenuItem onClick={onSettings} className="gap-2">
                  <Settings className="h-4 w-4" />
                  Ayarlar
                </DropdownMenuItem>
              )}
              {(onRefresh || onExpand || onSettings) && onHide && (
                <DropdownMenuSeparator />
              )}
              {onHide && (
                <DropdownMenuItem
                  onClick={onHide}
                  className="gap-2 text-muted-foreground"
                >
                  <EyeOff className="h-4 w-4" />
                  Gizle
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-auto px-4 pb-4 pt-0">
        {error ? (
          <div className="flex items-center justify-center h-full text-center">
            <div className="text-muted-foreground">
              <p className="text-sm font-medium text-destructive">Hata</p>
              <p className="text-xs mt-1">{error}</p>
              {onRefresh && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onRefresh}
                  className="mt-3"
                >
                  Tekrar Dene
                </Button>
              )}
            </div>
          </div>
        ) : (
          children
        )}
      </CardContent>
    </Card>
  );
}

export default WidgetContainer;

