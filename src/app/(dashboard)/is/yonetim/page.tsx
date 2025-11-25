'use client';

import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import { tr } from 'date-fns/locale';
import {
  CheckCircle,
  ClipboardCheck,
  ClipboardList,
  Clock,
  Crown,
  ListChecks,
  Loader2,
  MapPin,
  Users,
} from 'lucide-react';

import { apiClient as api } from '@/lib/api/api-client';
import { useAuthStore } from '@/stores/authStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import {
  meetingActionItemStatusColors,
  meetingActionItemStatusLabels,
  meetingDecisionStatusColors,
  meetingDecisionStatusLabels,
  workflowNotificationCategoryLabels,
  workflowNotificationStatusColors,
  workflowNotificationStatusLabels,
} from '@/lib/validations/meetingActionItem';
import type {
  MeetingActionItemDocument,
  MeetingDecisionDocument,
  MeetingDocument,
  WorkflowNotificationDocument,
} from '@/types/database';
import { cn } from '@/lib/utils';

function formatDate(date: string | undefined) {
  if (!date) return '-';
  try {
    return format(parseISO(date), 'dd MMM yyyy HH:mm', { locale: tr });
  } catch {
    return date;
  }
}

function getMeetingLocation(meeting: MeetingDocument) {
  if (meeting.location) {
    return meeting.location;
  }
  if (meeting.meeting_type === 'board') {
    return 'Yönetim Kurulu';
  }
  return 'Merkez Ofis';
}

export default function WorkManagementPage() {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const isAdmin = Boolean(user?.permissions?.includes('users:manage'));

  const { data: meetingsResponse, isLoading: isLoadingMeetings } = useQuery({
    queryKey: ['workflow-meetings'],
    queryFn: () => api.meetings.getMeetings({ limit: 5 }),
  });
  const meetings = meetingsResponse?.data ?? [];

  const { data: decisionsResponse, isLoading: isLoadingDecisions } = useQuery({
    queryKey: ['workflow-decisions'],
    queryFn: () => api.meetingDecisions.getDecisions({ limit: 10 }),
  });
  const decisions = (decisionsResponse?.data ?? []) as MeetingDecisionDocument[];

  const {
    data: myActionItemsResponse,
    isLoading: isLoadingMyActions,
    isFetching: isFetchingMyActions,
  } = useQuery({
    queryKey: ['workflow-action-items', user?.id],
    queryFn: () =>
      user?.id
        ? api.meetingActionItems.getActionItems({
            limit: 50,
            filters: { assigned_to: user.id },
          })
        : { data: [], error: null },
    enabled: Boolean(user?.id),
    retry: false,
  });

  const myActionItems = (myActionItemsResponse?.data ?? []) as MeetingActionItemDocument[];

  const { data: allActionItemsResponse, isLoading: isLoadingAllActions } = useQuery({
    queryKey: ['workflow-action-items-all'],
    queryFn: () => api.meetingActionItems.getActionItems({ limit: 200 }),
    enabled: isAdmin,
  });

  const allActionItems = (allActionItemsResponse?.data ?? []) as MeetingActionItemDocument[];

  const { data: notificationsResponse, isLoading: isLoadingNotifications } = useQuery({
    queryKey: ['workflow-notifications'],
    queryFn: () =>
      api.workflowNotifications.getNotifications({
        limit: 20,
        filters: isAdmin ? {} : { recipient: user?.id },
      }),
    enabled: Boolean(user?.id),
  });

  const notifications = (notificationsResponse?.data ?? []) as WorkflowNotificationDocument[];

  const completeRatio = useMemo(() => {
    if (!isAdmin || allActionItems.length === 0) return 0;
    const completed = allActionItems.filter((item) => item.status === 'hazir').length;
    return Math.round((completed / allActionItems.length) * 100);
  }, [allActionItems, isAdmin]);

  const statusBreakdown = useMemo(() => {
    const source = isAdmin ? allActionItems : myActionItems;
    return {
      beklemede: source.filter((item) => item.status === 'beklemede').length,
      devam: source.filter((item) => item.status === 'devam').length,
      hazir: source.filter((item) => item.status === 'hazir').length,
      iptal: source.filter((item) => item.status === 'iptal').length,
    };
  }, [allActionItems, isAdmin, myActionItems]);

  const updateStatusMutation = useMutation({
    mutationFn: ({
      id,
      status,
      note,
    }: {
      id: string;
      status: MeetingActionItemDocument['status'];
      note?: string;
    }) =>
      api.meetingActionItems.updateActionItemStatus(id, {
        status,
        changed_by: user?.id ?? '',
        note,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['workflow-action-items', user?.id] });
      void queryClient.invalidateQueries({ queryKey: ['workflow-action-items-all'] });
      void queryClient.invalidateQueries({ queryKey: ['workflow-notifications'] });
    },
  });

  const upcomingMeetings = meetings.slice(0, 3);
  const recentDecisions = decisions.slice(0, 6);
  const pendingNotifications = notifications.filter((item) => item.status !== 'okundu');

  const isMyListEmpty = !isLoadingMyActions && myActionItems.length === 0;

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold">İş Yönetimi Paneli</h1>
          <p className="text-muted-foreground">
            Toplantı kararlarını ve görevlerini takip edin, dernek başkanına durum bildirin.
          </p>
        </div>
        {isAdmin && (
          <Badge variant="outline" className="gap-1 border-primary text-primary">
            <Crown className="h-4 w-4" />
            Dernek Başkanı
          </Badge>
        )}
      </section>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4" />
            Genel Görünüm
          </TabsTrigger>
          <TabsTrigger value="tasks" className="flex items-center gap-2">
            <ListChecks className="h-4 w-4" />
            Görevlerim
          </TabsTrigger>
          <TabsTrigger value="decisions" className="flex items-center gap-2">
            <ClipboardCheck className="h-4 w-4" />
            Toplantı Kararları
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Bildirimler
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Yaklaşan Toplantılar</span>
                  {isLoadingMeetings && (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {upcomingMeetings.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Planlanmış toplantı bulunmuyor.</p>
                ) : (
                  upcomingMeetings.map((meeting) => (
                    <div
                      key={meeting._id}
                      className="rounded-lg border p-4 transition hover:border-primary/40 hover:shadow-sm"
                    >
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold">{meeting.title}</h3>
                        <Badge variant="outline">{meetingStatusLabel(meeting.status)}</Badge>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {formatDate(meeting.meeting_date)}
                      </p>
                      <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {getMeetingLocation(meeting)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {meeting.participants.length} kişi
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Görev Durumları</span>
                  {(isLoadingMyActions || isLoadingAllActions || isFetchingMyActions) && (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {Object.entries(statusBreakdown).map(([status, count]) => (
                  <div key={status} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="secondary"
                        className={cn(
                          'capitalize',
                          meetingActionItemStatusColors[
                            status as keyof typeof meetingActionItemStatusColors
                          ]
                        )}
                      >
                        {
                          meetingActionItemStatusLabels[
                            status as keyof typeof meetingActionItemStatusLabels
                          ]
                        }
                      </Badge>
                    </div>
                    <span className="font-semibold">{count}</span>
                  </div>
                ))}
                {isAdmin && (
                  <div className="pt-4">
                    <p className="text-xs text-muted-foreground">Tamamlanan görev oranı</p>
                    <div className="mt-2 flex items-center gap-2">
                      <Progress value={completeRatio} className="h-2 flex-1" />
                      <span className="w-8 text-right text-xs font-semibold">{completeRatio}%</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Bildirim Özeti</span>
                  {isLoadingNotifications && (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {pendingNotifications.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Bekleyen bildiriminiz yok.</p>
                ) : (
                  pendingNotifications.slice(0, 4).map((notification) => (
                    <div key={notification._id} className="rounded-lg border p-3">
                      <div className="flex items-center justify-between text-sm">
                        <h3 className="font-medium">{notification.title}</h3>
                        <Badge
                          variant="outline"
                          className={
                            workflowNotificationStatusColors[notification.status] ??
                            'border-muted text-muted-foreground'
                          }
                        >
                          {workflowNotificationStatusLabels[notification.status]}
                        </Badge>
                      </div>
                      {notification.category && (
                        <p className="text-xs text-muted-foreground">
                          {workflowNotificationCategoryLabels[notification.category]}
                        </p>
                      )}
                      <p className="mt-1 text-xs text-muted-foreground">
                        {formatDate(notification.created_at)}
                      </p>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="tasks">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Bu Haftaki Görevlerim</span>
                {(isLoadingMyActions || isFetchingMyActions) && (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isMyListEmpty ? (
                <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                  Atanmış göreviniz bulunmuyor.
                </div>
              ) : (
                myActionItems.map((item) => (
                  <div
                    key={item._id}
                    className="rounded-lg border p-4 transition hover:border-primary/40 hover:shadow-sm"
                  >
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-semibold">{item.title}</h3>
                          <Badge
                            className={cn('capitalize', meetingActionItemStatusColors[item.status])}
                          >
                            {meetingActionItemStatusLabels[item.status]}
                          </Badge>
                        </div>
                        {item.description && (
                          <p className="text-xs text-muted-foreground">{item.description}</p>
                        )}
                        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                          <span>Toplantı: {item.meeting_id.slice(0, 6)}...</span>
                          {item.due_date && <span>Son Tarih: {formatDate(item.due_date)}</span>}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {item.status !== 'hazir' && (
                          <Button
                            size="sm"
                            onClick={() =>
                              updateStatusMutation.mutate({
                                id: item._id || item.$id || '',
                                status: 'hazir',
                                note: 'Görev tamamlandı olarak işaretlendi',
                              })
                            }
                            disabled={updateStatusMutation.isPending || !user?.id}
                          >
                            {updateStatusMutation.isPending ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                              <CheckCircle className="mr-2 h-4 w-4" />
                            )}
                            Hazır İşaretle
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="decisions">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Toplantı Kararları</span>
                {isLoadingDecisions && (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentDecisions.length === 0 ? (
                <p className="text-sm text-muted-foreground">Henüz karar kaydı bulunmuyor.</p>
              ) : (
                recentDecisions.map((decision) => (
                  <div key={decision._id} className="rounded-lg border p-4">
                    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-semibold">{decision.title}</h3>
                          <Badge
                            variant="secondary"
                            className={meetingDecisionStatusColors[decision.status]}
                          >
                            {meetingDecisionStatusLabels[decision.status]}
                          </Badge>
                        </div>
                        {decision.summary && (
                          <p className="mt-1 text-xs text-muted-foreground">{decision.summary}</p>
                        )}
                      </div>
                      <div className="space-y-1 text-right text-xs text-muted-foreground">
                        <p>Oluşturan: {decision.created_by.slice(0, 6)}...</p>
                        <p>Oluşturma: {formatDate(decision.created_at)}</p>
                        {decision.due_date && <p>Hedef Tarih: {formatDate(decision.due_date)}</p>}
                      </div>
                    </div>
                    {decision.owner && (
                      <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                        <Users className="h-3 w-3" />
                        Sorumlu: {decision.owner.slice(0, 6)}...
                      </div>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{isAdmin ? 'Dernek Başkanı Bildirimleri' : 'Bildirimlerim'}</span>
                {isLoadingNotifications && (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {notifications.length === 0 ? (
                <p className="text-sm text-muted-foreground">Henüz bildirim oluşturulmadı.</p>
              ) : (
                notifications.map((notification) => (
                  <div key={notification._id} className="rounded-lg border p-4">
                    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-semibold">{notification.title}</h3>
                          <Badge
                            variant="outline"
                            className={workflowNotificationStatusColors[notification.status]}
                          >
                            {workflowNotificationStatusLabels[notification.status]}
                          </Badge>
                        </div>
                        {notification.body && (
                          <p className="mt-1 text-xs text-muted-foreground">{notification.body}</p>
                        )}
                      </div>
                      <div className="space-y-1 text-right text-xs text-muted-foreground">
                        <p>
                          Gönderim: {formatDate(notification.sent_at ?? notification.created_at)}
                        </p>
                        {notification.reference && (
                          <p>
                            Referans: {notification.reference.type}#
                            {notification.reference.id.slice(0, 6)}...
                          </p>
                        )}
                      </div>
                    </div>
                    <Separator className="my-3" />
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span>
                        Kategori:{' '}
                        {workflowNotificationCategoryLabels[notification.category ?? 'meeting']}
                      </span>
                      {notification.triggered_by && (
                        <span>Oluşturan: {notification.triggered_by.slice(0, 6)}...</span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function meetingStatusLabel(status: MeetingDocument['status']) {
  switch (status) {
    case 'scheduled':
      return 'Planlandı';
    case 'ongoing':
      return 'Devam Ediyor';
    case 'completed':
      return 'Tamamlandı';
    case 'cancelled':
      return 'İptal Edildi';
    default:
      return status;
  }
}
