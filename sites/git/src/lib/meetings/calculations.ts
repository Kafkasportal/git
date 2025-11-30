export type MeetingStatus = 'scheduled' | 'ongoing' | 'completed' | 'cancelled';
export type MeetingType = 'internal' | 'external' | 'board';
export type MeetingTab = 'all' | 'invited' | 'attended' | 'informed' | 'open';

export interface MeetingStatistics {
  totalMeetings: number;
  upcomingMeetings: number;
  completedMeetings: number;
  cancelledMeetings: number;
}

/**
 * Validate meeting data
 */
export function validateMeetingData(data: {
  title?: string;
  description?: string;
  startTime?: string;
  endTime?: string;
}): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!data.title?.trim()) {
    errors.push('Toplantı başlığı gereklidir');
  }

  if (!data.startTime) {
    errors.push('Başlangıç saati gereklidir');
  }

  if (!data.endTime) {
    errors.push('Bitiş saati gereklidir');
  }

  if (data.startTime && data.endTime) {
    const start = new Date(data.startTime);
    const end = new Date(data.endTime);
    if (start >= end) {
      errors.push('Başlangıç saati bitiş saatinden önce olmalıdır');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Calculate meeting duration in minutes
 */
export function calculateDuration(startTime: string, endTime: string): number {
  const start = new Date(startTime);
  const end = new Date(endTime);
  return Math.floor((end.getTime() - start.getTime()) / (1000 * 60));
}

/**
 * Format duration to readable string
 */
export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (hours === 0) return `${mins} dakika`;
  if (mins === 0) return `${hours} saat`;
  return `${hours}s ${mins}d`;
}

/**
 * Check if meeting is upcoming
 */
export function isUpcoming(startTime: string): boolean {
  return new Date(startTime) > new Date();
}

/**
 * Check if meeting is ongoing
 */
export function isOngoing(startTime: string, endTime: string): boolean {
  const now = new Date();
  const start = new Date(startTime);
  const end = new Date(endTime);
  return now >= start && now <= end;
}

/**
 * Get meeting status based on time
 */
export function getMeetingStatus(startTime: string, endTime: string): MeetingStatus {
  if (isOngoing(startTime, endTime)) return 'ongoing';
  if (isUpcoming(startTime)) return 'scheduled';
  return 'completed';
}

/**
 * Format meeting date and time
 */
export function formatMeetingDateTime(date: string): string {
  return new Date(date).toLocaleDateString('tr-TR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Get color for meeting status
 */
export function getStatusColor(status: MeetingStatus): string {
  const colors: Record<MeetingStatus, string> = {
    scheduled: 'bg-blue-100 text-blue-800',
    ongoing: 'bg-green-100 text-green-800',
    completed: 'bg-gray-100 text-gray-800',
    cancelled: 'bg-red-100 text-red-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
}

/**
 * Calculate meeting statistics
 */
export function calculateMeetingStats(
  meetings: Array<{ startTime: string; endTime: string; status?: string }>
): MeetingStatistics {
  const now = new Date();

  const upcoming = meetings.filter((m) => new Date(m.startTime) > now).length;
  const completed = meetings.filter((m) => new Date(m.endTime) < now).length;
  const cancelled = meetings.filter((m) => m.status === 'cancelled').length;

  return {
    totalMeetings: meetings.length,
    upcomingMeetings: upcoming,
    completedMeetings: completed,
    cancelledMeetings: cancelled,
  };
}
