/**
 * Activity Feed Types
 */

export type ActivityType =
  | 'beneficiary_created'
  | 'beneficiary_updated'
  | 'beneficiary_deleted'
  | 'donation_created'
  | 'donation_updated'
  | 'task_created'
  | 'task_completed'
  | 'task_assigned'
  | 'meeting_created'
  | 'meeting_completed'
  | 'user_created'
  | 'user_updated'
  | 'message_sent'
  | 'aid_approved'
  | 'aid_rejected'
  | 'system_event';

export interface ActivityUser {
  id: string;
  name: string;
  avatar?: string;
  role?: string;
}

export interface Activity {
  id: string;
  type: ActivityType;
  title: string;
  description?: string;
  user?: ActivityUser;
  metadata?: Record<string, unknown>;
  resourceType?: 'beneficiary' | 'donation' | 'task' | 'meeting' | 'user' | 'message' | 'aid';
  resourceId?: string;
  resourceName?: string;
  createdAt: string;
}

// Activity type configuration
export const activityTypeConfig: Record<
  ActivityType,
  {
    label: string;
    icon: string;
    color: string;
    bgColor: string;
  }
> = {
  beneficiary_created: {
    label: 'Yeni ihtiyaç sahibi eklendi',
    icon: 'UserPlus',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
  },
  beneficiary_updated: {
    label: 'İhtiyaç sahibi güncellendi',
    icon: 'UserCog',
    color: 'text-blue-500',
    bgColor: 'bg-blue-50',
  },
  beneficiary_deleted: {
    label: 'İhtiyaç sahibi silindi',
    icon: 'UserMinus',
    color: 'text-red-500',
    bgColor: 'bg-red-50',
  },
  donation_created: {
    label: 'Yeni bağış alındı',
    icon: 'Gift',
    color: 'text-green-600',
    bgColor: 'bg-green-100',
  },
  donation_updated: {
    label: 'Bağış güncellendi',
    icon: 'Gift',
    color: 'text-green-500',
    bgColor: 'bg-green-50',
  },
  task_created: {
    label: 'Yeni görev oluşturuldu',
    icon: 'ListTodo',
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
  },
  task_completed: {
    label: 'Görev tamamlandı',
    icon: 'CheckCircle2',
    color: 'text-green-600',
    bgColor: 'bg-green-100',
  },
  task_assigned: {
    label: 'Görev atandı',
    icon: 'UserCheck',
    color: 'text-purple-500',
    bgColor: 'bg-purple-50',
  },
  meeting_created: {
    label: 'Yeni toplantı planlandı',
    icon: 'Calendar',
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-100',
  },
  meeting_completed: {
    label: 'Toplantı tamamlandı',
    icon: 'CalendarCheck',
    color: 'text-cyan-500',
    bgColor: 'bg-cyan-50',
  },
  user_created: {
    label: 'Yeni kullanıcı eklendi',
    icon: 'UserPlus',
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-100',
  },
  user_updated: {
    label: 'Kullanıcı güncellendi',
    icon: 'UserCog',
    color: 'text-indigo-500',
    bgColor: 'bg-indigo-50',
  },
  message_sent: {
    label: 'Mesaj gönderildi',
    icon: 'MessageSquare',
    color: 'text-amber-600',
    bgColor: 'bg-amber-100',
  },
  aid_approved: {
    label: 'Yardım başvurusu onaylandı',
    icon: 'CheckCircle',
    color: 'text-green-600',
    bgColor: 'bg-green-100',
  },
  aid_rejected: {
    label: 'Yardım başvurusu reddedildi',
    icon: 'XCircle',
    color: 'text-red-600',
    bgColor: 'bg-red-100',
  },
  system_event: {
    label: 'Sistem etkinliği',
    icon: 'Settings',
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
  },
};

// Filter options for activity feed
export const activityFilterOptions = [
  { value: 'all', label: 'Tümü' },
  { value: 'beneficiary', label: 'İhtiyaç Sahipleri' },
  { value: 'donation', label: 'Bağışlar' },
  { value: 'task', label: 'Görevler' },
  { value: 'meeting', label: 'Toplantılar' },
  { value: 'user', label: 'Kullanıcılar' },
  { value: 'message', label: 'Mesajlar' },
  { value: 'aid', label: 'Yardım Başvuruları' },
];

// Helper to get resource type from activity type
export function getResourceTypeFromActivity(type: ActivityType): Activity['resourceType'] {
  if (type.startsWith('beneficiary')) return 'beneficiary';
  if (type.startsWith('donation')) return 'donation';
  if (type.startsWith('task')) return 'task';
  if (type.startsWith('meeting')) return 'meeting';
  if (type.startsWith('user')) return 'user';
  if (type.startsWith('message')) return 'message';
  if (type.startsWith('aid')) return 'aid';
  return undefined;
}

// Helper to get activity link
export function getActivityLink(activity: Activity): string | undefined {
  if (!activity.resourceType || !activity.resourceId) return undefined;

  switch (activity.resourceType) {
    case 'beneficiary':
      return `/yardim/ihtiyac-sahipleri/${activity.resourceId}`;
    case 'donation':
      return `/bagis/liste?id=${activity.resourceId}`;
    case 'task':
      return `/is/gorevler?task=${activity.resourceId}`;
    case 'meeting':
      return `/is/toplantilar?meeting=${activity.resourceId}`;
    case 'user':
      return `/kullanici/${activity.resourceId}/duzenle`;
    case 'message':
      return `/mesaj/gecmis?id=${activity.resourceId}`;
    case 'aid':
      return `/yardim/basvurular/${activity.resourceId}`;
    default:
      return undefined;
  }
}

