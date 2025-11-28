'use client';

import { Button } from '@/components/ui/button';
import { History } from 'lucide-react';

interface BulkMessagingHeaderProps {
  onShowHistory: () => void;
}

export function BulkMessagingHeader({ onShowHistory }: BulkMessagingHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Toplu Mesaj</h1>
        <p className="text-muted-foreground mt-2">Birden fazla alıcıya mesaj gönderin ve yönetin</p>
      </div>

      <Button variant="outline" onClick={onShowHistory} className="gap-2">
        <History className="h-4 w-4" />
        Geçmiş
      </Button>
    </div>
  );
}
