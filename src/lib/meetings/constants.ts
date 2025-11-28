export const MEETING_TYPES = {
  internal: 'internal',
  external: 'external',
  board: 'board',
} as const;

export const MEETING_STATUSES = {
  scheduled: 'scheduled',
  ongoing: 'ongoing',
  completed: 'completed',
  cancelled: 'cancelled',
} as const;

export const MEETING_TABS = {
  ALL: 'all',
  INVITED: 'invited',
  ATTENDED: 'attended',
  INFORMED: 'informed',
  OPEN: 'open',
} as const;

export const VIEW_MODES = {
  CALENDAR: 'calendar',
  LIST: 'list',
} as const;

export const MEETING_STATUS_LABELS = {
  scheduled: 'Planlandı',
  ongoing: 'Devam Ediyor',
  completed: 'Tamamlandı',
  cancelled: 'İptal Edildi',
} as const;

export const MEETING_TYPE_LABELS = {
  internal: 'İç Toplantı',
  external: 'Harici Toplantı',
  board: 'Yönetim Kurulu',
} as const;
