'use client';

import { format, isToday, isTomorrow, isPast } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Video,
  MoreVertical,
  Edit,
  Trash2,
  ExternalLink,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import type { Meeting } from './MeetingListView';

interface MeetingCardProps {
  meeting: Meeting;
  onEdit?: () => void;
  onDelete?: () => void;
  onView?: () => void;
  variant?: 'default' | 'compact';
}

const statusColors = {
  scheduled: 'bg-blue-500',
  in_progress: 'bg-green-500',
  completed: 'bg-gray-500',
  cancelled: 'bg-red-500',
};

export function MeetingCard({
  meeting,
  onEdit,
  onDelete,
  onView,
  variant = 'default',
}: MeetingCardProps) {
  const meetingDate = new Date(meeting.date);
  const isUpcoming = !isPast(meetingDate) && meeting.status === 'scheduled';
  const isTodayMeeting = isToday(meetingDate);
  const isTomorrowMeeting = isTomorrow(meetingDate);

  const getDateLabel = () => {
    if (isTodayMeeting) return 'Bugün';
    if (isTomorrowMeeting) return 'Yarın';
    return format(meetingDate, 'dd MMMM yyyy', { locale: tr });
  };

  if (variant === 'compact') {
    return (
      <div
        className={cn(
          'flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer',
          isUpcoming && 'border-l-4 border-l-blue-500'
        )}
        onClick={onView}
      >
        {/* Status Indicator */}
        <div className={cn('w-2 h-2 rounded-full shrink-0', statusColors[meeting.status])} />

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">{meeting.title}</p>
          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {getDateLabel()}
            </span>
            {meeting.startTime && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {meeting.startTime}
              </span>
            )}
          </div>
        </div>

        {/* Participants */}
        <div className="flex -space-x-1 shrink-0">
          {meeting.participants?.slice(0, 3).map((p) => (
            <Avatar key={p.id} className="h-6 w-6 border-2 border-background">
              <AvatarImage src={p.avatar} />
              <AvatarFallback className="text-[10px]">{p.name.charAt(0)}</AvatarFallback>
            </Avatar>
          ))}
        </div>
      </div>
    );
  }

  return (
    <Card
      className={cn(
        'overflow-hidden transition-shadow hover:shadow-md',
        isUpcoming && 'ring-1 ring-blue-500/20'
      )}
    >
      {/* Colored Top Bar */}
      <div className={cn('h-1', statusColors[meeting.status])} />

      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg truncate">{meeting.title}</h3>
            {meeting.description && (
              <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                {meeting.description}
              </p>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onView} className="gap-2">
                <ExternalLink className="h-4 w-4" />
                Detaylar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onEdit} className="gap-2">
                <Edit className="h-4 w-4" />
                Düzenle
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onDelete} className="gap-2 text-destructive">
                <Trash2 className="h-4 w-4" />
                Sil
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Date & Time */}
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span className={cn(isTodayMeeting && 'text-blue-600 font-medium')}>
              {getDateLabel()}
            </span>
          </div>
          {meeting.startTime && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>
                {meeting.startTime}
                {meeting.endTime && ` - ${meeting.endTime}`}
              </span>
            </div>
          )}
        </div>

        {/* Location / Type */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {meeting.type === 'online' ? (
            <>
              <Video className="h-4 w-4" />
              <span>Online Toplantı</span>
            </>
          ) : meeting.location ? (
            <>
              <MapPin className="h-4 w-4" />
              <span className="truncate">{meeting.location}</span>
            </>
          ) : (
            <>
              <Users className="h-4 w-4" />
              <span>Yüz Yüze</span>
            </>
          )}
        </div>

        {/* Participants */}
        {meeting.participants && meeting.participants.length > 0 && (
          <div className="flex items-center justify-between pt-2 border-t">
            <div className="flex -space-x-2">
              {meeting.participants.slice(0, 5).map((participant) => (
                <Avatar
                  key={participant.id}
                  className="h-8 w-8 border-2 border-background"
                  title={participant.name}
                >
                  <AvatarImage src={participant.avatar} />
                  <AvatarFallback className="text-xs">
                    {participant.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
              ))}
              {meeting.participants.length > 5 && (
                <div className="h-8 w-8 rounded-full bg-muted border-2 border-background flex items-center justify-center text-xs font-medium">
                  +{meeting.participants.length - 5}
                </div>
              )}
            </div>
            <span className="text-xs text-muted-foreground">
              {meeting.participants.length} katılımcı
            </span>
          </div>
        )}

        {/* Status Badge */}
        <div className="flex justify-end">
          <Badge
            variant={
              meeting.status === 'completed'
                ? 'secondary'
                : meeting.status === 'cancelled'
                ? 'destructive'
                : meeting.status === 'in_progress'
                ? 'default'
                : 'outline'
            }
          >
            {meeting.status === 'scheduled' && 'Planlandı'}
            {meeting.status === 'in_progress' && 'Devam Ediyor'}
            {meeting.status === 'completed' && 'Tamamlandı'}
            {meeting.status === 'cancelled' && 'İptal Edildi'}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}

export default MeetingCard;

