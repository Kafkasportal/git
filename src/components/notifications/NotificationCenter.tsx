'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import logger from '@/lib/logger';
import { workflowNotifications } from '@/lib/api/crud-factory';
import { fetchWithCsrf } from '@/lib/csrf-client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bell, Check, CheckCheck, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useNotificationStore } from '@/stores/notificationStore';
import { useNotificationStream } from '@/hooks/useNotificationStream';

interface NotificationCenterProps {
  userId: string;
}

// Static category icon mappings - defined outside component to avoid recreation
const CATEGORY_ICONS: Record<string, string> = {
  meeting: '📅',
  gorev: '✅',
  rapor: '📊',
  hatirlatma: '⏰',
};

// Static category color mappings - defined outside component to avoid recreation
const CATEGORY_COLORS: Record<string, string> = {
  meeting: 'bg-blue-100 text-blue-800',
  gorev: 'bg-green-100 text-green-800',
  rapor: 'bg-purple-100 text-purple-800',
  hatirlatma: 'bg-orange-100 text-orange-800',
};

const DEFAULT_CATEGORY_ICON = '📢';
const DEFAULT_CATEGORY_COLOR = 'bg-gray-100 text-gray-800';

export function NotificationCenter({ userId }: NotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all');

  const queryClient = useQueryClient();

  // Use Zustand store for notifications
  const store = useNotificationStore();
  const { notifications, markAsRead, markAllAsRead, deleteNotification, setNotifications } = store;
  // unreadCount is a function in the store, call it to get the value
  const unreadCountValue = store.unreadCount();

  // Initialize notifications from API on mount
  useEffect(() => {
    if (!userId) return;

    const fetchInitialNotifications = async () => {
      try {
        const response = await workflowNotifications.getAll({
          filters: { recipient: userId },
          limit: 50,
        });
        if (response.data) {
          // Convert API response to Notification format
          const convertedNotifications = response.data.map((n) => ({
            id: n.$id || n._id || String(Date.now()),
            type: (n.category || 'info') as 'info' | 'success' | 'warning' | 'error' | 'task' | 'meeting' | 'donation' | 'beneficiary' | 'message',
            title: n.title || '',
            message: n.body || '',
            read: n.status === 'okundu',
            createdAt: n.$createdAt || n.created_at || new Date().toISOString(),
            // Backward compatibility
            body: n.body,
            status: (n.status === 'okundu' ? 'read' : 'unread') as 'read' | 'unread',
            category: n.category,
            $id: n.$id,
            _id: n._id,
            $createdAt: n.$createdAt,
            created_at: n.created_at,
          }));
          setNotifications(convertedNotifications);
        }
      } catch (error) {
        logger.error('Failed to fetch initial notifications', { error });
      }
    };

    fetchInitialNotifications();
  }, [userId, setNotifications]);

  // Use SSE stream for real-time updates
  useNotificationStream(userId);

  const allNotifications = notifications;

  // Mutations
  const markAsReadMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetchWithCsrf(`/api/workflow-notifications/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'okundu' }),
      });
      return response;
    },
    onSuccess: (_data, id) => {
      markAsRead(id);
      queryClient.invalidateQueries({ queryKey: ['workflow-notifications', userId] });
      toast.success('Bildirim okundu olarak işaretlendi');
    },
    onError: () => {
      toast.error('Bildirim güncellenemedi');
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      // Mark all unread notifications as read
      const unreadNotifications = allNotifications.filter(
        (n) => !n.read
      );
      await Promise.all(
        unreadNotifications.map((n) => {
          const notificationId = n.$id || n._id;
          if (!notificationId) return Promise.resolve();
          return fetchWithCsrf(`/api/workflow-notifications/${notificationId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'okundu' }),
          });
        })
      );
    },
    onSuccess: () => {
      markAllAsRead();
      queryClient.invalidateQueries({ queryKey: ['workflow-notifications', userId] });
      toast.success('Tüm bildirimler okundu olarak işaretlendi');
    },
    onError: () => {
      toast.error('Bildirimler güncellenemedi');
    },
  });

  const deleteNotificationMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await workflowNotifications.delete(id);
      return response;
    },
    onSuccess: (_data, id) => {
      deleteNotification(id);
      queryClient.invalidateQueries({ queryKey: ['workflow-notifications', userId] });
      toast.success('Bildirim silindi');
    },
    onError: () => {
      toast.error('Bildirim silinemedi');
    },
  });

  // Memoize filtered notifications to avoid recalculating on every render
  const filteredNotifications = useMemo(() => {
    if (!allNotifications) return [];
    if (activeTab === 'unread') {
      return allNotifications.filter((notification) => !notification.read);
    }
    return allNotifications;
  }, [allNotifications, activeTab]);

  const handleMarkAsRead = useCallback((notificationId: string) => {
    markAsReadMutation.mutate(notificationId);
  }, [markAsReadMutation]);

  const handleMarkAllAsRead = useCallback(() => {
    markAllAsReadMutation.mutate();
  }, [markAllAsReadMutation]);

  const handleDelete = useCallback((notificationId: string) => {
    deleteNotificationMutation.mutate(notificationId);
  }, [deleteNotificationMutation]);

  // Simple lookup functions - no useCallback needed as they're pure and lightweight
  const getCategoryIcon = (category: string) => CATEGORY_ICONS[category] || DEFAULT_CATEGORY_ICON;
  const getCategoryColor = (category: string) => CATEGORY_COLORS[category] || DEFAULT_CATEGORY_COLOR;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCountValue > 0 ? (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCountValue > 99 ? '99+' : unreadCountValue}
            </Badge>
          ) : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold text-lg">Bildirimler</h3>
          <div className="flex items-center gap-2">
            {unreadCountValue > 0 ? (
              <Button variant="ghost" size="sm" onClick={handleMarkAllAsRead} className="text-xs">
                <CheckCheck className="h-4 w-4 mr-1" />
                Tümünü Okundu İşaretle
              </Button>
            ) : null}
          </div>
        </div>

        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as 'all' | 'unread')}
          className="w-full"
        >
          <TabsList className="w-full grid grid-cols-2">
            <TabsTrigger value="all">Tümü</TabsTrigger>
            <TabsTrigger value="unread">
              Okunmamış
              {unreadCountValue > 0 ? (
                <Badge variant="secondary" className="ml-2">
                  {unreadCountValue}
                </Badge>
              ) : null}
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="m-0">
            <ScrollArea className="h-[500px]">
              {filteredNotifications && filteredNotifications.length > 0 ? (
                <div className="divide-y">
                  {filteredNotifications.map((notification) => {
                    const notificationId = notification.$id || notification._id || '';
                    return (
                      <div
                        key={notificationId}
                        className={cn(
                          'p-4 hover:bg-muted/50 transition-colors',
                          !notification.read && 'bg-blue-50/50'
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 mt-1">
                            <span className="text-2xl">{getCategoryIcon(notification.category || '')}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1">
                                <p className="font-medium text-sm">{notification.title}</p>
                                {notification.body && (
                                  <p className="text-sm text-muted-foreground mt-1">
                                    {notification.body}
                                  </p>
                                )}
                                <div className="flex items-center gap-2 mt-2">
                                  <Badge
                                    variant="secondary"
                                    className={cn('text-xs', getCategoryColor(notification.category || ''))}
                                  >
                                    {notification.category}
                                  </Badge>
                                  <span className="text-xs text-muted-foreground">
                                    {notification.created_at || notification.$createdAt
                                      ? format(
                                          new Date(notification.created_at || notification.$createdAt || ''),
                                          'dd MMM yyyy, HH:mm',
                                          {
                                            locale: tr,
                                          }
                                        )
                                      : ''}
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center gap-1 flex-shrink-0">
                                {!notification.read && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7"
                                    onClick={() => handleMarkAsRead(notificationId)}
                                  >
                                    <Check className="h-4 w-4" />
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-destructive hover:text-destructive"
                                  onClick={() => handleDelete(notificationId)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 px-4">
                  <Bell className="h-12 w-12 text-muted-foreground mb-3" />
                  <p className="text-sm text-muted-foreground text-center">
                    {activeTab === 'unread'
                      ? 'Okunmamış bildiriminiz yok'
                      : 'Henüz bildiriminiz yok'}
                  </p>
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </PopoverContent>
    </Popover>
  );
}
