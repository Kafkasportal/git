/**
 * Stores Index
 * Re-exports all Zustand stores for convenient imports
 */

// Auth Store
export { 
  useAuthStore, 
  backendUserToStoreUser 
} from './authStore';
export type { } from './authStore';

// Notification Store
export { 
  useNotificationStore 
} from './notificationStore';
export type { 
  NotificationType, 
  Notification, 
  NotificationSettings 
} from './notificationStore';

// UI Store
export { 
  useUIStore,
  useSidebar,
  useTheme,
  useLayout,
  useNavigation,
  useModal,
  selectSidebarState,
  selectThemeState,
  selectLayoutState,
  selectNavigationState,
} from './uiStore';
export type {
  ThemeMode,
  SidebarVariant,
  LayoutDensity,
  AccentColor,
  ModalState,
  ToastConfig,
  BreadcrumbItem,
  CommandPaletteState,
  UIState,
  UIActions,
} from './uiStore';

// Settings Store
export {
  useSettingsStore,
  useGeneralSettings,
  useDisplaySettings,
  useNotificationPreferences,
  usePrivacySettings,
  useAccessibilitySettings,
  useDataSettings,
  useIntegrationSettings,
  useOrganizationSettings,
  useSyncState,
  useFeatureFlag,
  useLocale,
  selectGeneralSettings,
  selectDisplaySettings,
  selectNotificationPreferences,
  selectPrivacySettings,
  selectAccessibilitySettings,
  selectDataSettings,
  selectIntegrationSettings,
  selectOrganizationSettings,
  selectSyncState,
} from './settingsStore';
export type {
  Language,
  DateFormat,
  TimeFormat,
  Currency,
  NumberFormat,
  GeneralSettings,
  DisplaySettings,
  NotificationPreferences,
  PrivacySettings,
  AccessibilitySettings,
  DataSettings,
  IntegrationSettings,
  OrganizationSettings,
  SettingsState,
  SettingsActions,
} from './settingsStore';
