'use client';

import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  Video,
  FileText,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Meeting {
  id: string;
  title: string;
  description?: string;
  date: string;
  startTime?: string;
  endTime?: string;
  location?: string;
  type: 'in_person' | 'online' | 'hybrid';
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  organizer?: {
    id: string;
    name: string;
    avatar?: string;
  };
  participants?: Array<{
    id: string;
    name: string;
    avatar?: string;
  }>;
  notes?: string;
  createdAt: string;
}

interface MeetingListViewProps {
  meetings: Meeting[];
  onEdit?: (meeting: Meeting) => void;
  onDelete?: (meeting: Meeting) => void;
  onView?: (meeting: Meeting) => void;
  onSelectChange?: (selectedIds: string[]) => void;
  isLoading?: boolean;
}

type SortField = 'date' | 'title' | 'status' | 'type';
type SortOrder = 'asc' | 'desc';

const statusConfig: Record<Meeting['status'], { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  scheduled: { label: 'Planlandı', variant: 'outline' },
  in_progress: { label: 'Devam Ediyor', variant: 'default' },
  completed: { label: 'Tamamlandı', variant: 'secondary' },
  cancelled: { label: 'İptal Edildi', variant: 'destructive' },
};

const typeConfig: Record<Meeting['type'], { label: string; icon: React.ReactNode }> = {
  in_person: { label: 'Yüz Yüze', icon: <Users className="h-4 w-4" /> },
  online: { label: 'Online', icon: <Video className="h-4 w-4" /> },
  hybrid: { label: 'Hibrit', icon: <Users className="h-4 w-4" /> },
};

export function MeetingListView({
  meetings,
  onEdit,
  onDelete,
  onView,
  onSelectChange,
  isLoading,
}: MeetingListViewProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // Sort meetings
  const sortedMeetings = useMemo(() => {
    return [...meetings].sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'date':
          comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
          break;
        case 'title':
          comparison = a.title.localeCompare(b.title, 'tr');
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
        case 'type':
          comparison = a.type.localeCompare(b.type);
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [meetings, sortField, sortOrder]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = new Set(meetings.map((m) => m.id));
      setSelectedIds(allIds);
      onSelectChange?.(Array.from(allIds));
    } else {
      setSelectedIds(new Set());
      onSelectChange?.([]);
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedIds);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedIds(newSelected);
    onSelectChange?.(Array.from(newSelected));
  };

  // Render sort icon inline to avoid component creation during render
  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) return null;
    return sortOrder === 'asc' ? (
      <ChevronUp className="h-4 w-4 ml-1" />
    ) : (
      <ChevronDown className="h-4 w-4 ml-1" />
    );
  };

  const isAllSelected = meetings.length > 0 && selectedIds.size === meetings.length;
  const isSomeSelected = selectedIds.size > 0 && selectedIds.size < meetings.length;

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-12">
              <Checkbox
                checked={isAllSelected}
                onCheckedChange={handleSelectAll}
                aria-label="Tümünü seç"
                className={cn(isSomeSelected && 'data-[state=checked]:bg-primary/50')}
              />
            </TableHead>
            <TableHead
              className="cursor-pointer select-none"
              onClick={() => handleSort('title')}
            >
              <div className="flex items-center">
                Toplantı
                {renderSortIcon('title')}
              </div>
            </TableHead>
            <TableHead
              className="cursor-pointer select-none"
              onClick={() => handleSort('date')}
            >
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-2" />
                Tarih
                {renderSortIcon('date')}
              </div>
            </TableHead>
            <TableHead>
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-2" />
                Saat
              </div>
            </TableHead>
            <TableHead
              className="cursor-pointer select-none"
              onClick={() => handleSort('type')}
            >
              <div className="flex items-center">
                Tür
                {renderSortIcon('type')}
              </div>
            </TableHead>
            <TableHead
              className="cursor-pointer select-none"
              onClick={() => handleSort('status')}
            >
              <div className="flex items-center">
                Durum
                {renderSortIcon('status')}
              </div>
            </TableHead>
            <TableHead>Katılımcılar</TableHead>
            <TableHead className="w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            // Loading skeleton
            Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell colSpan={8}>
                  <div className="h-12 animate-pulse bg-muted rounded" />
                </TableCell>
              </TableRow>
            ))
          ) : sortedMeetings.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="h-32 text-center">
                <div className="text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-2 opacity-20" />
                  <p>Toplantı bulunamadı</p>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            sortedMeetings.map((meeting) => (
              <TableRow
                key={meeting.id}
                className={cn(selectedIds.has(meeting.id) && 'bg-primary/5')}
              >
                <TableCell>
                  <Checkbox
                    checked={selectedIds.has(meeting.id)}
                    onCheckedChange={(checked) => { handleSelectOne(meeting.id, !!checked); }}
                    aria-label={`${meeting.title} seç`}
                  />
                </TableCell>
                <TableCell>
                  <div className="min-w-0">
                    <p className="font-medium truncate">{meeting.title}</p>
                    {meeting.location && (
                      <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                        <MapPin className="h-3 w-3 shrink-0" />
                        <span className="truncate">{meeting.location}</span>
                      </p>
                    )}
                  </div>
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  {format(new Date(meeting.date), 'dd MMM yyyy', { locale: tr })}
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  {meeting.startTime && (
                    <span>
                      {meeting.startTime}
                      {meeting.endTime && ` - ${meeting.endTime}`}
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {typeConfig[meeting.type].icon}
                    <span className="text-sm">{typeConfig[meeting.type].label}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={statusConfig[meeting.status].variant}>
                    {statusConfig[meeting.status].label}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex -space-x-2">
                    {meeting.participants?.slice(0, 4).map((participant) => (
                      <Avatar
                        key={participant.id}
                        className="h-8 w-8 border-2 border-background"
                      >
                        <AvatarImage src={participant.avatar} />
                        <AvatarFallback className="text-xs">
                          {participant.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                    ))}
                    {meeting.participants && meeting.participants.length > 4 && (
                      <div className="h-8 w-8 rounded-full bg-muted border-2 border-background flex items-center justify-center text-xs font-medium">
                        +{meeting.participants.length - 4}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>İşlemler</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => onView?.(meeting)} className="gap-2">
                        <Eye className="h-4 w-4" />
                        Görüntüle
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onEdit?.(meeting)} className="gap-2">
                        <Edit className="h-4 w-4" />
                        Düzenle
                      </DropdownMenuItem>
                      {meeting.notes && (
                        <DropdownMenuItem className="gap-2">
                          <FileText className="h-4 w-4" />
                          Notlar
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => onDelete?.(meeting)}
                        className="gap-2 text-destructive focus:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                        Sil
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}

export default MeetingListView;

