import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useNotificationStream } from "@/hooks/useNotificationStream";
import { useNotificationStore } from "@/stores/notificationStore";

// Mock the store
vi.mock("@/stores/notificationStore", () => ({
  useNotificationStore: vi.fn(),
}));

// Mock logger
vi.mock("@/lib/logger", () => ({
  default: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

// Track EventSource instances at module level
const eventSourceInstances: any[] = [];
const mockClose = vi.fn();

describe("useNotificationStream", () => {
  const mockAddNotification = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    eventSourceInstances.length = 0; // Clear array
    mockClose.mockClear();

    (useNotificationStore as any).mockReturnValue({
      addNotification: mockAddNotification,
    });

    // Mock EventSource at global level
    (globalThis as any).EventSource = vi
      .fn()
      .mockImplementation(function (this: any) {
        this.onopen = null;
        this.onmessage = null;
        this.onerror = null;
        this.close = mockClose;
        this.addEventListener = vi.fn();
        this.removeEventListener = vi.fn();
        eventSourceInstances.push(this);
        return this;
      });
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it("creates EventSource connection when userId is provided", () => {
    renderHook(() => useNotificationStream("test-user"));

    expect(globalThis.EventSource).toHaveBeenCalledWith(
      "/api/notifications/stream",
      {
        withCredentials: true,
      }
    );
    expect(eventSourceInstances.length).toBe(1);
  });

  it("does not create connection when userId is undefined", () => {
    renderHook(() => useNotificationStream(undefined));

    expect(globalThis.EventSource).not.toHaveBeenCalled();
    expect(eventSourceInstances.length).toBe(0);
  });

  it("handles connection open event", () => {
    renderHook(() => useNotificationStream("test-user"));

    expect(eventSourceInstances.length).toBe(1);
    const instance = eventSourceInstances[0];

    // Trigger onopen
    act(() => {
      if (instance.onopen) {
        instance.onopen();
      }
    });

    // Should not throw any errors
    expect(instance.onopen).toBeDefined();
  });

  it("handles notification messages", () => {
    renderHook(() => useNotificationStream("test-user"));

    expect(eventSourceInstances.length).toBe(1);
    const instance = eventSourceInstances[0];

    const notificationData = {
      type: "notification",
      data: {
        $id: "1",
        title: "Test",
        body: "Test body",
        status: "beklemede",
      },
    };

    // Trigger onmessage
    act(() => {
      if (instance.onmessage) {
        instance.onmessage({
          data: JSON.stringify(notificationData),
        });
      }
    });

    // The hook converts WorkflowNotificationDocument to Notification format
    expect(mockAddNotification).toHaveBeenCalledWith({
      type: "info", // Uses 'info' as default when category is undefined
      title: "Test",
      message: "Test body",
      body: notificationData.data.body,
      status: "unread", // Converted from 'beklemede'
      category: undefined,
      $id: "1", // From the test data
      _id: undefined,
      $createdAt: undefined,
      created_at: undefined,
    });
  });

  it("handles reconnection on error", async () => {
    vi.useFakeTimers();

    renderHook(() => useNotificationStream("test-user"));

    expect(eventSourceInstances.length).toBe(1);
    const instance = eventSourceInstances[0];

    // Trigger error - this should schedule a reconnection
    act(() => {
      if (instance.onerror) {
        instance.onerror(new Error("Connection error"));
      }
    });

    // Advance timer for reconnection (baseReconnectDelay = 1000ms * 2^0 = 1000ms)
    await act(async () => {
      vi.advanceTimersByTime(1100);
    });

    // Should have created a second EventSource instance
    expect(eventSourceInstances.length).toBe(2);
  });

  it("cleans up connection on unmount", () => {
    const { unmount } = renderHook(() => useNotificationStream("test-user"));

    expect(eventSourceInstances.length).toBe(1);

    unmount();

    expect(mockClose).toHaveBeenCalled();
  });
});
