'use client';

import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface MeetingsHeaderProps {
  viewMode: 'calendar' | 'list';
  onViewModeChange: (mode: 'calendar' | 'list') => void;
  onCreateMeeting: () => void;
  children?: React.ReactNode;
}

export function MeetingsHeader({
  viewMode,
  onViewModeChange,
  onCreateMeeting,
  children,
}: MeetingsHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Toplantılar</h1>
        <p className="text-muted-foreground mt-2">Toplantılarınızı yönetin ve takip edin</p>
      </div>

      <div className="flex items-center gap-2">
        {children}
        <div className="flex gap-1 border rounded-lg p-1">
          <Button
            size="sm"
            variant={viewMode === 'calendar' ? 'default' : 'ghost'}
            onClick={() => onViewModeChange('calendar')}
          >
            Takvim
          </Button>
          <Button
            size="sm"
            variant={viewMode === 'list' ? 'default' : 'ghost'}
            onClick={() => onViewModeChange('list')}
          >
            Liste
          </Button>
        </div>

        <Button 
          onClick={onCreateMeeting} 
          className="gap-2"
          data-testid="create-meeting-button"
        >
          <Plus className="h-4 w-4" />
          Yeni Toplantı Oluştur
        </Button>
      </div>
    </div>
  );
}
