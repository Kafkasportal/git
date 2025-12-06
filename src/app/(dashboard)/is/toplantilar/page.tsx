"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import dynamic from "next/dynamic";
import { toast } from "sonner";
import { DemoBanner } from "@/components/ui/demo-banner";
import { MeetingsHeader } from "./_components/MeetingsHeader";
import { ExportMenu } from "@/components/ui/export-menu";
import { useFilters } from '@/hooks/useFilters';
import { FilterPanel, FilterField } from '@/components/ui/filter-panel';
import { meetings as meetingsApi } from "@/lib/api/crud-factory";
import type { MeetingDocument } from "@/types/database";
import { Calendar, CheckCircle, XCircle } from "lucide-react";
import { MeetingForm } from "@/components/forms/MeetingForm";

// Lazy load heavy components
const CalendarView = dynamic(
  () =>
    import("@/components/meetings/CalendarView").then((m) => ({
      default: m.CalendarView,
    })),
  {
    loading: () => <div className="p-8 text-center">Yükleniyor...</div>,
    ssr: false,
  },
);

// Dynamic import for MeetingListView - lazy load for better performance
const MeetingListView = dynamic(
  () =>
    import('@/components/meetings/MeetingListView').then((m) => ({
      default: m.MeetingListView,
    })),
  {
    loading: () => <div className="p-8 text-center">Yükleniyor...</div>,
    ssr: false,
  }
);

export default function MeetingsPage() {
  const queryClient = useQueryClient();

  // View state
  const [viewMode, setViewMode] = useState<"calendar" | "list">("calendar");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedMeeting, setSelectedMeeting] =
    useState<MeetingDocument | null>(null);
  const [meetingToDelete, setMeetingToDelete] = useState<string | null>(null);

  const { filters, resetFilters, handleFiltersChange } = useFilters({
    syncWithUrl: true,
    presetsKey: 'meetings-filters',
  });

  // Fetch meetings
  const { data: meetingsData, isLoading } = useQuery({
    queryKey: ["meetings", filters],
    queryFn: () => meetingsApi.getAll({
      filters: {
        ...(filters.status && typeof filters.status === 'string' && { status: filters.status }),
        ...(filters.type && typeof filters.type === 'string' && { type: filters.type }),
      } as Record<string, string | number | boolean | undefined>,
      search: filters.search as string,
    }),
  });

  const meetings: MeetingDocument[] =
    (meetingsData?.data as MeetingDocument[]) || [];

  const filterFields: FilterField[] = [
    {
      key: 'search',
      label: 'Arama',
      type: 'text',
      placeholder: 'Toplantı başlığı ile ara...',
    },
    {
      key: 'status',
      label: 'Durum',
      type: 'select',
      options: [
        { label: 'Planlandı', value: 'scheduled' },
        { label: 'Tamamlandı', value: 'completed' },
        { label: 'İptal Edildi', value: 'cancelled' },
      ],
    },
    {
      key: 'type',
      label: 'Tür',
      type: 'select',
      options: [
        { label: 'Yönetim Kurulu', value: 'board' },
        { label: 'Genel Kurul', value: 'general' },
        { label: 'Komite', value: 'committee' },
        { label: 'Diğer', value: 'other' },
      ],
    },
  ];

  // Calculate statistics
  const totalMeetings = meetings.length;
  const upcomingMeetings = meetings.filter(
    (m) => new Date(m.meeting_date) > new Date(),
  ).length;
  const completedMeetings = meetings.filter(
    (m) => m.status === "completed",
  ).length;
  const cancelledMeetings = meetings.filter(
    (m) => m.status === "cancelled",
  ).length;

  // Delete meeting mutation
  const deleteMeetingMutation = useMutation({
    mutationFn: (meetingId: string) => meetingsApi.delete(meetingId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["meetings"] });
      setMeetingToDelete(null);
      setSelectedMeeting(null); // Close the details modal if open
      toast.success("Toplantı silindi");
    },
    onError: () => {
      toast.error("Toplantı silinemedi");
    },
  });

  return (
    <div className="space-y-6">
      {/* Demo Banner */}
      <DemoBanner />

      {/* Header */}
      <MeetingsHeader
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onCreateMeeting={() => setShowCreateModal(true)}
      >
        <ExportMenu
          data={meetings}
          filename="toplantilar"
          title="Toplantı Listesi"
        />
      </MeetingsHeader>

      <FilterPanel
        fields={filterFields}
        onFiltersChange={handleFiltersChange}
        onReset={resetFilters}
      />

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Toplam Toplantı
            </CardTitle>
            <Calendar className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalMeetings}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Tüm toplantılar
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Yaklaşan</CardTitle>
            <Calendar className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {upcomingMeetings}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Gelecek toplantılar
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tamamlanan</CardTitle>
            <CheckCircle className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedMeetings}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Tamamlanan toplantılar
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">İptal Edilen</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {cancelledMeetings}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              İptal edilen toplantılar
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main View */}
      <Card>
        <CardHeader>
          <CardTitle>
            {viewMode === "calendar" ? "Takvim Görünümü" : "Liste Görünümü"}
          </CardTitle>
          <CardDescription>Toplantılarınızı yönetin</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center p-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : viewMode === "calendar" ? (
            <CalendarView
              meetings={meetings}
              onMeetingClick={setSelectedMeeting}
              onDateClick={(_date) => setShowCreateModal(true)}
            />
          ) : (
            <MeetingListView
              meetings={meetings.map(m => ({
                id: m.$id || '',
                title: m.title,
                description: m.description,
                date: m.meeting_date,
                location: m.location,
                type: (m.meeting_type === 'board' ? 'in_person' : m.meeting_type === 'general' ? 'in_person' : 'hybrid') as 'in_person' | 'online' | 'hybrid',
                status: m.status as 'scheduled' | 'in_progress' | 'completed' | 'cancelled',
                participants: [],
                createdAt: m.$createdAt || new Date().toISOString(),
              }))}
              onView={(meeting) => {
                const original = meetings.find(m => m.$id === meeting.id);
                if (original) setSelectedMeeting(original);
              }}
              onEdit={(meeting) => {
                const original = meetings.find(m => m.$id === meeting.id);
                if (original) setSelectedMeeting(original);
              }}
              onDelete={(meeting) => setMeetingToDelete(meeting.id)}
              isLoading={isLoading}
            />
          )}
        </CardContent>
      </Card>

      {/* Create Meeting Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Yeni Toplantı Oluştur</DialogTitle>
            <DialogDescription>
              Yeni bir toplantı oluşturmak için formu doldurun
            </DialogDescription>
          </DialogHeader>
          <MeetingForm
            onSuccess={() => setShowCreateModal(false)}
            onCancel={() => setShowCreateModal(false)}
          />
        </DialogContent>
      </Dialog>

      {/* View/Edit Meeting Modal */}
      <Dialog
        open={!!selectedMeeting}
        onOpenChange={() => setSelectedMeeting(null)}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Toplantı Detayları</DialogTitle>
            <DialogDescription>
              Toplantı bilgilerini görüntüleyin veya düzenleyin
            </DialogDescription>
          </DialogHeader>
          {selectedMeeting && (
            <MeetingForm
              initialData={selectedMeeting}
              meetingId={selectedMeeting.$id}
              onSuccess={() => setSelectedMeeting(null)}
              onCancel={() => setSelectedMeeting(null)}
              onDelete={() => setMeetingToDelete(selectedMeeting.$id || null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!meetingToDelete}
        onOpenChange={(open) => !open && setMeetingToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Toplantıyı silmek istediğinize emin misiniz?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Bu işlem geri alınamaz. Toplantı kalıcı olarak silinecektir.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMeetingMutation.isPending}>
              İptal
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={(e) => {
                e.preventDefault();
                if (meetingToDelete) {
                  deleteMeetingMutation.mutate(meetingToDelete);
                }
              }}
              disabled={deleteMeetingMutation.isPending}
            >
              {deleteMeetingMutation.isPending ? "Siliniyor..." : "Sil"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
