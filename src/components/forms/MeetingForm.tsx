'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { User, MapPin, Users, FileText, Clock, AlertCircle } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import { Badge } from '@/components/ui/badge';

import { apiClient as api } from '@/lib/api/api-client';
import { useAuthStore } from '@/stores/authStore';
import { useFormMutation } from '@/hooks/useFormMutation';
import { toast } from 'sonner';
import {
  meetingSchema,
  meetingEditSchema,
  type MeetingFormData,
  type MeetingEditFormData,
  isWithinOneHour,
  meetingTypeLabels,
  meetingStatusLabels,
} from '@/lib/validations/meeting';

interface MeetingFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  initialData?: Partial<MeetingFormData>;
  meetingId?: string;
}

export function MeetingForm({ onSuccess, onCancel, initialData, meetingId }: MeetingFormProps) {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const isEditMode = !!meetingId;

  const [selectedParticipants, setSelectedParticipants] = useState<string[]>(
    initialData?.participants || []
  );
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    initialData?.meeting_date ? new Date(initialData.meeting_date) : undefined
  );
  const [selectedTime, setSelectedTime] = useState<string>(() => {
    if (initialData?.meeting_date) {
      const date = new Date(initialData.meeting_date);
      return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    }
    return '';
  });

  // Fetch users for participant selection - disabled for now
  // const { data: usersResponse, isLoading: isLoadingUsers } = useQuery({
  //   queryKey: ['users'],
  //   queryFn: () => api.users.getUsers({ limit: 100 }),
  // });

  const users: Array<{ _id: string; name: string }> = []; // Empty for now

  // Form setup
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(isEditMode ? meetingEditSchema : meetingSchema),
    defaultValues: {
      ...initialData,
      organizer: user?.id || '',
      status: initialData?.status || 'scheduled',
      meeting_type: initialData?.meeting_type || 'general',
    },
  });

  // Watch status for conditional UI
  const watchedStatus = watch('status');

  // Auto-set organizer when user is loaded
  useEffect(() => {
    if (user?.id && !isEditMode) {
      setValue('organizer', user.id);
      // Auto-add organizer to participants if not already there
      if (!selectedParticipants.includes(user.id)) {
        setSelectedParticipants([...selectedParticipants, user.id]);
      }
    }
  }, [user, isEditMode, setValue, selectedParticipants]);

  // Update participants in form when selection changes
  useEffect(() => {
    setValue('participants', selectedParticipants);
  }, [selectedParticipants, setValue]);

  // Update meeting_date when date or time changes
  useEffect(() => {
    if (selectedDate && selectedTime) {
      const [hours, minutes] = selectedTime.split(':').map(Number);
      const combined = new Date(selectedDate);
      combined.setHours(hours, minutes, 0, 0);
      setValue('meeting_date', combined.toISOString());
    }
  }, [selectedDate, selectedTime, setValue]);

  // Create/Update mutation
  const mutation = useFormMutation<unknown, MeetingFormData | MeetingEditFormData>({
    queryKey: ['meetings'],
    successMessage: isEditMode
      ? 'Toplantı başarıyla güncellendi'
      : 'Toplantı başarıyla oluşturuldu',
    errorMessage: `Toplantı ${isEditMode ? 'güncellenirken' : 'oluşturulurken'} hata oluştu`,
    mutationFn: async (data: MeetingFormData | MeetingEditFormData) => {
      if (isEditMode && meetingId) {
        return await api.meetings.updateMeeting(meetingId, data);
      } else {
        return await api.meetings.createMeeting(data);
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
      void queryClient.invalidateQueries({ queryKey: ['upcoming-meetings-count'] });
      onSuccess?.();
    },
  });

  // Start meeting mutation
  const startMeetingMutation = useFormMutation<unknown, unknown>({
    queryKey: ['meetings'],
    successMessage: 'Toplantı başlatıldı',
    errorMessage: 'Toplantı başlatılırken hata oluştu',
    mutationFn: async () => {
      if (!meetingId) return {} as unknown;
      return await api.meetings.updateMeetingStatus(meetingId, 'ongoing');
    },
    onSuccess,
  });

  const onSubmit = (data: MeetingFormData | MeetingEditFormData) => {
    mutation.mutate(data);
  };

  const handleParticipantToggle = (userId: string) => {
    if (selectedParticipants.includes(userId)) {
      // Don't allow removing organizer
      if (userId === user?.id) {
        toast.error('Düzenleyen katılımcılardan çıkarılamaz');
        return;
      }
      setSelectedParticipants(selectedParticipants.filter((id) => id !== userId));
    } else {
      if (selectedParticipants.length >= 50) {
        toast.error('En fazla 50 katılımcı seçilebilir');
        return;
      }
      setSelectedParticipants([...selectedParticipants, userId]);
    }
  };

  const getUserName = (userId: string) => {
    const userObj = users.find((u) => u._id === userId);
    return userObj?.name || userId;
  };

  // Check if meeting is within 1 hour
  const meetingDate = watch('meeting_date');
  const showTimeWarning = meetingDate && !isEditMode && isWithinOneHour(meetingDate);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{isEditMode ? 'Toplantıyı Düzenle' : 'Yeni Toplantı Oluştur'}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">
              Başlık <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              {...register('title')}
              placeholder="Toplantı başlığını girin"
              className="h-9"
              autoFocus
            />
            {errors.title && <p className="text-sm text-red-500">{errors.title.message}</p>}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Açıklama</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="Toplantı açıklamasını girin"
              rows={4}
            />
            {errors.description && (
              <p className="text-sm text-red-500">{errors.description.message}</p>
            )}
          </div>

          {/* Meeting Date & Time */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="meeting_date">
                Tarih <span className="text-red-500">*</span>
              </Label>
              <DatePicker
                value={selectedDate}
                onChange={setSelectedDate}
                disabled={isEditMode ? false : undefined}
              />
              {errors.meeting_date && (
                <p className="text-sm text-red-500">{errors.meeting_date.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="meeting_time">
                Saat <span className="text-red-500">*</span>
              </Label>
              <Input
                id="meeting_time"
                type="time"
                value={selectedTime}
                onChange={(e) => setSelectedTime(e.target.value)}
                className="h-9"
              />
            </div>
          </div>

          {/* Time Warning */}
          {showTimeWarning && (
            <div className="flex items-center gap-2 rounded-md bg-yellow-50 p-3 text-sm text-yellow-800">
              <AlertCircle className="h-4 w-4" />
              <span>Bu toplantı 1 saat içinde başlayacak!</span>
            </div>
          )}

          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="location">
              <MapPin className="mr-1 inline h-4 w-4" />
              Konum
            </Label>
            <Input
              id="location"
              {...register('location')}
              placeholder="Fiziksel konum veya çevrimiçi bağlantı"
              className="h-9"
            />
            {errors.location && <p className="text-sm text-red-500">{errors.location.message}</p>}
          </div>

          {/* Meeting Type */}
          <div className="space-y-2">
            <Label htmlFor="meeting_type">
              Toplantı Türü <span className="text-red-500">*</span>
            </Label>
            <Select
              defaultValue={initialData?.meeting_type || 'general'}
              onValueChange={(value) =>
                setValue('meeting_type', value as 'general' | 'committee' | 'board' | 'other')
              }
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Toplantı türü seçin" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(meetingTypeLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.meeting_type && (
              <p className="text-sm text-red-500">{errors.meeting_type.message}</p>
            )}
          </div>

          {/* Organizer (Read-only) */}
          <div className="space-y-2">
            <Label htmlFor="organizer">
              <User className="mr-1 inline h-4 w-4" />
              Düzenleyen
            </Label>
            <Input id="organizer" value={user?.name || ''} disabled className="h-9 bg-gray-100" />
          </div>

          {/* Participants */}
          <div className="space-y-2">
            <Label htmlFor="participants">
              <Users className="mr-1 inline h-4 w-4" />
              Katılımcılar <span className="text-red-500">*</span>
            </Label>
            <Select onValueChange={handleParticipantToggle}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Katılımcı seçin" />
              </SelectTrigger>
              <SelectContent>
                {false ? (
                  <SelectItem value="loading" disabled>
                    Yükleniyor...
                  </SelectItem>
                ) : (
                  users.map((u) => (
                    <SelectItem key={u._id} value={u._id}>
                      {u.name} {selectedParticipants.includes(u._id) && '✓'}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>

            {/* Selected Participants */}
            <div className="flex flex-wrap gap-2">
              {selectedParticipants.map((userId) => (
                <Badge
                  key={userId}
                  variant={userId === user?.id ? 'default' : 'secondary'}
                  className="cursor-pointer"
                  onClick={() => handleParticipantToggle(userId)}
                >
                  {getUserName(userId)}
                  {userId !== user?.id && ' ×'}
                </Badge>
              ))}
            </div>
            <p className="text-sm text-gray-500">{selectedParticipants.length} katılımcı seçildi</p>
            {errors.participants && (
              <p className="text-sm text-red-500">{errors.participants.message}</p>
            )}
          </div>

          {/* Status (Edit mode only) */}
          {isEditMode && (
            <div className="space-y-2">
              <Label htmlFor="status">Durum</Label>
              <Select
                defaultValue={initialData?.status || 'scheduled'}
                onValueChange={(value) =>
                  setValue('status', value as 'scheduled' | 'ongoing' | 'completed' | 'cancelled')
                }
              >
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(meetingStatusLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Agenda */}
          <div className="space-y-2">
            <Label htmlFor="agenda">
              <FileText className="mr-1 inline h-4 w-4" />
              Gündem
            </Label>
            <Textarea
              id="agenda"
              {...register('agenda')}
              placeholder="Toplantı gündemini girin (madde madde)"
              rows={6}
            />
            {errors.agenda && <p className="text-sm text-red-500">{errors.agenda.message}</p>}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">
              <FileText className="mr-1 inline h-4 w-4" />
              Notlar
              {watchedStatus === 'completed' && (
                <span className="ml-1 text-sm text-blue-600">
                  (Tamamlanan toplantı için önemli)
                </span>
              )}
            </Label>
            <Textarea
              id="notes"
              {...register('notes')}
              placeholder="Toplantı notları ve kararlar"
              rows={6}
              className={watchedStatus === 'completed' ? 'border-blue-300' : ''}
            />
            {errors.notes && <p className="text-sm text-red-500">{errors.notes.message}</p>}
            {watchedStatus === 'completed' && !watch('notes') && (
              <p className="text-sm text-blue-600">
                Tamamlanan toplantı için notlar eklemeniz önerilir
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Form Actions */}
      <div className="flex justify-end gap-2">
        {isEditMode && watchedStatus === 'scheduled' && (
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              startMeetingMutation.mutate({});
            }}
            disabled={startMeetingMutation.isPending}
          >
            <Clock className="mr-2 h-4 w-4" />
            Toplantıyı Başlat
          </Button>
        )}
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          İptal
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Kaydediliyor...' : isEditMode ? 'Güncelle' : 'Kaydet'}
        </Button>
      </div>
    </form>
  );
}
