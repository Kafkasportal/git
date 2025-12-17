import { describe, it, expect } from 'vitest';
import {
  isOfflineModeSupported,
} from '@/lib/utils/offline-sync';

describe('offline-sync', () => {
  describe('isOfflineModeSupported', () => {
    it('should detect IndexedDB support', () => {
      const supported = isOfflineModeSupported();
      expect(typeof supported).toBe('boolean');
    });
  });
});
