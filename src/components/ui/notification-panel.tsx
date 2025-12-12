'use client';

import { useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  X,
  Info,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Calendar,
  Gift,
  Users,
  MessageSquare,
  ListTodo,
  Settings,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { useNotificationStore, NotificationType, Notification } from '@/stores/notificationStore';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';

// Icon mapping for notification types
const typeIcons: Record<NotificationType, React.ReactNode> = {
  info: <Info className="h-4 w-4 text-blue-500" />,
  success: <CheckCircle2 className="h-4 w-4 text-green-500" />,
  warning: <AlertTriangle className="h-4 w-4 text-amber-500" />,
  error: <XCircle className="h-4 w-4 text-red-500" />,
  task: <ListTodo className="h-4 w-4 text-purple-500" />,
  meeting: <Calendar className="h-4 w-4 text-cyan-500" />,
  donation: <Gift className="h-4 w-4 text-green-500" />,
  beneficiary: <Users className="h-4 w-4 text-blue-500" />,
  message: <MessageSquare className="h-4 w-4 text-indigo-500" />,
};

// Type labels
const typeLabels: Record<NotificationType, string> = {
  info: 'Bilgi',
  success: 'Başarılı',
  warning: 'Uyarı',
  error: 'Hata',
  task: 'Görev',
  meeting: 'Toplantı',
  donation: 'Bağış',
  beneficiary: 'İhtiyaç Sahibi',
  message: 'Mesaj',
};

/**
 * Notification Bell with Badge
 */
interface NotificationBellProps {
  className?: string;
}

export function NotificationBell({ className }: NotificationBellProps) {
  const { isOpen, setIsOpen, unreadCount } = useNotificationStore();
  const count = unreadCount();

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn('relative', className)}
          aria-label={`Bildirimler ${count > 0 ? `(${count} okunmamış)` : ''}`}
        >
          <Bell className="h-5 w-5" />
          {count > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 min-w-5 px-1 text-xs flex items-center justify-center"
            >
              {count > 99 ? '99+' : count}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <NotificationList />
      </PopoverContent>
    </Popover>
  );
}

/**
 * Notification List Component
 */
function NotificationList() {
  const router = useRouter();
  const {
    notifications,
    settings,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll,
    setIsOpen,
    updateSettings,
  } = useNotificationStore();

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleNotificationClick = useCallback(
    (notification: Notification) => {
      markAsRead(notification.id);
      if (notification.link) {
        setIsOpen(false);
        router.push(notification.link);
      }
    },
    [markAsRead, setIsOpen, router]
  );

  const groupedNotifications = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    return {
      today: notifications.filter((n) => new Date(n.createdAt) >= today),
      yesterday: notifications.filter((n) => {
        const date = new Date(n.createdAt);
        return date >= yesterday && date < today;
      }),
      older: notifications.filter((n) => new Date(n.createdAt) < yesterday),
    };
  }, [notifications]);

  return (
    <div className="flex flex-col max-h-[500px]">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold">Bildirimler</h3>
          {unreadCount > 0 && (
            <Badge variant="secondary" className="h-5 text-xs">
              {unreadCount} yeni
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => updateSettings({ soundEnabled: !settings.soundEnabled })}
            className="h-8 w-8"
            title={settings.soundEnabled ? 'Sesi kapat' : 'Sesi aç'}
          >
            {settings.soundEnabled ? (
              <Volume2 className="h-4 w-4" />
            ) : (
              <VolumeX className="h-4 w-4 text-muted-foreground" />
            )}
          </Button>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="h-8 text-xs gap-1"
            >
              <CheckCheck className="h-3 w-3" />
              Tümünü Oku
            </Button>
          )}
        </div>
      </div>

      {/* Notification List */}
      <ScrollArea className="flex-1">
        {notifications.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <Bell className="h-12 w-12 mx-auto mb-3 opacity-20" />
            <p className="text-sm font-medium">Bildirim yok</p>
            <p className="text-xs mt-1">Yeni bildirimler burada görünecek</p>
          </div>
        ) : (
          <div className="divide-y">
            {/* Today */}
            {groupedNotifications.today.length > 0 && (
              <div>
                <div className="px-4 py-2 bg-muted/50 text-xs font-medium text-muted-foreground">
                  Bugün
                </div>
                {groupedNotifications.today.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onClick={() => { handleNotificationClick(notification); }}
                    onRemove={() => removeNotification(notification.id)}
                    onMarkRead={() => markAsRead(notification.id)}
                  />
                ))}
              </div>
            )}

            {/* Yesterday */}
            {groupedNotifications.yesterday.length > 0 && (
              <div>
                <div className="px-4 py-2 bg-muted/50 text-xs font-medium text-muted-foreground">
                  Dün
                </div>
                {groupedNotifications.yesterday.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onClick={() => handleNotificationClick(notification)}
                    onRemove={() => removeNotification(notification.id)}
                    onMarkRead={() => markAsRead(notification.id)}
                  />
                ))}
              </div>
            )}

            {/* Older */}
            {groupedNotifications.older.length > 0 && (
              <div>
                <div className="px-4 py-2 bg-muted/50 text-xs font-medium text-muted-foreground">
                  Daha Eski
                </div>
                {groupedNotifications.older.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onClick={() => handleNotificationClick(notification)}
                    onRemove={() => removeNotification(notification.id)}
                    onMarkRead={() => markAsRead(notification.id)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </ScrollArea>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="p-3 border-t flex justify-between items-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAll}
            className="text-xs text-muted-foreground hover:text-destructive gap-1"
          >
            <Trash2 className="h-3 w-3" />
            Tümünü Sil
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs gap-1"
            onClick={() => setIsOpen(false)}
          >
            <Settings className="h-3 w-3" />
            Ayarlar
          </Button>
        </div>
      )}
    </div>
  );
}

/**
 * Single Notification Item
 */
interface NotificationItemProps {
  notification: Notification;
  onClick: () => void;
  onRemove: () => void;
  onMarkRead: () => void;
}

function NotificationItem({
  notification,
  onClick,
  onRemove,
  onMarkRead,
}: NotificationItemProps) {
  const timeAgo = formatDistanceToNow(new Date(notification.createdAt), {
    addSuffix: true,
    locale: tr,
  });

  return (
    <div
      className={cn(
        'group relative flex gap-3 p-4 hover:bg-muted/50 transition-colors cursor-pointer',
        !notification.read && 'bg-primary/5'
      )}
      onClick={onClick}
    >
      {/* Unread indicator */}
      {!notification.read && (
        <div className="absolute left-1 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-primary" />
      )}

      {/* Icon */}
      <div className="shrink-0 mt-0.5">
        {typeIcons[notification.type]}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className={cn('text-sm font-medium truncate', !notification.read && 'font-semibold')}>
            {notification.title}
          </p>
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {timeAgo}
          </span>
        </div>
        <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5">
          {notification.message}
        </p>
        <div className="flex items-center gap-2 mt-2">
          <Badge variant="secondary" className="text-xs">
            {typeLabels[notification.type]}
          </Badge>
        </div>
      </div>

      {/* Actions */}
      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-start gap-1">
        {!notification.read && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={(e) => {
              e.stopPropagation();
              onMarkRead();
            }}
            title="Okundu işaretle"
          >
            <Check className="h-3 w-3" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-muted-foreground hover:text-destructive"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          title="Sil"
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}

export default NotificationBell;

