'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, MapPin, Users, Check, X, Info, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';

export type MeetingCategory = 'invitations' | 'participating' | 'informed' | 'open';

export interface Meeting {
  _id: string;
  title: string;
  meetingDate: string;
  startTime?: string;
  endTime?: string;
  location?: string;
  virtualLink?: string;
  organizer?: string;
  participantCount?: number;
  category: MeetingCategory;
  status?: 'pending' | 'accepted' | 'declined' | 'tentative';
  description?: string;
}

export interface MeetingTabsProps {
  meetings: Meeting[];
  onAccept?: (meetingId: string) => void;
  onDecline?: (meetingId: string) => void;
  isLoading?: boolean;
}

const categoryConfig = {
  invitations: {
    label: 'Davetler',
    description: 'Cevap beklediğiniz toplantı davetleri',
    icon: Calendar,
    color: 'blue',
  },
  participating: {
    label: 'Katılacağım',
    description: 'Kabul ettiğiniz toplantılar',
    icon: Check,
    color: 'green',
  },
  informed: {
    label: 'Bilgilendirme',
    description: 'Bilgi amaçlı gönderilen toplantılar',
    icon: Info,
    color: 'gray',
  },
  open: {
    label: 'Açık Toplantılar',
    description: 'Herkese açık toplantılar',
    icon: Globe,
    color: 'purple',
  },
};

function MeetingCard({
  meeting,
  onAccept,
  onDecline,
}: {
  meeting: Meeting;
  onAccept?: (id: string) => void;
  onDecline?: (id: string) => void;
}) {
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatTime = (time?: string) => {
    if (!time) return '';
    return time;
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h4 className="font-semibold text-base mb-2">{meeting.title}</h4>

            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>{formatDate(meeting.meetingDate)}</span>
              </div>

              {(meeting.startTime || meeting.endTime) && (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>
                    {formatTime(meeting.startTime)}
                    {meeting.endTime && ` - ${formatTime(meeting.endTime)}`}
                  </span>
                </div>
              )}

              {meeting.location && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  <span>{meeting.location}</span>
                </div>
              )}

              {meeting.virtualLink && (
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  <a
                    href={meeting.virtualLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    Sanal Toplantı Bağlantısı
                  </a>
                </div>
              )}

              {meeting.organizer && (
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span>Düzenleyen: {meeting.organizer}</span>
                </div>
              )}
            </div>

            {meeting.description && (
              <p className="mt-3 text-sm text-muted-foreground line-clamp-2">
                {meeting.description}
              </p>
            )}
          </div>

          <div className="ml-4 flex flex-col gap-2">
            {meeting.category === 'invitations' && (
              <>
                <Button
                  size="sm"
                  variant="default"
                  onClick={() => onAccept?.(meeting._id)}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Check className="h-4 w-4 mr-1" />
                  Kabul Et
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onDecline?.(meeting._id)}
                  className="border-red-600 text-red-600 hover:bg-red-50"
                >
                  <X className="h-4 w-4 mr-1" />
                  Reddet
                </Button>
              </>
            )}

            {meeting.status && meeting.category !== 'invitations' && (
              <Badge
                variant={meeting.status === 'accepted' ? 'default' : 'secondary'}
                className={cn(
                  meeting.status === 'accepted' && 'bg-green-600',
                  meeting.status === 'declined' && 'bg-red-600',
                  meeting.status === 'tentative' && 'bg-yellow-600'
                )}
              >
                {meeting.status === 'accepted' && 'Kabul Edildi'}
                {meeting.status === 'declined' && 'Reddedildi'}
                {meeting.status === 'tentative' && 'Kararsız'}
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyState({ category }: { category: MeetingCategory }) {
  const config = categoryConfig[category];
  const Icon = config.icon;

  const messages = {
    invitations: 'Henüz davet edildiğiniz bir toplantı bulunmamaktadır.',
    participating: 'Katılacağınız bir toplantı bulunmamaktadır.',
    informed: 'Bilgilendirildiğiniz bir toplantı bulunmamaktadır.',
    open: 'Açık toplantı bulunmamaktadır.',
  };

  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="rounded-full bg-muted p-6 mb-4">
        <Icon className="h-12 w-12 text-muted-foreground" />
      </div>
      <p className="text-lg font-medium text-muted-foreground">{messages[category]}</p>
    </div>
  );
}

export function MeetingTabs({ meetings, onAccept, onDecline, isLoading }: MeetingTabsProps) {
  const categorizedMeetings = {
    invitations: meetings.filter((m) => m.category === 'invitations'),
    participating: meetings.filter((m) => m.category === 'participating'),
    informed: meetings.filter((m) => m.category === 'informed'),
    open: meetings.filter((m) => m.category === 'open'),
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Toplantılar</CardTitle>
          <CardDescription>Toplantı bilgileri yükleniyor...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-muted rounded-lg animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Toplantılar</CardTitle>
        <CardDescription>
          Toplantı davetlerinizi ve katılacağınız toplantıları görüntüleyin
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="invitations" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            {(
              Object.entries(categoryConfig) as [
                MeetingCategory,
                (typeof categoryConfig)[MeetingCategory],
              ][]
            ).map(([key, config]) => {
              const Icon = config.icon;
              const count = categorizedMeetings[key].length;

              return (
                <TabsTrigger key={key} value={key} className="relative">
                  <Icon className="h-4 w-4 mr-2" />
                  {config.label}
                  {count > 0 && (
                    <Badge
                      variant="secondary"
                      className="ml-2 h-5 w-5 p-0 flex items-center justify-center text-xs"
                    >
                      {count}
                    </Badge>
                  )}
                </TabsTrigger>
              );
            })}
          </TabsList>

          {(
            Object.entries(categoryConfig) as [
              MeetingCategory,
              (typeof categoryConfig)[MeetingCategory],
            ][]
          ).map(([key, config]) => {
            const meetingList = categorizedMeetings[key];

            return (
              <TabsContent key={key} value={key} className="mt-6">
                <div className="mb-4">
                  <h3 className="font-semibold text-lg">{config.label}</h3>
                  <p className="text-sm text-muted-foreground">{config.description}</p>
                </div>

                {meetingList.length === 0 ? (
                  <EmptyState category={key} />
                ) : (
                  <div className="space-y-3">
                    {meetingList.map((meeting) => (
                      <MeetingCard
                        key={meeting._id}
                        meeting={meeting}
                        onAccept={onAccept}
                        onDecline={onDecline}
                      />
                    ))}
                  </div>
                )}
              </TabsContent>
            );
          })}
        </Tabs>
      </CardContent>
    </Card>
  );
}
