import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
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
  let eventSourceInstance: any = null;

  beforeEach(() => {
    vi.clearAllMocks();
    eventSourceInstance = null; // Reset instance before each test
    
    (useNotificationStore as any).mockReturnValue({
      addNotification: mockAddNotification,
    });

    // Mock EventSource
    global.EventSource = vi.fn().mockImplementation(() => {
      eventSourceInstance = {
        onopen: null,
        onmessage: null,
        onerror: null,
        close: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      };
      return eventSourceInstance;
    }) as any;
  });

  afterEach(() => {
    vi.clearAllTimers();
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

  it('handles connection open event', async () => {
    renderHook(() => useNotificationStream('test-user'));

    await waitFor(() => {
      expect(eventSourceInstance).toBeTruthy();
    });

    if (eventSourceInstance.onopen) {
      eventSourceInstance.onopen();
    }
  });

  it('handles notification messages', async () => {
    renderHook(() => useNotificationStream('test-user'));

    await waitFor(() => {
      expect(eventSourceInstance).toBeTruthy();
    });

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

  it('handles reconnection on error', async () => {
    vi.useFakeTimers();
    renderHook(() => useNotificationStream('test-user'));

    await waitFor(() => {
      expect(eventSourceInstance).toBeTruthy();
    });

    if (eventSourceInstance.onerror) {
      eventSourceInstance.onerror(new Error('Connection error'));
    }

    vi.advanceTimersByTime(1000);

    // Should attempt reconnection
    expect(global.EventSource).toHaveBeenCalledTimes(2);

    vi.useRealTimers();
  });

  it('cleans up connection on unmount', async () => {
    const { unmount } = renderHook(() => useNotificationStream('test-user'));

    await waitFor(() => {
      expect(eventSourceInstance).toBeTruthy();
    });

    unmount();

    expect(eventSourceInstance.close).toHaveBeenCalled();
  });
});

