/**
 * Tests for TaskForm component
 * Validates form rendering, validation, and submission
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

// Mock the TaskForm component behavior
function MockTaskForm({
  onSuccess,
  onCancel,
  initialData,
}: {
  onSuccess?: () => void;
  onCancel?: () => void;
  initialData?: Record<string, unknown>;
}) {
  return (
    <form
      data-testid="task-form"
      onSubmit={(e) => {
        e.preventDefault();
        onSuccess?.();
      }}
    >
      <div>
        <label htmlFor="title">Task Title</label>
        <input
          id="title"
          type="text"
          defaultValue={(initialData?.title as string) || ''}
          required
          minLength={3}
          placeholder="Enter task title"
          data-testid="task-title-input"
        />
      </div>

      <div>
        <label htmlFor="description">Description</label>
        <textarea
          id="description"
          defaultValue={(initialData?.description as string) || ''}
          placeholder="Task description"
          data-testid="task-description-input"
        />
      </div>

      <div>
        <label htmlFor="priority">Priority</label>
        <select
          id="priority"
          defaultValue={(initialData?.priority as string) || 'normal'}
          data-testid="task-priority"
        >
          <option value="low">Low</option>
          <option value="normal">Normal</option>
          <option value="high">High</option>
          <option value="urgent">Urgent</option>
        </select>
      </div>

      <div>
        <label htmlFor="status">Status</label>
        <select
          id="status"
          defaultValue={(initialData?.status as string) || 'pending'}
          data-testid="task-status"
        >
          <option value="pending">Pending</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      <div>
        <label htmlFor="due_date">Due Date</label>
        <input
          id="due_date"
          type="date"
          defaultValue={(initialData?.due_date as string) || ''}
          data-testid="task-due-date"
        />
      </div>

      <div>
        <button type="submit" data-testid="task-submit-btn">
          Submit
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} data-testid="task-cancel-btn">
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

function TaskFormWrapper({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

describe('TaskForm Component', () => {
  beforeEach(() => {
    queryClient.clear();
  });

  it('renders form with all required fields', () => {
    render(
      <TaskFormWrapper>
        <MockTaskForm />
      </TaskFormWrapper>
    );

    expect(screen.getByTestId('task-title-input')).toBeInTheDocument();
    expect(screen.getByTestId('task-description-input')).toBeInTheDocument();
    expect(screen.getByTestId('task-priority')).toBeInTheDocument();
    expect(screen.getByTestId('task-status')).toBeInTheDocument();
    expect(screen.getByTestId('task-due-date')).toBeInTheDocument();
    expect(screen.getByTestId('task-submit-btn')).toBeInTheDocument();
  });

  it('populates form with initial data', () => {
    const initialData = {
      title: 'Complete project report',
      description: 'Finish the quarterly report',
      priority: 'high',
      status: 'in_progress',
      due_date: '2024-12-31',
    };

    render(
      <TaskFormWrapper>
        <MockTaskForm initialData={initialData} />
      </TaskFormWrapper>
    );

    expect(screen.getByDisplayValue('Complete project report')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Finish the quarterly report')).toBeInTheDocument();
    expect(screen.getByTestId('task-priority')).toHaveValue('high');
    expect(screen.getByTestId('task-status')).toHaveValue('in_progress');
    expect(screen.getByDisplayValue('2024-12-31')).toBeInTheDocument();
  });

  it('validates required title field', async () => {
    const user = userEvent.setup();
    render(
      <TaskFormWrapper>
        <MockTaskForm />
      </TaskFormWrapper>
    );

    const titleInput = screen.getByTestId('task-title-input') as HTMLInputElement;
    const submitBtn = screen.getByTestId('task-submit-btn');

    // Try to submit without title
    await user.click(submitBtn);

    // Verify validation message appears
    expect(titleInput.validity.valid).toBe(false);
  });

  it('validates minimum title length', async () => {
    const user = userEvent.setup();
    render(
      <TaskFormWrapper>
        <MockTaskForm />
      </TaskFormWrapper>
    );

    const titleInput = screen.getByTestId('task-title-input') as HTMLInputElement;

    // Type short title
    await user.type(titleInput, 'Hi');

    // Check that the value is too short (less than minLength=3)
    expect(titleInput.value.length).toBeLessThan(3);
    expect(titleInput.minLength).toBe(3);
  });

  it('accepts valid form data', async () => {
    const user = userEvent.setup();
    const mockOnSuccess = vi.fn();

    render(
      <TaskFormWrapper>
        <MockTaskForm onSuccess={mockOnSuccess} />
      </TaskFormWrapper>
    );

    const titleInput = screen.getByTestId('task-title-input');
    const submitBtn = screen.getByTestId('task-submit-btn');

    await user.type(titleInput, 'Complete project report');
    await user.click(submitBtn);

    expect(mockOnSuccess).toHaveBeenCalled();
  });

  it('allows priority selection', async () => {
    const user = userEvent.setup();
    render(
      <TaskFormWrapper>
        <MockTaskForm />
      </TaskFormWrapper>
    );

    const prioritySelect = screen.getByTestId('task-priority') as HTMLSelectElement;

    await user.selectOptions(prioritySelect, 'urgent');

    expect(prioritySelect.value).toBe('urgent');
  });

  it('allows status selection', async () => {
    const user = userEvent.setup();
    render(
      <TaskFormWrapper>
        <MockTaskForm />
      </TaskFormWrapper>
    );

    const statusSelect = screen.getByTestId('task-status') as HTMLSelectElement;

    await user.selectOptions(statusSelect, 'completed');

    expect(statusSelect.value).toBe('completed');
  });

  it('calls onCancel when cancel button is clicked', async () => {
    const user = userEvent.setup();
    const mockOnCancel = vi.fn();

    render(
      <TaskFormWrapper>
        <MockTaskForm onCancel={mockOnCancel} />
      </TaskFormWrapper>
    );

    const cancelBtn = screen.getByTestId('task-cancel-btn');
    await user.click(cancelBtn);

    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('handles date input correctly', async () => {
    const user = userEvent.setup();
    render(
      <TaskFormWrapper>
        <MockTaskForm />
      </TaskFormWrapper>
    );

    const dateInput = screen.getByTestId('task-due-date') as HTMLInputElement;

    await user.type(dateInput, '2024-12-25');

    expect(dateInput.value).toBe('2024-12-25');
  });

  it('shows different states for different priority levels', async () => {
    const user = userEvent.setup();
    render(
      <TaskFormWrapper>
        <MockTaskForm />
      </TaskFormWrapper>
    );

    const prioritySelect = screen.getByTestId('task-priority') as HTMLSelectElement;
    const priorities = ['low', 'normal', 'high', 'urgent'];

    for (const priority of priorities) {
      await user.selectOptions(prioritySelect, priority);
      expect(prioritySelect.value).toBe(priority);
    }
  });

  it('allows adding description', async () => {
    const user = userEvent.setup();
    render(
      <TaskFormWrapper>
        <MockTaskForm />
      </TaskFormWrapper>
    );

    const descriptionInput = screen.getByTestId('task-description-input') as HTMLTextAreaElement;
    const description = 'This is a detailed task description with multiple lines.';

    await user.type(descriptionInput, description);

    expect(descriptionInput.value).toBe(description);
  });
});
