'use client';

import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, MapPin, Users, CalendarDays } from 'lucide-react';

import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

import type { MeetingDocument } from '@/types/database';
import { meetingTypeLabels, meetingStatusLabels } from '@/lib/validations/meeting';

interface CalendarViewProps {
  meetings: MeetingDocument[];
  onMeetingClick: (meeting: MeetingDocument) => void;
  onDateClick: (date: Date) => void;
}

export function CalendarView({ meetings, onMeetingClick, onDateClick }: CalendarViewProps) {
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

  // Group meetings by date
  const meetingsByDate = useMemo(() => {
    const grouped = new Map<string, MeetingDocument[]>();

    meetings.forEach((meeting) => {
      const dateKey = format(new Date(meeting.meeting_date), 'yyyy-MM-dd');
      const existing = grouped.get(dateKey) || [];
      grouped.set(dateKey, [...existing, meeting]);
    });

    return grouped;
  }, [meetings]);

  // Get meetings for selected date
  const selectedDateMeetings = useMemo(() => {
    if (!selectedDate) {
      // Show upcoming meetings (next 7 days)
      const today = new Date();
      const sevenDaysLater = new Date(today);
      sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);

      return meetings
        .filter((m) => {
          const meetingDate = new Date(m.meeting_date);
          return meetingDate >= today && meetingDate <= sevenDaysLater;
        })
        .sort((a, b) => new Date(a.meeting_date).getTime() - new Date(b.meeting_date).getTime())
        .slice(0, 5);
    }

    const dateKey = format(selectedDate, 'yyyy-MM-dd');
    return meetingsByDate.get(dateKey) || [];
  }, [selectedDate, meetings, meetingsByDate]);

  // Get meeting type color
  const getMeetingTypeColor = (type: string) => {
    switch (type) {
      case 'general':
        return 'bg-primary';
      case 'committee':
        return 'bg-secondary';
      case 'board':
        return 'bg-destructive';
      default:
        return 'bg-muted';
    }
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'default';
      case 'ongoing':
        return 'secondary';
      case 'completed':
        return 'outline';
      case 'cancelled':
        return 'destructive';
      default:
        return 'default';
    }
  };

  // Custom day renderer with meeting indicators
  const modifiers = useMemo(() => {
    const datesWithMeetings: Date[] = [];

    meetingsByDate.forEach((_, dateKey) => {
      datesWithMeetings.push(new Date(dateKey));
    });

    return {
      hasMeetings: datesWithMeetings,
    };
  }, [meetingsByDate]);

  const modifiersStyles = {
    hasMeetings: {
      fontWeight: 'bold',
      textDecoration: 'underline',
      textDecorationColor: '#3b82f6',
      textDecorationThickness: '2px',
    },
  };

  const handlePreviousMonth = () => {
    const newMonth = new Date(selectedMonth);
    newMonth.setMonth(newMonth.getMonth() - 1);
    setSelectedMonth(newMonth);
  };

  const handleNextMonth = () => {
    const newMonth = new Date(selectedMonth);
    newMonth.setMonth(newMonth.getMonth() + 1);
    setSelectedMonth(newMonth);
  };

  const handleToday = () => {
    const today = new Date();
    setSelectedMonth(today);
    setSelectedDate(today);
  };

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
  };

  const handleDateDoubleClick = (date: Date) => {
    onDateClick(date);
  };

  return (
    <div className="space-y-6">
      {/* Calendar Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Toplantı Takvimi</CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleToday}>
                Bugün
              </Button>
              <Button variant="ghost" size="icon" onClick={handlePreviousMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="min-w-[120px] text-center text-sm font-medium">
                {format(selectedMonth, 'MMMM yyyy', { locale: tr })}
              </span>
              <Button variant="ghost" size="icon" onClick={handleNextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleDateSelect}
            month={selectedMonth}
            onMonthChange={setSelectedMonth}
            modifiers={modifiers}
            modifiersStyles={modifiersStyles}
            locale={tr}
            className="rounded-md border"
          />

          {/* Meeting indicators legend */}
          <div className="mt-4 flex items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-blue-500" />
              <span>Genel</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-purple-500" />
              <span>Komite</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-red-500" />
              <span>Yönetim Kurulu</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-gray-500" />
              <span>Diğer</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Selected Date Meetings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5" />
            {selectedDate
              ? format(selectedDate, 'dd MMMM yyyy', { locale: tr })
              : 'Yaklaşan Toplantılar (7 Gün)'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {selectedDateMeetings.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {selectedDate
                ? 'Bu tarihte toplantı yok'
                : 'Önümüzdeki 7 gün içinde planlanmış toplantı yok'}
              <div className="mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => selectedDate && handleDateDoubleClick(selectedDate)}
                >
                  Yeni Toplantı Oluştur
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {selectedDateMeetings.map((meeting) => {
                const meetingDate = new Date(meeting.meeting_date);
                const meetingTime = format(meetingDate, 'HH:mm');

                return (
                  <Card
                    key={meeting._id}
                    className="cursor-pointer transition-all hover:shadow-md hover:bg-blue-50"
                    onClick={() => onMeetingClick(meeting)}
                  >
                    <CardContent className="p-4">
                      <div className="space-y-2">
                        {/* Time and Status */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-sm font-semibold text-blue-600">
                            <span>{meetingTime}</span>
                          </div>
                          <Badge variant={getStatusColor(meeting.status)}>
                            {meetingStatusLabels[meeting.status]}
                          </Badge>
                        </div>

                        {/* Title */}
                        <h4 className="font-semibold text-gray-900">{meeting.title}</h4>

                        {/* Meeting Type */}
                        <div className="flex items-center gap-2">
                          <div
                            className={`h-2 w-2 rounded-full ${getMeetingTypeColor(meeting.meeting_type)}`}
                          />
                          <span className="text-sm text-gray-600">
                            {meetingTypeLabels[meeting.meeting_type]}
                          </span>
                        </div>

                        {/* Location */}
                        {meeting.location && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <MapPin className="h-3 w-3" />
                            <span className="truncate">{meeting.location}</span>
                          </div>
                        )}

                        {/* Participants */}
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Users className="h-3 w-3" />
                          <span>{meeting.participants.length} katılımcı</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
