'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import dynamic from 'next/dynamic';
import { DemoBanner } from '@/components/ui/demo-banner';
import { MeetingsHeader } from './_components/MeetingsHeader';
import { useAuthStore } from '@/stores/authStore';
import { meetings as meetingsApi } from '@/lib/api/api-client';
import type { MeetingDocument } from '@/types/database';
import { Calendar, CheckCircle, XCircle } from 'lucide-react';
import { MeetingForm } from '@/components/forms/MeetingForm';

// Lazy load heavy components
const CalendarView = dynamic(
  () => import('@/components/meetings/CalendarView').then((m) => ({ default: m.CalendarView })),
  {
    loading: () => <div className="p-8 text-center">Yükleniyor...</div>,
    ssr: false,
  }
);

// MeetingListView component is not implemented yet
// const MeetingListView = dynamic(() => import('@/components/meetings/MeetingListView').then((m) => ({ default: m.MeetingListView })), {
//   loading: () => <div className="p-8 text-center">Yükleniyor...</div>,
//   ssr: false,
// });

export default function MeetingsPage() {
  const { user: _user } = useAuthStore();

  // View state
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState<MeetingDocument | null>(null);

  // Filter state (unused for now since list view is not implemented)
  const [_search, _setSearch] = useState('');
  const [_statusFilter, _setStatusFilter] = useState('all');
  const [_meetingTypeFilter, _setMeetingTypeFilter] = useState('all');

  // Fetch meetings
  const { data: meetingsData, isLoading } = useQuery({
    queryKey: ['meetings'],
    queryFn: () => meetingsApi.getAll(),
  });

  const meetings: MeetingDocument[] = (meetingsData?.data as MeetingDocument[]) || [];

  // Calculate statistics
  const totalMeetings = meetings.length;
  const upcomingMeetings = meetings.filter((m) => new Date(m.meeting_date) > new Date()).length;
  const completedMeetings = meetings.filter((m) => m.status === 'completed').length;
  const cancelledMeetings = meetings.filter((m) => m.status === 'cancelled').length;

  // Delete meeting functionality not yet implemented
  // See docs/ISSUES.md - Issue #9: Meeting Delete Functionality
  // const deleteMeetingMutation = useMutation({
  //   mutationFn: (meetingId: string) => meetingsApi.delete(meetingId),
  //   onSuccess: () => {
  //     queryClient.invalidateQueries({ queryKey: ['meetings'] });
  //     setMeetingToDelete(null);
  //     toast.success('Toplantı silindi');
  //   },
  //   onError: () => {
  //     toast.error('Toplantı silinemedi');
  //   },
  // });

  return (
    <div className="space-y-6">
      {/* Demo Banner */}
      <DemoBanner />

      {/* Header */}
      <MeetingsHeader
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onCreateMeeting={() => setShowCreateModal(true)}
      />

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Toplantı</CardTitle>
            <Calendar className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalMeetings}</div>
            <p className="text-xs text-muted-foreground mt-1">Tüm toplantılar</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Yaklaşan</CardTitle>
            <Calendar className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{upcomingMeetings}</div>
            <p className="text-xs text-muted-foreground mt-1">Gelecek toplantılar</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tamamlanan</CardTitle>
            <CheckCircle className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedMeetings}</div>
            <p className="text-xs text-muted-foreground mt-1">Tamamlanan toplantılar</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">İptal Edilen</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{cancelledMeetings}</div>
            <p className="text-xs text-muted-foreground mt-1">İptal edilen toplantılar</p>
          </CardContent>
        </Card>
      </div>

      {/* Main View */}
      <Card>
        <CardHeader>
          <CardTitle>{viewMode === 'calendar' ? 'Takvim Görünümü' : 'Liste Görünümü'}</CardTitle>
          <CardDescription>Toplantılarınızı yönetin</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center p-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : viewMode === 'calendar' ? (
            <CalendarView
              meetings={meetings}
              onMeetingClick={setSelectedMeeting}
              onDateClick={(_date) => setShowCreateModal(true)}
            />
          ) : (
            <div className="p-8 text-center text-muted-foreground">
              Liste görünümü henüz uygulanmadı. Lütfen takvim görünümünü kullanın.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Meeting Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Yeni Toplantı Oluştur</DialogTitle>
            <DialogDescription>Yeni bir toplantı oluşturmak için formu doldurun</DialogDescription>
          </DialogHeader>
          <MeetingForm
            onSuccess={() => setShowCreateModal(false)}
            onCancel={() => setShowCreateModal(false)}
          />
        </DialogContent>
      </Dialog>

      {/* View/Edit Meeting Modal */}
      <Dialog open={!!selectedMeeting} onOpenChange={() => setSelectedMeeting(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Toplantı Detayları</DialogTitle>
            <DialogDescription>Toplantı bilgilerini görüntüleyin veya düzenleyin</DialogDescription>
          </DialogHeader>
          {selectedMeeting && (
            <MeetingForm
              initialData={selectedMeeting}
              onSuccess={() => setSelectedMeeting(null)}
              onCancel={() => setSelectedMeeting(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
