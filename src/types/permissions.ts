export const MODULE_PERMISSIONS = {
  BENEFICIARIES: 'beneficiaries:access',
  DONATIONS: 'donations:access',
  AID_APPLICATIONS: 'aid_applications:access',
  SCHOLARSHIPS: 'scholarships:access',
  MESSAGES: 'messages:access',
  FINANCE: 'finance:access',
  REPORTS: 'reports:access',
  SETTINGS: 'settings:access',
  WORKFLOW: 'workflow:access',
  PARTNERS: 'partners:access',
} as const;

export const SPECIAL_PERMISSIONS = {
  USERS_MANAGE: 'users:manage',
  SETTINGS_MANAGE: 'settings:manage',
  AUDIT_VIEW: 'audit:view',
} as const;

export const ALL_PERMISSIONS = [
  ...Object.values(MODULE_PERMISSIONS),
  ...Object.values(SPECIAL_PERMISSIONS),
] as const;

export type PermissionValue = (typeof ALL_PERMISSIONS)[number];

export const PERMISSION_LABELS: Record<PermissionValue, string> = {
  [MODULE_PERMISSIONS.BENEFICIARIES]: 'Hak Sahipleri',
  [MODULE_PERMISSIONS.DONATIONS]: 'Bağışlar',
  [MODULE_PERMISSIONS.AID_APPLICATIONS]: 'Yardım Başvuruları',
  [MODULE_PERMISSIONS.SCHOLARSHIPS]: 'Burslar',
  [MODULE_PERMISSIONS.MESSAGES]: 'Mesajlaşma',
  [MODULE_PERMISSIONS.FINANCE]: 'Finans',
  [MODULE_PERMISSIONS.REPORTS]: 'Raporlar',
  [MODULE_PERMISSIONS.SETTINGS]: 'Ayarlar',
  [MODULE_PERMISSIONS.WORKFLOW]: 'Görev & Toplantılar',
  [MODULE_PERMISSIONS.PARTNERS]: 'Ortak Yönetimi',
  [SPECIAL_PERMISSIONS.USERS_MANAGE]: 'Kullanıcı Yönetimi',
  [SPECIAL_PERMISSIONS.SETTINGS_MANAGE]: 'Ayarları Yönet',
  [SPECIAL_PERMISSIONS.AUDIT_VIEW]: 'Denetim Kayıtlarını Görüntüle',
};
