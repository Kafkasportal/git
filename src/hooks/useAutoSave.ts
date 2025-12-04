'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import logger from '@/lib/logger';

interface AutoSaveOptions<T> {
  /**
   * Veri değişikliği
   */
  data: T;

  /**
   * Kaydetme fonksiyonu
   */
  onSave: (data: T) => Promise<void>;

  /**
   * Kaydetme gecikmesi (ms)
   * @default 2000
   */
  delay?: number;

  /**
   * Auto-save aktif mi?
   * @default true
   */
  enabled?: boolean;

  /**
   * LocalStorage anahtarı (draft kaydetmek için)
   */
  storageKey?: string;

  /**
   * Kaydetme öncesi doğrulama
   */
  validate?: (data: T) => boolean;

  /**
   * Hata callback
   */
  onError?: (error: Error) => void;

  /**
   * Başarı callback
   */
  onSuccess?: () => void;

  /**
   * Draft geri yüklendiğinde callback
   */
  onDraftRestored?: (draft: T) => void;
}

interface AutoSaveState {
  /**
   * Son kaydetme zamanı
   */
  lastSaved: Date | null;

  /**
   * Kaydedilmemiş değişiklik var mı?
   */
  hasUnsavedChanges: boolean;

  /**
   * Kaydetme işlemi devam ediyor mu?
   */
  isSaving: boolean;

  /**
   * Hata durumu
   */
  error: Error | null;

  /**
   * Draft mevcut mu?
   */
  hasDraft: boolean;
}

/**
 * Form auto-save hook'u
 * Veri değişikliklerini otomatik olarak kaydeder ve draft yönetimi sağlar
 */
export function useAutoSave<T extends Record<string, unknown>>({
  data,
  onSave,
  delay = 2000,
  enabled = true,
  storageKey,
  validate,
  onError,
  onSuccess,
  onDraftRestored,
}: AutoSaveOptions<T>) {
  const [state, setState] = useState<AutoSaveState>({
    lastSaved: null,
    hasUnsavedChanges: false,
    isSaving: false,
    error: null,
    hasDraft: false,
  });

  const debouncedData = useDebounce(data, delay);
  const previousDataRef = useRef<string>('');
  const initializedRef = useRef(false);
  const saveInProgressRef = useRef(false);

  // Check for existing draft on mount
  useEffect(() => {
    if (!storageKey || initializedRef.current) return;
    initializedRef.current = true;

    try {
      const savedDraft = localStorage.getItem(storageKey);
      if (savedDraft) {
        const draft = JSON.parse(savedDraft) as T;
        setState((s: AutoSaveState) => ({ ...s, hasDraft: true }));
        onDraftRestored?.(draft);
        logger.info('Draft restored', { storageKey });
      }
    } catch (error) {
      logger.error('Failed to restore draft', { error, storageKey });
    }
  }, [storageKey, onDraftRestored]);

  // Save draft to localStorage
  const saveDraft = useCallback((dataToSave: T) => {
    if (!storageKey) return;

    try {
      localStorage.setItem(storageKey, JSON.stringify(dataToSave));
      setState((s: AutoSaveState) => ({ ...s, hasDraft: true }));
      logger.debug('Draft saved to localStorage', { storageKey });
    } catch (error) {
      logger.error('Failed to save draft', { error, storageKey });
    }
  }, [storageKey]);

  // Clear draft from localStorage
  const clearDraft = useCallback(() => {
    if (!storageKey) return;

    try {
      localStorage.removeItem(storageKey);
      setState((s: AutoSaveState) => ({ ...s, hasDraft: false }));
      logger.debug('Draft cleared', { storageKey });
    } catch (error) {
      logger.error('Failed to clear draft', { error, storageKey });
    }
  }, [storageKey]);

  // Save function
  const save = useCallback(async (dataToSave: T): Promise<boolean> => {
    if (saveInProgressRef.current) {
      logger.debug('Save already in progress, skipping');
      return false;
    }

    // Validate if validator provided
    if (validate && !validate(dataToSave)) {
      logger.debug('Validation failed, skipping save');
      return false;
    }

    saveInProgressRef.current = true;
    setState((s: AutoSaveState) => ({ ...s, isSaving: true, error: null }));

    try {
      await onSave(dataToSave);

      setState((s: AutoSaveState) => ({
        ...s,
        lastSaved: new Date(),
        hasUnsavedChanges: false,
        isSaving: false,
        error: null,
      }));

      // Clear draft on successful save
      clearDraft();
      onSuccess?.();

      logger.info('Auto-save completed');
      return true;
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Kaydetme başarısız');

      setState((s: AutoSaveState) => ({
        ...s,
        isSaving: false,
        error: err,
      }));

      // Still save draft on error
      saveDraft(dataToSave);
      onError?.(err);

      logger.error('Auto-save failed', { error });
      return false;
    } finally {
      saveInProgressRef.current = false;
    }
  }, [onSave, validate, clearDraft, saveDraft, onSuccess, onError]);

  // Auto-save on debounced data change
  useEffect(() => {
    if (!enabled) return;

    const currentDataStr = JSON.stringify(debouncedData);

    // Skip if data hasn't changed
    if (currentDataStr === previousDataRef.current) {
      return;
    }

    // Skip initial render
    if (!previousDataRef.current) {
      previousDataRef.current = currentDataStr;
      return;
    }

    previousDataRef.current = currentDataStr;
    setState((s: AutoSaveState) => ({ ...s, hasUnsavedChanges: true }));

    // Save draft immediately
    saveDraft(debouncedData);

    // Trigger auto-save
    save(debouncedData);
  }, [debouncedData, enabled, save, saveDraft]);

  // Track unsaved changes immediately (before debounce)
  useEffect(() => {
    const currentDataStr = JSON.stringify(data);

    if (currentDataStr !== previousDataRef.current && previousDataRef.current) {
      setState((s: AutoSaveState) => ({ ...s, hasUnsavedChanges: true }));
    }
  }, [data]);

  // Manual save trigger
  const saveNow = useCallback(() => {
    return save(data);
  }, [save, data]);

  // Restore draft
  const restoreDraft = useCallback((): T | null => {
    if (!storageKey) return null;

    try {
      const savedDraft = localStorage.getItem(storageKey);
      if (savedDraft) {
        return JSON.parse(savedDraft) as T;
      }
    } catch (error) {
      logger.error('Failed to restore draft', { error, storageKey });
    }

    return null;
  }, [storageKey]);

  // Discard draft
  const discardDraft = useCallback(() => {
    clearDraft();
    setState((s: AutoSaveState) => ({ ...s, hasUnsavedChanges: false }));
  }, [clearDraft]);

  // Format last saved time
  const formatLastSaved = useCallback(() => {
    if (!state.lastSaved) return null;

    const now = new Date();
    const diff = now.getTime() - state.lastSaved.getTime();

    if (diff < 60000) {
      return 'Az önce kaydedildi';
    }

    if (diff < 3600000) {
      const minutes = Math.floor(diff / 60000);
      return `${minutes} dakika önce kaydedildi`;
    }

    return `${state.lastSaved.toLocaleTimeString('tr-TR', {
      hour: '2-digit',
      minute: '2-digit',
    })} tarihinde kaydedildi`;
  }, [state.lastSaved]);

  return {
    ...state,
    saveNow,
    restoreDraft,
    discardDraft,
    clearDraft,
    formatLastSaved,
  };
}

/**
 * Auto-save durum göstergesi için hook
 */
export function useAutoSaveIndicator(state: AutoSaveState) {
  const getStatusText = useCallback(() => {
    if (state.isSaving) return 'Kaydediliyor...';
    if (state.error) return 'Kaydetme başarısız';
    if (state.hasUnsavedChanges) return 'Kaydedilmemiş değişiklikler';
    if (state.lastSaved) return 'Kaydedildi';
    return '';
  }, [state]);

  const getStatusColor = useCallback(() => {
    if (state.isSaving) return 'text-blue-500';
    if (state.error) return 'text-red-500';
    if (state.hasUnsavedChanges) return 'text-yellow-500';
    if (state.lastSaved) return 'text-green-500';
    return 'text-muted-foreground';
  }, [state]);

  return {
    statusText: getStatusText(),
    statusColor: getStatusColor(),
    showIndicator: state.isSaving || state.hasUnsavedChanges || !!state.error || !!state.lastSaved,
  };
}
