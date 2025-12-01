/**
 * React Query Cache Configuration
 * Entity bazlı merkezi cache yönetimi
 *
 * @description
 * Bu modül, React Query için entity bazlı cache süreleri ve
 * query key factory'leri sağlar. Tüm data fetching işlemleri
 * bu konfigürasyonu kullanmalıdır.
 */

// ============================================================================
// CACHE TIME CONFIGURATION
// ============================================================================

/**
 * Cache süreleri (milisaniye cinsinden)
 * - staleTime: Verinin "bayat" sayılacağı süre
 * - gcTime: Garbage collection süresi (eski adı: cacheTime)
 */
export const QUERY_STALE_TIMES = {
  // Sık değişen veriler - kısa cache
  realtime: 0, // Her zaman yeniden fetch
  messages: 30 * 1000, // 30 saniye
  notifications: 30 * 1000, // 30 saniye
  todos: 1 * 60 * 1000, // 1 dakika
  tasks: 2 * 60 * 1000, // 2 dakika

  // Orta sıklıkta değişen veriler
  dashboard: 2 * 60 * 1000, // 2 dakika
  analytics: 5 * 60 * 1000, // 5 dakika
  meetings: 5 * 60 * 1000, // 5 dakika
  donations: 5 * 60 * 1000, // 5 dakika
  aidApplications: 5 * 60 * 1000, // 5 dakika

  // Nadiren değişen veriler - uzun cache
  beneficiaries: 10 * 60 * 1000, // 10 dakika
  partners: 10 * 60 * 1000, // 10 dakika
  scholarships: 10 * 60 * 1000, // 10 dakika
  users: 15 * 60 * 1000, // 15 dakika
  settings: 30 * 60 * 1000, // 30 dakika

  // Statik veriler - çok uzun cache
  constants: 60 * 60 * 1000, // 1 saat
  config: 60 * 60 * 1000, // 1 saat
} as const;

/**
 * Garbage collection süreleri
 * Verinin memory'den tamamen silineceği süre
 */
export const QUERY_GC_TIMES = {
  short: 5 * 60 * 1000, // 5 dakika
  medium: 15 * 60 * 1000, // 15 dakika
  long: 30 * 60 * 1000, // 30 dakika
  extended: 60 * 60 * 1000, // 1 saat
} as const;

// ============================================================================
// QUERY KEY FACTORY
// ============================================================================

/**
 * Query key factory
 * Type-safe ve tutarlı query key'ler için
 *
 * @example
 * queryKeys.beneficiaries.list({ page: 1, limit: 10 })
 * queryKeys.beneficiaries.detail(id)
 * queryKeys.users.all
 */
export const queryKeys = {
  // Beneficiaries (Yardım Alanlar)
  beneficiaries: {
    all: ['beneficiaries'] as const,
    lists: () => [...queryKeys.beneficiaries.all, 'list'] as const,
    list: (filters?: Record<string, unknown>) =>
      [...queryKeys.beneficiaries.lists(), filters] as const,
    details: () => [...queryKeys.beneficiaries.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.beneficiaries.details(), id] as const,
    analytics: () => [...queryKeys.beneficiaries.all, 'analytics'] as const,
  },

  // Donations (Bağışlar)
  donations: {
    all: ['donations'] as const,
    lists: () => [...queryKeys.donations.all, 'list'] as const,
    list: (filters?: Record<string, unknown>) =>
      [...queryKeys.donations.lists(), filters] as const,
    details: () => [...queryKeys.donations.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.donations.details(), id] as const,
    stats: () => [...queryKeys.donations.all, 'stats'] as const,
  },

  // Users (Kullanıcılar)
  users: {
    all: ['users'] as const,
    lists: () => [...queryKeys.users.all, 'list'] as const,
    list: (filters?: Record<string, unknown>) =>
      [...queryKeys.users.lists(), filters] as const,
    details: () => [...queryKeys.users.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.users.details(), id] as const,
    current: () => [...queryKeys.users.all, 'current'] as const,
  },

  // Meetings (Toplantılar)
  meetings: {
    all: ['meetings'] as const,
    lists: () => [...queryKeys.meetings.all, 'list'] as const,
    list: (filters?: Record<string, unknown>) =>
      [...queryKeys.meetings.lists(), filters] as const,
    details: () => [...queryKeys.meetings.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.meetings.details(), id] as const,
    decisions: (meetingId: string) =>
      [...queryKeys.meetings.detail(meetingId), 'decisions'] as const,
    actionItems: (meetingId: string) =>
      [...queryKeys.meetings.detail(meetingId), 'actionItems'] as const,
  },

  // Messages (Mesajlar)
  messages: {
    all: ['messages'] as const,
    lists: () => [...queryKeys.messages.all, 'list'] as const,
    list: (filters?: Record<string, unknown>) =>
      [...queryKeys.messages.lists(), filters] as const,
    details: () => [...queryKeys.messages.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.messages.details(), id] as const,
    unread: () => [...queryKeys.messages.all, 'unread'] as const,
  },

  // Tasks (Görevler)
  tasks: {
    all: ['tasks'] as const,
    lists: () => [...queryKeys.tasks.all, 'list'] as const,
    list: (filters?: Record<string, unknown>) =>
      [...queryKeys.tasks.lists(), filters] as const,
    details: () => [...queryKeys.tasks.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.tasks.details(), id] as const,
    byUser: (userId: string) => [...queryKeys.tasks.all, 'user', userId] as const,
  },

  // Todos
  todos: {
    all: ['todos'] as const,
    lists: () => [...queryKeys.todos.all, 'list'] as const,
    list: (filters?: Record<string, unknown>) =>
      [...queryKeys.todos.lists(), filters] as const,
    details: () => [...queryKeys.todos.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.todos.details(), id] as const,
  },

  // Partners (İş Ortakları)
  partners: {
    all: ['partners'] as const,
    lists: () => [...queryKeys.partners.all, 'list'] as const,
    list: (filters?: Record<string, unknown>) =>
      [...queryKeys.partners.lists(), filters] as const,
    details: () => [...queryKeys.partners.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.partners.details(), id] as const,
  },

  // Scholarships (Burslar)
  scholarships: {
    all: ['scholarships'] as const,
    lists: () => [...queryKeys.scholarships.all, 'list'] as const,
    list: (filters?: Record<string, unknown>) =>
      [...queryKeys.scholarships.lists(), filters] as const,
    details: () => [...queryKeys.scholarships.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.scholarships.details(), id] as const,
  },

  // Aid Applications (Yardım Başvuruları)
  aidApplications: {
    all: ['aidApplications'] as const,
    lists: () => [...queryKeys.aidApplications.all, 'list'] as const,
    list: (filters?: Record<string, unknown>) =>
      [...queryKeys.aidApplications.lists(), filters] as const,
    details: () => [...queryKeys.aidApplications.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.aidApplications.details(), id] as const,
  },

  // Dashboard
  dashboard: {
    all: ['dashboard'] as const,
    stats: () => [...queryKeys.dashboard.all, 'stats'] as const,
    charts: () => [...queryKeys.dashboard.all, 'charts'] as const,
    recent: () => [...queryKeys.dashboard.all, 'recent'] as const,
  },

  // Analytics
  analytics: {
    all: ['analytics'] as const,
    overview: () => [...queryKeys.analytics.all, 'overview'] as const,
    financial: () => [...queryKeys.analytics.all, 'financial'] as const,
    beneficiary: () => [...queryKeys.analytics.all, 'beneficiary'] as const,
  },

  // Notifications (Bildirimler)
  notifications: {
    all: ['notifications'] as const,
    lists: () => [...queryKeys.notifications.all, 'list'] as const,
    list: (filters?: Record<string, unknown>) =>
      [...queryKeys.notifications.lists(), filters] as const,
    unread: () => [...queryKeys.notifications.all, 'unread'] as const,
    count: () => [...queryKeys.notifications.all, 'count'] as const,
  },

  // Settings (Ayarlar)
  settings: {
    all: ['settings'] as const,
    general: () => [...queryKeys.settings.all, 'general'] as const,
    branding: () => [...queryKeys.settings.all, 'branding'] as const,
    notifications: () => [...queryKeys.settings.all, 'notifications'] as const,
  },
} as const;

// ============================================================================
// QUERY OPTIONS FACTORY
// ============================================================================

type EntityType = keyof typeof QUERY_STALE_TIMES;

/**
 * Entity bazlı query options döndürür
 *
 * @example
 * const options = getQueryOptions('beneficiaries');
 * // { staleTime: 600000, gcTime: 1800000 }
 */
export function getQueryOptions(entity: EntityType) {
  const staleTime = QUERY_STALE_TIMES[entity] ?? QUERY_STALE_TIMES.dashboard;

  // staleTime'a göre gcTime hesapla
  let gcTime: number;
  if (staleTime <= 60 * 1000) {
    gcTime = QUERY_GC_TIMES.short;
  } else if (staleTime <= 5 * 60 * 1000) {
    gcTime = QUERY_GC_TIMES.medium;
  } else if (staleTime <= 15 * 60 * 1000) {
    gcTime = QUERY_GC_TIMES.long;
  } else {
    gcTime = QUERY_GC_TIMES.extended;
  }

  return {
    staleTime,
    gcTime,
  };
}

/**
 * Tüm entity'ler için default query options
 * React Query defaultOptions için kullanılabilir
 */
export const defaultQueryOptions = {
  queries: {
    staleTime: QUERY_STALE_TIMES.dashboard,
    gcTime: QUERY_GC_TIMES.medium,
    retry: 2,
    retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  },
};

// ============================================================================
// INVALIDATION HELPERS
// ============================================================================

/**
 * İlişkili query'leri invalidate etmek için helper
 * Mutation sonrası kullanılır
 *
 * @example
 * // Beneficiary oluşturulduğunda
 * getInvalidationKeys('beneficiaries', 'create')
 * // [['beneficiaries'], ['dashboard'], ['analytics']]
 */
export function getInvalidationKeys(
  entity: keyof typeof queryKeys,
  _operation: 'create' | 'update' | 'delete'
): readonly (readonly string[])[] {
  const baseKey = queryKeys[entity].all;

  // Her entity için ilişkili invalidation'lar
  const relatedKeys: Record<string, readonly (readonly string[])[]> = {
    beneficiaries: [
      baseKey,
      queryKeys.dashboard.all,
      queryKeys.analytics.beneficiary(),
    ],
    donations: [
      baseKey,
      queryKeys.dashboard.all,
      queryKeys.analytics.financial(),
    ],
    users: [baseKey],
    meetings: [baseKey, queryKeys.tasks.all],
    messages: [baseKey, queryKeys.notifications.all],
    tasks: [baseKey, queryKeys.dashboard.all],
    todos: [baseKey],
    partners: [baseKey],
    scholarships: [baseKey, queryKeys.analytics.all],
    aidApplications: [baseKey, queryKeys.beneficiaries.all],
    notifications: [baseKey],
  };

  return relatedKeys[entity] ?? [baseKey];
}

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type QueryKeys = typeof queryKeys;
export type QueryKeyEntity = keyof QueryKeys;
