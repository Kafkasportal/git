/**
 * Tests for useOnlineStatus hook
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';

describe('useOnlineStatus', () => {
  beforeEach(() => {
    // Reset navigator.onLine
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      configurable: true,
      value: true,
    });
  });

  it('should return initial state matching navigator.onLine', () => {
    navigator.onLine = true;
    const { result } = renderHook(() => useOnlineStatus());
    expect(result.current.isOnline).toBe(true);
    expect(result.current.isOffline).toBe(false);
  });

  it('should update state when online event fires', async () => {
    navigator.onLine = false;
    const { result } = renderHook(() => useOnlineStatus());

    expect(result.current.isOffline).toBe(true);

    // Simulate online event
    navigator.onLine = true;
    window.dispatchEvent(new Event('online'));

    await waitFor(() => {
      expect(result.current.isOnline).toBe(true);
      expect(result.current.isOffline).toBe(false);
    });
  });

  it('should update state when offline event fires', async () => {
    navigator.onLine = true;
    const { result } = renderHook(() => useOnlineStatus());

    expect(result.current.isOnline).toBe(true);

    // Simulate offline event
    navigator.onLine = false;
    window.dispatchEvent(new Event('offline'));

    await waitFor(() => {
      expect(result.current.isOnline).toBe(false);
      expect(result.current.isOffline).toBe(true);
    });
  });

  it('should clean up event listeners on unmount', () => {
    const addEventListenerSpy = vi.spyOn(window, 'addEventListener');
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

    const { unmount } = renderHook(() => useOnlineStatus());

    expect(addEventListenerSpy).toHaveBeenCalledWith('online', expect.any(Function));
    expect(addEventListenerSpy).toHaveBeenCalledWith('offline', expect.any(Function));

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith('online', expect.any(Function));
    expect(removeEventListenerSpy).toHaveBeenCalledWith('offline', expect.any(Function));
  });

  it('should handle SSR safely (window undefined)', () => {
    const originalWindow = global.window;
    // @ts-expect-error - Testing SSR scenario
    global.window = undefined;

    // Should not throw
    expect(() => {
      renderHook(() => useOnlineStatus());
    }).not.toThrow();

    global.window = originalWindow;
  });
});

