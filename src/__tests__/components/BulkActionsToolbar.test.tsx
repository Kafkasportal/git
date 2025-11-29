import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BulkActionsToolbar } from '@/components/ui/bulk-actions-toolbar';

describe('BulkActionsToolbar', () => {
  it('renders nothing when selectedCount is 0', () => {
    const { container } = render(
      <BulkActionsToolbar selectedCount={0} onClearSelection={vi.fn()} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders toolbar when items are selected', () => {
    render(
      <BulkActionsToolbar
        selectedCount={5}
        onClearSelection={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    expect(screen.getByText(/5 seçili/i)).toBeInTheDocument();
  });

  it('calls onClearSelection when clear button is clicked', () => {
    const onClearSelection = vi.fn();
    render(
      <BulkActionsToolbar selectedCount={3} onClearSelection={onClearSelection} />
    );

    const clearButton = screen.getByRole('button', { name: /temizle/i });
    fireEvent.click(clearButton);

    expect(onClearSelection).toHaveBeenCalledTimes(1);
  });

  it('shows delete dialog when delete button is clicked', async () => {
    const onDelete = vi.fn();
    render(
      <BulkActionsToolbar selectedCount={2} onClearSelection={vi.fn()} onDelete={onDelete} />
    );

    const deleteButton = screen.getByRole('button', { name: /sil/i });
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(screen.getByText(/silmek istediğinizden emin misiniz/i)).toBeInTheDocument();
    });
  });

  it('calls onDelete when delete is confirmed', async () => {
    const onDelete = vi.fn();
    render(
      <BulkActionsToolbar selectedCount={2} onClearSelection={vi.fn()} onDelete={onDelete} />
    );

    const deleteButton = screen.getByRole('button', { name: /sil/i });
    fireEvent.click(deleteButton);

    await waitFor(() => {
      const confirmButton = screen.getByRole('button', { name: /sil/i });
      fireEvent.click(confirmButton);
    });

    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it('shows status options when provided', () => {
    const statusOptions = [
      { value: 'pending', label: 'Beklemede' },
      { value: 'completed', label: 'Tamamlandı' },
    ];

    render(
      <BulkActionsToolbar
        selectedCount={3}
        onClearSelection={vi.fn()}
        onStatusChange={vi.fn()}
        statusOptions={statusOptions}
      />
    );

    expect(screen.getByText(/durum/i)).toBeInTheDocument();
  });

  it('shows loading state', () => {
    render(
      <BulkActionsToolbar
        selectedCount={2}
        onClearSelection={vi.fn()}
        isLoading={true}
      />
    );

    const buttons = screen.getAllByRole('button');
    buttons.forEach((button) => {
      expect(button).toBeDisabled();
    });
  });
});

