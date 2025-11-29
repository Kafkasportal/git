import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { NotificationCenter } from '@/components/notifications/NotificationCenter';
import { useNotificationStore } from '@/stores/notificationStore';

// Mock the store
vi.mock('@/stores/notificationStore', () => ({
  useNotificationStore: vi.fn(),
}));

// Mock the hook
vi.mock('@/hooks/useNotificationStream', () => ({
  useNotificationStream: vi.fn(),
}));

// Mock API client
vi.mock('@/lib/api/api-client', () => ({
  apiClient: {
    workflowNotifications: {
      getNotifications: vi.fn(),
      markNotificationRead: vi.fn(),
      deleteNotification: vi.fn(),
    },
  },
}));

// Mock query client
vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual('@tanstack/react-query');
  return {
    ...actual,
    useQuery: vi.fn(() => ({
      data: { data: [] },
      isLoading: false,
    })),
    useMutation: vi.fn(() => ({
      mutate: vi.fn(),
      mutateAsync: vi.fn(),
      isPending: false,
    })),
    useQueryClient: vi.fn(() => ({
      invalidateQueries: vi.fn(),
    })),
  };
});

describe('NotificationCenter', () => {
  const mockNotifications = [
    {
      $id: '1',
      title: 'Test Notification',
      body: 'Test body',
      status: 'beklemede',
      category: 'meeting',
      created_at: new Date().toISOString(),
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    (useNotificationStore as any).mockReturnValue({
      notifications: mockNotifications,
      unreadCount: 1,
      markAsRead: vi.fn(),
      markAllAsRead: vi.fn(),
      deleteNotification: vi.fn(),
      setNotifications: vi.fn(),
    });
  });

  it('renders notification center', () => {
    render(<NotificationCenter userId="test-user" />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('shows unread count badge', () => {
    render(<NotificationCenter userId="test-user" />);
    const badge = screen.getByText('1');
    expect(badge).toBeInTheDocument();
  });

  it('opens popover when clicked', async () => {
    render(<NotificationCenter userId="test-user" />);
    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText(/bildirimler/i)).toBeInTheDocument();
    });
  });

  it('displays notifications', async () => {
    render(<NotificationCenter userId="test-user" />);
    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText('Test Notification')).toBeInTheDocument();
    });
  });
});

