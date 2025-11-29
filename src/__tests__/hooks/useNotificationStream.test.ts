import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useNotificationStream } from '@/hooks/useNotificationStream';
import { useNotificationStore } from '@/stores/notificationStore';

// Mock the store
vi.mock('@/stores/notificationStore', () => ({
  useNotificationStore: vi.fn(),
}));

// Mock logger
vi.mock('@/lib/logger', () => ({
  default: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

describe('useNotificationStream', () => {
  const mockAddNotification = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useNotificationStore as any).mockReturnValue({
      addNotification: mockAddNotification,
    });

    // Mock EventSource
    global.EventSource = vi.fn().mockImplementation(() => {
      return {
        onopen: null,
        onmessage: null,
        onerror: null,
        close: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      };
    }) as any;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('creates EventSource connection when userId is provided', () => {
    renderHook(() => useNotificationStream('test-user'));

    expect(global.EventSource).toHaveBeenCalledWith('/api/notifications/stream', {
      withCredentials: true,
    });
  });

  it('does not create connection when userId is undefined', () => {
    renderHook(() => useNotificationStream(undefined));

    expect(global.EventSource).not.toHaveBeenCalled();
  });

  it('handles connection open event', () => {
    let eventSourceInstance: any = null;
    (global.EventSource as any).mockImplementation((url: string, options: any) => {
      eventSourceInstance = {
        onopen: null,
        onmessage: null,
        onerror: null,
        close: vi.fn(),
      };
      return eventSourceInstance;
    });

    renderHook(() => useNotificationStream('test-user'));

    expect(eventSourceInstance).toBeTruthy();
    if (eventSourceInstance.onopen) {
      eventSourceInstance.onopen();
    }
  });

  it('handles notification messages', () => {
    let eventSourceInstance: any = null;
    (global.EventSource as any).mockImplementation(() => {
      eventSourceInstance = {
        onopen: null,
        onmessage: null,
        onerror: null,
        close: vi.fn(),
      };
      return eventSourceInstance;
    });

    renderHook(() => useNotificationStream('test-user'));

    const notificationData = {
      type: 'notification',
      data: {
        $id: '1',
        title: 'Test',
        body: 'Test body',
        status: 'beklemede',
      },
    };

    if (eventSourceInstance.onmessage) {
      eventSourceInstance.onmessage({
        data: JSON.stringify(notificationData),
      });
    }

    expect(mockAddNotification).toHaveBeenCalledWith(notificationData.data);
  });

  it('handles reconnection on error', () => {
    let eventSourceInstance: any = null;
    let reconnectTimeout: NodeJS.Timeout | null = null;

    (global.EventSource as any).mockImplementation(() => {
      eventSourceInstance = {
        onopen: null,
        onmessage: null,
        onerror: null,
        close: vi.fn(),
      };
      return eventSourceInstance;
    });

    vi.useFakeTimers();
    renderHook(() => useNotificationStream('test-user'));

    if (eventSourceInstance.onerror) {
      eventSourceInstance.onerror(new Error('Connection error'));
    }

    vi.advanceTimersByTime(1000);

    // Should attempt reconnection
    expect(global.EventSource).toHaveBeenCalledTimes(2);

    vi.useRealTimers();
  });

  it('cleans up connection on unmount', () => {
    let eventSourceInstance: any = null;
    (global.EventSource as any).mockImplementation(() => {
      eventSourceInstance = {
        onopen: null,
        onmessage: null,
        onerror: null,
        close: vi.fn(),
      };
      return eventSourceInstance;
    });

    const { unmount } = renderHook(() => useNotificationStream('test-user'));

    unmount();

    expect(eventSourceInstance.close).toHaveBeenCalled();
  });
});

