'use client';

/**
 * Settings Store (Zustand)
 * Manages application-wide settings and user preferences
 * Syncs with backend settings API
 */

import { create } from 'zustand';
import { devtools, persist, subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import logger from '@/lib/logger';

// ========================================
// TYPES
// ========================================

export type Language = 'tr' | 'en' | 'de' | 'ar';
export type DateFormat = 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD';
export type TimeFormat = '24h' | '12h';
export type Currency = 'TRY' | 'USD' | 'EUR' | 'GBP';
export type NumberFormat = 'tr-TR' | 'en-US' | 'de-DE';

export interface GeneralSettings {
  language: Language;
  dateFormat: DateFormat;
  timeFormat: TimeFormat;
  timezone: string;
  currency: Currency;
  numberFormat: NumberFormat;
  weekStartsOn: 0 | 1 | 6; // Sunday, Monday, Saturday
}

export interface DisplaySettings {
  itemsPerPage: number;
  defaultView: 'list' | 'grid' | 'kanban' | 'calendar';
  showWelcomeMessage: boolean;
  showTips: boolean;
  compactMode: boolean;
  showAvatars: boolean;
  showStatusBadges: boolean;
  enableAnimations: boolean;
}

export interface NotificationPreferences {
  email: boolean;
  push: boolean;
  sms: boolean;
  inApp: boolean;
  sound: boolean;
  digest: 'realtime' | 'hourly' | 'daily' | 'weekly' | 'none';
  quietHoursEnabled: boolean;
  quietHoursStart: string; // HH:mm format
  quietHoursEnd: string;
  categories: {
    tasks: boolean;
    meetings: boolean;
    donations: boolean;
    beneficiaries: boolean;
    system: boolean;
    reminders: boolean;
  };
}

export interface PrivacySettings {
  showOnlineStatus: boolean;
  showLastSeen: boolean;
  showActivityStatus: boolean;
  allowAnalytics: boolean;
  shareUsageData: boolean;
  profileVisibility: 'public' | 'members' | 'admins' | 'private';
}

export interface AccessibilitySettings {
  fontSize: 'small' | 'medium' | 'large' | 'xlarge';
  reducedMotion: boolean;
  highContrast: boolean;
  screenReaderOptimized: boolean;
  keyboardNavigation: boolean;
  focusIndicators: boolean;
  textToSpeech: boolean;
  dyslexiaFriendly: boolean;
}

export interface DataSettings {
  autoSave: boolean;
  autoSaveInterval: number; // seconds
  keepLocalBackup: boolean;
  exportFormat: 'json' | 'csv' | 'xlsx';
  importDuplicateHandling: 'skip' | 'update' | 'create';
  retentionDays: number;
}

export interface IntegrationSettings {
  googleCalendarSync: boolean;
  outlookSync: boolean;
  slackNotifications: boolean;
  webhooksEnabled: boolean;
  apiAccessEnabled: boolean;
}

export interface OrganizationSettings {
  name: string;
  logo: string | null;
  primaryColor: string;
  secondaryColor: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  taxNumber: string;
  fiscalYearStart: string; // MM-DD format
}

export interface SettingsState {
  // Settings categories
  general: GeneralSettings;
  display: DisplaySettings;
  notifications: NotificationPreferences;
  privacy: PrivacySettings;
  accessibility: AccessibilitySettings;
  data: DataSettings;
  integrations: IntegrationSettings;
  organization: OrganizationSettings;
  
  // Sync state
  isSyncing: boolean;
  lastSyncedAt: string | null;
  syncError: string | null;
  isDirty: boolean;
  
  // Feature flags (from backend)
  features: Record<string, boolean>;
}

export interface SettingsActions {
  // General settings
  updateGeneralSettings: (settings: Partial<GeneralSettings>) => void;
  setLanguage: (language: Language) => void;
  setDateFormat: (format: DateFormat) => void;
  setTimeFormat: (format: TimeFormat) => void;
  setTimezone: (timezone: string) => void;
  setCurrency: (currency: Currency) => void;
  
  // Display settings
  updateDisplaySettings: (settings: Partial<DisplaySettings>) => void;
  setItemsPerPage: (count: number) => void;
  setDefaultView: (view: DisplaySettings['defaultView']) => void;
  toggleCompactMode: () => void;
  
  // Notification preferences
  updateNotificationPreferences: (prefs: Partial<NotificationPreferences>) => void;
  toggleNotificationCategory: (category: keyof NotificationPreferences['categories']) => void;
  setQuietHours: (enabled: boolean, start?: string, end?: string) => void;
  
  // Privacy settings
  updatePrivacySettings: (settings: Partial<PrivacySettings>) => void;
  setProfileVisibility: (visibility: PrivacySettings['profileVisibility']) => void;
  
  // Accessibility settings
  updateAccessibilitySettings: (settings: Partial<AccessibilitySettings>) => void;
  setFontSize: (size: AccessibilitySettings['fontSize']) => void;
  toggleReducedMotion: () => void;
  toggleHighContrast: () => void;
  
  // Data settings
  updateDataSettings: (settings: Partial<DataSettings>) => void;
  setAutoSave: (enabled: boolean, interval?: number) => void;
  setExportFormat: (format: DataSettings['exportFormat']) => void;
  
  // Integration settings
  updateIntegrationSettings: (settings: Partial<IntegrationSettings>) => void;
  toggleIntegration: (integration: keyof IntegrationSettings) => void;
  
  // Organization settings
  updateOrganizationSettings: (settings: Partial<OrganizationSettings>) => void;
  
  // Feature flags
  setFeatureFlag: (feature: string, enabled: boolean) => void;
  isFeatureEnabled: (feature: string) => boolean;
  
  // Sync actions
  syncSettings: () => Promise<void>;
  loadSettingsFromServer: () => Promise<void>;
  saveSettingsToServer: () => Promise<void>;
  markDirty: () => void;
  
  // Reset
  resetToDefaults: (category?: keyof Omit<SettingsState, 'isSyncing' | 'lastSyncedAt' | 'syncError' | 'isDirty' | 'features'>) => void;
  resetAllSettings: () => void;
}

type SettingsStore = SettingsState & SettingsActions;

// ========================================
// DEFAULT VALUES
// ========================================

const defaultGeneralSettings: GeneralSettings = {
  language: 'tr',
  dateFormat: 'DD/MM/YYYY',
  timeFormat: '24h',
  timezone: 'Europe/Istanbul',
  currency: 'TRY',
  numberFormat: 'tr-TR',
  weekStartsOn: 1,
};

const defaultDisplaySettings: DisplaySettings = {
  itemsPerPage: 25,
  defaultView: 'list',
  showWelcomeMessage: true,
  showTips: true,
  compactMode: false,
  showAvatars: true,
  showStatusBadges: true,
  enableAnimations: true,
};

const defaultNotificationPreferences: NotificationPreferences = {
  email: true,
  push: true,
  sms: false,
  inApp: true,
  sound: true,
  digest: 'realtime',
  quietHoursEnabled: false,
  quietHoursStart: '22:00',
  quietHoursEnd: '08:00',
  categories: {
    tasks: true,
    meetings: true,
    donations: true,
    beneficiaries: true,
    system: true,
    reminders: true,
  },
};

const defaultPrivacySettings: PrivacySettings = {
  showOnlineStatus: true,
  showLastSeen: true,
  showActivityStatus: true,
  allowAnalytics: true,
  shareUsageData: false,
  profileVisibility: 'members',
};

const defaultAccessibilitySettings: AccessibilitySettings = {
  fontSize: 'medium',
  reducedMotion: false,
  highContrast: false,
  screenReaderOptimized: false,
  keyboardNavigation: true,
  focusIndicators: true,
  textToSpeech: false,
  dyslexiaFriendly: false,
};

const defaultDataSettings: DataSettings = {
  autoSave: true,
  autoSaveInterval: 30,
  keepLocalBackup: true,
  exportFormat: 'xlsx',
  importDuplicateHandling: 'skip',
  retentionDays: 365,
};

const defaultIntegrationSettings: IntegrationSettings = {
  googleCalendarSync: false,
  outlookSync: false,
  slackNotifications: false,
  webhooksEnabled: false,
  apiAccessEnabled: false,
};

const defaultOrganizationSettings: OrganizationSettings = {
  name: '',
  logo: null,
  primaryColor: '#3B82F6',
  secondaryColor: '#10B981',
  address: '',
  phone: '',
  email: '',
  website: '',
  taxNumber: '',
  fiscalYearStart: '01-01',
};

const initialState: SettingsState = {
  general: defaultGeneralSettings,
  display: defaultDisplaySettings,
  notifications: defaultNotificationPreferences,
  privacy: defaultPrivacySettings,
  accessibility: defaultAccessibilitySettings,
  data: defaultDataSettings,
  integrations: defaultIntegrationSettings,
  organization: defaultOrganizationSettings,
  isSyncing: false,
  lastSyncedAt: null,
  syncError: null,
  isDirty: false,
  features: {},
};

// ========================================
// STORE
// ========================================

export const useSettingsStore = create<SettingsStore>()(
  devtools(
    subscribeWithSelector(
      persist(
        immer((set, get) => ({
          ...initialState,
          
          // ====== General Settings ======
          updateGeneralSettings: (settings) => set((state) => {
            Object.assign(state.general, settings);
            state.isDirty = true;
          }),
          
          setLanguage: (language) => set((state) => {
            state.general.language = language;
            state.isDirty = true;
          }),
          
          setDateFormat: (format) => set((state) => {
            state.general.dateFormat = format;
            state.isDirty = true;
          }),
          
          setTimeFormat: (format) => set((state) => {
            state.general.timeFormat = format;
            state.isDirty = true;
          }),
          
          setTimezone: (timezone) => set((state) => {
            state.general.timezone = timezone;
            state.isDirty = true;
          }),
          
          setCurrency: (currency) => set((state) => {
            state.general.currency = currency;
            state.isDirty = true;
          }),
          
          // ====== Display Settings ======
          updateDisplaySettings: (settings) => set((state) => {
            Object.assign(state.display, settings);
            state.isDirty = true;
          }),
          
          setItemsPerPage: (count) => set((state) => {
            state.display.itemsPerPage = Math.max(10, Math.min(100, count));
            state.isDirty = true;
          }),
          
          setDefaultView: (view) => set((state) => {
            state.display.defaultView = view;
            state.isDirty = true;
          }),
          
          toggleCompactMode: () => set((state) => {
            state.display.compactMode = !state.display.compactMode;
            state.isDirty = true;
          }),
          
          // ====== Notification Preferences ======
          updateNotificationPreferences: (prefs) => set((state) => {
            Object.assign(state.notifications, prefs);
            state.isDirty = true;
          }),
          
          toggleNotificationCategory: (category) => set((state) => {
            state.notifications.categories[category] = !state.notifications.categories[category];
            state.isDirty = true;
          }),
          
          setQuietHours: (enabled, start, end) => set((state) => {
            state.notifications.quietHoursEnabled = enabled;
            if (start) state.notifications.quietHoursStart = start;
            if (end) state.notifications.quietHoursEnd = end;
            state.isDirty = true;
          }),
          
          // ====== Privacy Settings ======
          updatePrivacySettings: (settings) => set((state) => {
            Object.assign(state.privacy, settings);
            state.isDirty = true;
          }),
          
          setProfileVisibility: (visibility) => set((state) => {
            state.privacy.profileVisibility = visibility;
            state.isDirty = true;
          }),
          
          // ====== Accessibility Settings ======
          updateAccessibilitySettings: (settings) => set((state) => {
            Object.assign(state.accessibility, settings);
            state.isDirty = true;
          }),
          
          setFontSize: (size) => set((state) => {
            state.accessibility.fontSize = size;
            state.isDirty = true;
          }),
          
          toggleReducedMotion: () => set((state) => {
            state.accessibility.reducedMotion = !state.accessibility.reducedMotion;
            state.isDirty = true;
          }),
          
          toggleHighContrast: () => set((state) => {
            state.accessibility.highContrast = !state.accessibility.highContrast;
            state.isDirty = true;
          }),
          
          // ====== Data Settings ======
          updateDataSettings: (settings) => set((state) => {
            Object.assign(state.data, settings);
            state.isDirty = true;
          }),
          
          setAutoSave: (enabled, interval) => set((state) => {
            state.data.autoSave = enabled;
            if (interval !== undefined) {
              state.data.autoSaveInterval = Math.max(5, Math.min(300, interval));
            }
            state.isDirty = true;
          }),
          
          setExportFormat: (format) => set((state) => {
            state.data.exportFormat = format;
            state.isDirty = true;
          }),
          
          // ====== Integration Settings ======
          updateIntegrationSettings: (settings) => set((state) => {
            Object.assign(state.integrations, settings);
            state.isDirty = true;
          }),
          
          toggleIntegration: (integration) => set((state) => {
            const currentValue = state.integrations[integration];
            if (typeof currentValue === 'boolean') {
              (state.integrations[integration] as boolean) = !currentValue;
              state.isDirty = true;
            }
          }),
          
          // ====== Organization Settings ======
          updateOrganizationSettings: (settings) => set((state) => {
            Object.assign(state.organization, settings);
            state.isDirty = true;
          }),
          
          // ====== Feature Flags ======
          setFeatureFlag: (feature, enabled) => set((state) => {
            state.features[feature] = enabled;
          }),
          
          isFeatureEnabled: (feature: string): boolean => {
            return get().features[feature] ?? false;
          },
          
          // ====== Sync Actions ======
          syncSettings: async () => {
            const state = get();
            if (state.isSyncing) return;
            
            set((draft) => {
              draft.isSyncing = true;
              draft.syncError = null;
            });
            
            try {
              // First load from server, then save local changes if dirty
              await get().loadSettingsFromServer();
              
              if (state.isDirty) {
                await get().saveSettingsToServer();
              }
              
              set((draft) => {
                draft.isSyncing = false;
                draft.lastSyncedAt = new Date().toISOString();
                draft.isDirty = false;
              });
            } catch (error) {
              logger.error('Settings sync failed', error);
              set((draft) => {
                draft.isSyncing = false;
                draft.syncError = error instanceof Error ? error.message : 'Ayarlar senkronize edilemedi';
              });
            }
          },
          
          loadSettingsFromServer: async () => {
            try {
              const response = await fetch('/api/settings');
              if (!response.ok) {
                throw new Error('Ayarlar yüklenemedi');
              }
              const data = await response.json();
              
              if (data.settings) {
                set((state) => {
                  if (data.settings.general) Object.assign(state.general, data.settings.general);
                  if (data.settings.display) Object.assign(state.display, data.settings.display);
                  if (data.settings.notifications) Object.assign(state.notifications, data.settings.notifications);
                  if (data.settings.privacy) Object.assign(state.privacy, data.settings.privacy);
                  if (data.settings.accessibility) Object.assign(state.accessibility, data.settings.accessibility);
                  if (data.settings.data) Object.assign(state.data, data.settings.data);
                  if (data.settings.integrations) Object.assign(state.integrations, data.settings.integrations);
                  if (data.settings.organization) Object.assign(state.organization, data.settings.organization);
                  if (data.features) state.features = data.features;
                });
              }
            } catch (error) {
              logger.error('Failed to load settings from server', error);
              throw error;
            }
          },
          
          saveSettingsToServer: async () => {
            const state = get();
            try {
              const response = await fetch('/api/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  general: state.general,
                  display: state.display,
                  notifications: state.notifications,
                  privacy: state.privacy,
                  accessibility: state.accessibility,
                  data: state.data,
                  integrations: state.integrations,
                  organization: state.organization,
                }),
              });
              
              if (!response.ok) {
                throw new Error('Ayarlar kaydedilemedi');
              }
            } catch (error) {
              logger.error('Failed to save settings to server', error);
              throw error;
            }
          },
          
          markDirty: () => set((state) => {
            state.isDirty = true;
          }),
          
          // ====== Reset ======
          resetToDefaults: (category) => set((state) => {
            if (!category) {
              // Reset all categories
              Object.assign(state, initialState);
            } else {
              // Reset specific category
              switch (category) {
                case 'general':
                  state.general = { ...defaultGeneralSettings };
                  break;
                case 'display':
                  state.display = { ...defaultDisplaySettings };
                  break;
                case 'notifications':
                  state.notifications = { ...defaultNotificationPreferences };
                  break;
                case 'privacy':
                  state.privacy = { ...defaultPrivacySettings };
                  break;
                case 'accessibility':
                  state.accessibility = { ...defaultAccessibilitySettings };
                  break;
                case 'data':
                  state.data = { ...defaultDataSettings };
                  break;
                case 'integrations':
                  state.integrations = { ...defaultIntegrationSettings };
                  break;
                case 'organization':
                  state.organization = { ...defaultOrganizationSettings };
                  break;
              }
            }
            state.isDirty = true;
          }),
          
          resetAllSettings: () => set(() => ({
            ...initialState,
            isDirty: true,
          })),
        })),
        {
          name: 'settings-store',
          partialize: (state) => ({
            general: state.general,
            display: state.display,
            notifications: state.notifications,
            privacy: state.privacy,
            accessibility: state.accessibility,
            data: state.data,
            integrations: state.integrations,
            organization: state.organization,
            features: state.features,
            lastSyncedAt: state.lastSyncedAt,
          }),
        }
      )
    ),
    { name: 'SettingsStore' }
  )
);

// ========================================
// SELECTORS
// ========================================

export const selectGeneralSettings = (state: SettingsStore) => state.general;
export const selectDisplaySettings = (state: SettingsStore) => state.display;
export const selectNotificationPreferences = (state: SettingsStore) => state.notifications;
export const selectPrivacySettings = (state: SettingsStore) => state.privacy;
export const selectAccessibilitySettings = (state: SettingsStore) => state.accessibility;
export const selectDataSettings = (state: SettingsStore) => state.data;
export const selectIntegrationSettings = (state: SettingsStore) => state.integrations;
export const selectOrganizationSettings = (state: SettingsStore) => state.organization;

export const selectSyncState = (state: SettingsStore) => ({
  isSyncing: state.isSyncing,
  lastSyncedAt: state.lastSyncedAt,
  syncError: state.syncError,
  isDirty: state.isDirty,
});

// ========================================
// HOOKS
// ========================================

export const useGeneralSettings = () => useSettingsStore(selectGeneralSettings);
export const useDisplaySettings = () => useSettingsStore(selectDisplaySettings);
export const useNotificationPreferences = () => useSettingsStore(selectNotificationPreferences);
export const usePrivacySettings = () => useSettingsStore(selectPrivacySettings);
export const useAccessibilitySettings = () => useSettingsStore(selectAccessibilitySettings);
export const useDataSettings = () => useSettingsStore(selectDataSettings);
export const useIntegrationSettings = () => useSettingsStore(selectIntegrationSettings);
export const useOrganizationSettings = () => useSettingsStore(selectOrganizationSettings);
export const useSyncState = () => useSettingsStore(selectSyncState);

// Feature flag hook
export function useFeatureFlag(feature: string): boolean {
  return useSettingsStore((state) => state.features[feature] ?? false);
}

// Locale hook for formatting
export function useLocale() {
  const { language, dateFormat, timeFormat, numberFormat, currency, timezone } = useSettingsStore(selectGeneralSettings);
  
  return {
    language,
    dateFormat,
    timeFormat,
    numberFormat,
    currency,
    timezone,
    formatDate: (date: Date | string) => {
      const d = typeof date === 'string' ? new Date(date) : date;
      return new Intl.DateTimeFormat(numberFormat, {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        timeZone: timezone,
      }).format(d);
    },
    formatTime: (date: Date | string) => {
      const d = typeof date === 'string' ? new Date(date) : date;
      return new Intl.DateTimeFormat(numberFormat, {
        hour: '2-digit',
        minute: '2-digit',
        hour12: timeFormat === '12h',
        timeZone: timezone,
      }).format(d);
    },
    formatDateTime: (date: Date | string) => {
      const d = typeof date === 'string' ? new Date(date) : date;
      return new Intl.DateTimeFormat(numberFormat, {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: timeFormat === '12h',
        timeZone: timezone,
      }).format(d);
    },
    formatNumber: (num: number) => {
      return new Intl.NumberFormat(numberFormat).format(num);
    },
    formatCurrency: (amount: number) => {
      return new Intl.NumberFormat(numberFormat, {
        style: 'currency',
        currency,
      }).format(amount);
    },
  };
}
