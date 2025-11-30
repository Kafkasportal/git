'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow, format, isToday, isYesterday } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  UserPlus,
  UserCog,
  UserMinus,
  Gift,
  ListTodo,
  CheckCircle2,
  UserCheck,
  Calendar,
  CalendarCheck,
  MessageSquare,
  CheckCircle,
  XCircle,
  Settings,
  ExternalLink,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import {
  Activity,
  activityTypeConfig,
  activityFilterOptions,
  getActivityLink,
} from '@/lib/activity/types';
import { cn } from '@/lib/utils';

// Icon mapping
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  UserPlus,
  UserCog,
  UserMinus,
  Gift,
  ListTodo,
  CheckCircle2,
  UserCheck,
  Calendar,
  CalendarCheck,
  MessageSquare,
  CheckCircle,
  XCircle,
  Settings,
};

interface ActivityFeedProps {
  activities: Activity[];
  isLoading?: boolean;
  onLoadMore?: () => void;
  hasMore?: boolean;
  onRefresh?: () => void;
  maxHeight?: string | number;
  showFilter?: boolean;
  emptyMessage?: string;
}

export function ActivityFeed({
  activities,
  isLoading,
  onLoadMore,
  hasMore,
  onRefresh,
  maxHeight = 500,
  showFilter = true,
  emptyMessage = 'Henüz aktivite yok',
}: ActivityFeedProps) {
  const router = useRouter();
  const [filter, setFilter] = useState('all');

  // Filter activities
  const filteredActivities = useMemo(() => {
    if (filter === 'all') return activities;
    return activities.filter((activity) => {
      const resourceType = activity.resourceType;
      return resourceType === filter;
    });
  }, [activities, filter]);

  // Group activities by date
  const groupedActivities = useMemo(() => {
    const groups: Record<string, Activity[]> = {};

    filteredActivities.forEach((activity) => {
      const date = new Date(activity.createdAt);
      let key: string;

      if (isToday(date)) {
        key = 'today';
      } else if (isYesterday(date)) {
        key = 'yesterday';
      } else {
        key = format(date, 'yyyy-MM-dd');
      }

      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(activity);
    });

    return groups;
  }, [filteredActivities]);

  const getGroupLabel = (key: string) => {
    if (key === 'today') return 'Bugün';
    if (key === 'yesterday') return 'Dün';
    return format(new Date(key), 'dd MMMM yyyy', { locale: tr });
  };

  const handleActivityClick = (activity: Activity) => {
    const link = getActivityLink(activity);
    if (link) {
      router.push(link);
    }
  };

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Son Aktiviteler</h3>
        <div className="flex items-center gap-2">
          {showFilter && (
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-40 h-8 text-sm">
                <SelectValue placeholder="Filtrele" />
              </SelectTrigger>
              <SelectContent>
                {activityFilterOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {onRefresh && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onRefresh}
              disabled={isLoading}
              className="h-8 w-8"
            >
              <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
            </Button>
          )}
        </div>
      </div>

      {/* Activity List */}
      <ScrollArea style={{ maxHeight }}>
        {isLoading && activities.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredActivities.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Settings className="h-12 w-12 mx-auto mb-3 opacity-20" />
            <p className="text-sm">{emptyMessage}</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedActivities).map(([dateKey, dateActivities]) => (
              <div key={dateKey}>
                {/* Date Header */}
                <div className="sticky top-0 bg-background/95 backdrop-blur-sm z-10 pb-2">
                  <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {getGroupLabel(dateKey)}
                  </h4>
                </div>

                {/* Activities */}
                <div className="relative pl-6 space-y-4">
                  {/* Timeline line */}
                  <div className="absolute left-2 top-2 bottom-2 w-px bg-border" />

                  {dateActivities.map((activity) => (
                    <ActivityItem
                      key={activity.id}
                      activity={activity}
                      onClick={() => handleActivityClick(activity)}
                    />
                  ))}
                </div>
              </div>
            ))}

            {/* Load More */}
            {hasMore && onLoadMore && (
              <div className="flex justify-center pt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onLoadMore}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Yükleniyor...
                    </>
                  ) : (
                    'Daha Fazla Yükle'
                  )}
                </Button>
              </div>
            )}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}

/**
 * Single Activity Item
 */
interface ActivityItemProps {
  activity: Activity;
  onClick?: () => void;
}

function ActivityItem({ activity, onClick }: ActivityItemProps) {
  const config = activityTypeConfig[activity.type];
  const IconComponent = iconMap[config.icon] || Settings;
  const link = getActivityLink(activity);
  const timeAgo = formatDistanceToNow(new Date(activity.createdAt), {
    addSuffix: true,
    locale: tr,
  });

  return (
    <div
      className={cn(
        'relative flex gap-4 p-3 rounded-lg transition-colors',
        link && 'cursor-pointer hover:bg-muted/50',
        'group'
      )}
      onClick={onClick}
    >
      {/* Timeline dot */}
      <div
        className={cn(
          'absolute left-0 top-5 w-4 h-4 rounded-full border-2 border-background flex items-center justify-center -translate-x-1/2',
          config.bgColor
        )}
      >
        <div className={cn('w-2 h-2 rounded-full', config.color.replace('text-', 'bg-'))} />
      </div>

      {/* Icon */}
      <div className={cn('shrink-0 p-2 rounded-lg', config.bgColor)}>
        <IconComponent className={cn('h-4 w-4', config.color)} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-sm font-medium">{activity.title}</p>
            {activity.description && (
              <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
                {activity.description}
              </p>
            )}
          </div>
          {link && (
            <ExternalLink className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
          )}
        </div>

        {/* Meta */}
        <div className="flex items-center gap-3 mt-2">
          {activity.user && (
            <div className="flex items-center gap-1.5">
              <Avatar className="h-5 w-5">
                <AvatarImage src={activity.user.avatar} />
                <AvatarFallback className="text-[10px]">
                  {activity.user.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs text-muted-foreground">{activity.user.name}</span>
            </div>
          )}
          <span className="text-xs text-muted-foreground">{timeAgo}</span>
          {activity.resourceName && (
            <Badge variant="secondary" className="text-xs h-5">
              {activity.resourceName}
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}

export default ActivityFeed;

