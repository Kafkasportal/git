'use client';

/**
 * UI Store (Zustand)
 * Manages global UI state: sidebar, modals, theme, layout preferences
 */

import { create } from 'zustand';
import { devtools, persist, subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

// ========================================
// TYPES
// ========================================

export type ThemeMode = 'light' | 'dark' | 'system';
export type SidebarVariant = 'default' | 'compact' | 'mini';
export type LayoutDensity = 'comfortable' | 'compact' | 'spacious';
export type AccentColor = 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'indigo';

export interface ModalState {
  id: string;
  isOpen: boolean;
  data?: Record<string, unknown>;
}

export interface ToastConfig {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: string;
}

export interface CommandPaletteState {
  isOpen: boolean;
  query: string;
  recentCommands: string[];
}

export interface UIState {
  // Sidebar
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;
  sidebarVariant: SidebarVariant;
  sidebarWidth: number;
  
  // Theme
  theme: ThemeMode;
  accentColor: AccentColor;
  reducedMotion: boolean;
  highContrast: boolean;
  
  // Layout
  layoutDensity: LayoutDensity;
  showBreadcrumbs: boolean;
  showPageHeader: boolean;
  contentMaxWidth: 'full' | 'xl' | '2xl' | '4xl' | '6xl';
  
  // Modals & Dialogs
  modals: Record<string, ModalState>;
  activeModal: string | null;
  
  // Command Palette
  commandPalette: CommandPaletteState;
  
  // Navigation
  breadcrumbs: BreadcrumbItem[];
  pageTitle: string;
  pageDescription: string;
  
  // Loading States
  globalLoading: boolean;
  loadingMessage: string;
  
  // Focus Management
  focusTrapEnabled: boolean;
  lastFocusedElement: string | null;
  
  // Keyboard Navigation
  keyboardNavigationEnabled: boolean;
  currentFocusIndex: number;
  
  // Scroll
  scrollPosition: number;
  isScrolled: boolean;
  
  // Preferences
  tableCompact: boolean;
  showAnimations: boolean;
  soundEnabled: boolean;
}

export interface UIActions {
  // Sidebar Actions
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setSidebarVariant: (variant: SidebarVariant) => void;
  setSidebarWidth: (width: number) => void;
  
  // Theme Actions
  setTheme: (theme: ThemeMode) => void;
  setAccentColor: (color: AccentColor) => void;
  toggleReducedMotion: () => void;
  toggleHighContrast: () => void;
  
  // Layout Actions
  setLayoutDensity: (density: LayoutDensity) => void;
  setShowBreadcrumbs: (show: boolean) => void;
  setShowPageHeader: (show: boolean) => void;
  setContentMaxWidth: (width: UIState['contentMaxWidth']) => void;
  
  // Modal Actions
  openModal: (id: string, data?: Record<string, unknown>) => void;
  closeModal: (id: string) => void;
  closeAllModals: () => void;
  getModalData: <T = Record<string, unknown>>(id: string) => T | undefined;
  isModalOpen: (id: string) => boolean;
  
  // Command Palette Actions
  openCommandPalette: () => void;
  closeCommandPalette: () => void;
  setCommandQuery: (query: string) => void;
  addRecentCommand: (command: string) => void;
  
  // Navigation Actions
  setBreadcrumbs: (items: BreadcrumbItem[]) => void;
  setPageTitle: (title: string) => void;
  setPageDescription: (description: string) => void;
  setPageMeta: (title: string, description?: string, breadcrumbs?: BreadcrumbItem[]) => void;
  
  // Loading Actions
  setGlobalLoading: (loading: boolean, message?: string) => void;
  
  // Focus Actions
  setFocusTrap: (enabled: boolean) => void;
  setLastFocusedElement: (elementId: string | null) => void;
  
  // Keyboard Navigation Actions
  setKeyboardNavigation: (enabled: boolean) => void;
  setCurrentFocusIndex: (index: number) => void;
  
  // Scroll Actions
  setScrollPosition: (position: number) => void;
  
  // Preference Actions
  setTableCompact: (compact: boolean) => void;
  setShowAnimations: (show: boolean) => void;
  setSoundEnabled: (enabled: boolean) => void;
  
  // Reset
  resetUIState: () => void;
}

type UIStore = UIState & UIActions;

// ========================================
// INITIAL STATE
// ========================================

const initialState: UIState = {
  // Sidebar
  sidebarOpen: true,
  sidebarCollapsed: false,
  sidebarVariant: 'default',
  sidebarWidth: 280,
  
  // Theme
  theme: 'system',
  accentColor: 'blue',
  reducedMotion: false,
  highContrast: false,
  
  // Layout
  layoutDensity: 'comfortable',
  showBreadcrumbs: true,
  showPageHeader: true,
  contentMaxWidth: 'full',
  
  // Modals
  modals: {},
  activeModal: null,
  
  // Command Palette
  commandPalette: {
    isOpen: false,
    query: '',
    recentCommands: [],
  },
  
  // Navigation
  breadcrumbs: [],
  pageTitle: '',
  pageDescription: '',
  
  // Loading
  globalLoading: false,
  loadingMessage: '',
  
  // Focus
  focusTrapEnabled: false,
  lastFocusedElement: null,
  
  // Keyboard
  keyboardNavigationEnabled: true,
  currentFocusIndex: -1,
  
  // Scroll
  scrollPosition: 0,
  isScrolled: false,
  
  // Preferences
  tableCompact: false,
  showAnimations: true,
  soundEnabled: true,
};

// ========================================
// STORE
// ========================================

export const useUIStore = create<UIStore>()(
  devtools(
    subscribeWithSelector(
      persist(
        immer((set, get) => ({
          ...initialState,
          
          // ====== Sidebar Actions ======
          toggleSidebar: () => set((state) => {
            state.sidebarOpen = !state.sidebarOpen;
          }),
          
          setSidebarOpen: (open) => set((state) => {
            state.sidebarOpen = open;
          }),
          
          setSidebarCollapsed: (collapsed) => set((state) => {
            state.sidebarCollapsed = collapsed;
          }),
          
          setSidebarVariant: (variant) => set((state) => {
            state.sidebarVariant = variant;
          }),
          
          setSidebarWidth: (width) => set((state) => {
            state.sidebarWidth = Math.max(200, Math.min(400, width));
          }),
          
          // ====== Theme Actions ======
          setTheme: (theme) => set((state) => {
            state.theme = theme;
          }),
          
          setAccentColor: (color) => set((state) => {
            state.accentColor = color;
          }),
          
          toggleReducedMotion: () => set((state) => {
            state.reducedMotion = !state.reducedMotion;
          }),
          
          toggleHighContrast: () => set((state) => {
            state.highContrast = !state.highContrast;
          }),
          
          // ====== Layout Actions ======
          setLayoutDensity: (density) => set((state) => {
            state.layoutDensity = density;
          }),
          
          setShowBreadcrumbs: (show) => set((state) => {
            state.showBreadcrumbs = show;
          }),
          
          setShowPageHeader: (show) => set((state) => {
            state.showPageHeader = show;
          }),
          
          setContentMaxWidth: (width) => set((state) => {
            state.contentMaxWidth = width;
          }),
          
          // ====== Modal Actions ======
          openModal: (id, data) => set((state) => {
            state.modals[id] = { id, isOpen: true, data };
            state.activeModal = id;
          }),
          
          closeModal: (id) => set((state) => {
            if (state.modals[id]) {
              state.modals[id].isOpen = false;
            }
            if (state.activeModal === id) {
              state.activeModal = null;
            }
          }),
          
          closeAllModals: () => set((state) => {
            Object.keys(state.modals).forEach((id) => {
              state.modals[id].isOpen = false;
            });
            state.activeModal = null;
          }),
          
          getModalData: <T = Record<string, unknown>>(id: string): T | undefined => {
            const modal = get().modals[id];
            return modal?.data as T | undefined;
          },
          
          isModalOpen: (id: string): boolean => {
            return get().modals[id]?.isOpen ?? false;
          },
          
          // ====== Command Palette Actions ======
          openCommandPalette: () => set((state) => {
            state.commandPalette.isOpen = true;
          }),
          
          closeCommandPalette: () => set((state) => {
            state.commandPalette.isOpen = false;
            state.commandPalette.query = '';
          }),
          
          setCommandQuery: (query) => set((state) => {
            state.commandPalette.query = query;
          }),
          
          addRecentCommand: (command) => set((state) => {
            const recent = state.commandPalette.recentCommands.filter((c) => c !== command);
            state.commandPalette.recentCommands = [command, ...recent].slice(0, 10);
          }),
          
          // ====== Navigation Actions ======
          setBreadcrumbs: (items) => set((state) => {
            state.breadcrumbs = items;
          }),
          
          setPageTitle: (title) => set((state) => {
            state.pageTitle = title;
          }),
          
          setPageDescription: (description) => set((state) => {
            state.pageDescription = description;
          }),
          
          setPageMeta: (title, description, breadcrumbs) => set((state) => {
            state.pageTitle = title;
            if (description !== undefined) state.pageDescription = description;
            if (breadcrumbs !== undefined) state.breadcrumbs = breadcrumbs;
          }),
          
          // ====== Loading Actions ======
          setGlobalLoading: (loading, message) => set((state) => {
            state.globalLoading = loading;
            state.loadingMessage = message || '';
          }),
          
          // ====== Focus Actions ======
          setFocusTrap: (enabled) => set((state) => {
            state.focusTrapEnabled = enabled;
          }),
          
          setLastFocusedElement: (elementId) => set((state) => {
            state.lastFocusedElement = elementId;
          }),
          
          // ====== Keyboard Navigation Actions ======
          setKeyboardNavigation: (enabled) => set((state) => {
            state.keyboardNavigationEnabled = enabled;
          }),
          
          setCurrentFocusIndex: (index) => set((state) => {
            state.currentFocusIndex = index;
          }),
          
          // ====== Scroll Actions ======
          setScrollPosition: (position) => set((state) => {
            state.scrollPosition = position;
            state.isScrolled = position > 0;
          }),
          
          // ====== Preference Actions ======
          setTableCompact: (compact) => set((state) => {
            state.tableCompact = compact;
          }),
          
          setShowAnimations: (show) => set((state) => {
            state.showAnimations = show;
          }),
          
          setSoundEnabled: (enabled) => set((state) => {
            state.soundEnabled = enabled;
          }),
          
          // ====== Reset ======
          resetUIState: () => set(() => initialState),
        })),
        {
          name: 'ui-store',
          partialize: (state) => ({
            // Only persist user preferences
            sidebarOpen: state.sidebarOpen,
            sidebarCollapsed: state.sidebarCollapsed,
            sidebarVariant: state.sidebarVariant,
            sidebarWidth: state.sidebarWidth,
            theme: state.theme,
            accentColor: state.accentColor,
            reducedMotion: state.reducedMotion,
            highContrast: state.highContrast,
            layoutDensity: state.layoutDensity,
            showBreadcrumbs: state.showBreadcrumbs,
            showPageHeader: state.showPageHeader,
            contentMaxWidth: state.contentMaxWidth,
            tableCompact: state.tableCompact,
            showAnimations: state.showAnimations,
            soundEnabled: state.soundEnabled,
            commandPalette: {
              recentCommands: state.commandPalette.recentCommands,
            },
          }),
        }
      )
    ),
    { name: 'UIStore' }
  )
);

// ========================================
// SELECTORS
// ========================================

export const selectSidebarState = (state: UIStore) => ({
  open: state.sidebarOpen,
  collapsed: state.sidebarCollapsed,
  variant: state.sidebarVariant,
  width: state.sidebarWidth,
});

export const selectThemeState = (state: UIStore) => ({
  theme: state.theme,
  accentColor: state.accentColor,
  reducedMotion: state.reducedMotion,
  highContrast: state.highContrast,
});

export const selectLayoutState = (state: UIStore) => ({
  density: state.layoutDensity,
  showBreadcrumbs: state.showBreadcrumbs,
  showPageHeader: state.showPageHeader,
  contentMaxWidth: state.contentMaxWidth,
});

export const selectNavigationState = (state: UIStore) => ({
  breadcrumbs: state.breadcrumbs,
  pageTitle: state.pageTitle,
  pageDescription: state.pageDescription,
});

// Removed mobile device detection

// ========================================
// HOOKS
// ========================================

export const useSidebar = () => useUIStore(selectSidebarState);
export const useTheme = () => useUIStore(selectThemeState);
export const useLayout = () => useUIStore(selectLayoutState);
export const useNavigation = () => useUIStore(selectNavigationState);

// Modal hook with type safety
export function useModal<T = Record<string, unknown>>(id: string) {
  const isOpen = useUIStore((state) => state.modals[id]?.isOpen ?? false);
  const data = useUIStore((state) => state.modals[id]?.data as T | undefined);
  const openModal = useUIStore((state) => state.openModal);
  const closeModal = useUIStore((state) => state.closeModal);
  
  return {
    isOpen,
    data,
    open: (modalData?: T) => openModal(id, modalData as Record<string, unknown>),
    close: () => closeModal(id),
  };
}
