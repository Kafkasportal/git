import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EditTransactionDialog } from '@/app/(dashboard)/fon/gelir-gider/_components/EditTransactionDialog';

const mockRecord = {
    _id: '1',
    record_type: 'income' as const,
    category: 'Donations',
    amount: 1000,
    currency: 'TRY' as const,
    description: 'Test donation',
    transaction_date: '2024-01-01',
    payment_method: 'cash',
    receipt_number: 'RCP-001',
    status: 'pending' as const,
    created_by: 'user1',
    _creationTime: '2024-01-01T00:00:00Z',
};

describe('EditTransactionDialog', () => {
    it('renders dialog when open', () => {
        render(
            <EditTransactionDialog
                open={true}
                onOpenChange={vi.fn()}
                record={mockRecord}
                onSave={vi.fn()}
            />
        );

        expect(screen.getByText(/İşlemi Düzenle/i)).toBeInTheDocument();
    });

    it('does not render when closed', () => {
        render(
            <EditTransactionDialog
                open={false}
                onOpenChange={vi.fn()}
                record={mockRecord}
                onSave={vi.fn()}
            />
        );

        expect(screen.queryByText(/İşlemi Düzenle/i)).not.toBeInTheDocument();
    });

    it('populates form with record data', () => {
        render(
            <EditTransactionDialog
                open={true}
                onOpenChange={vi.fn()}
                record={mockRecord}
                onSave={vi.fn()}
            />
        );

        expect(screen.getByDisplayValue('Test donation')).toBeInTheDocument();
        expect(screen.getByDisplayValue('1000')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Donations')).toBeInTheDocument();
    });

    it('calls onSave with updated data when form is submitted', async () => {
        const onSave = vi.fn().mockResolvedValue(undefined);
        render(
            <EditTransactionDialog
                open={true}
                onOpenChange={vi.fn()}
                record={mockRecord}
                onSave={onSave}
            />
        );

        const descriptionInput = screen.getByLabelText(/Açıklama/i);
        await userEvent.clear(descriptionInput);
        await userEvent.type(descriptionInput, 'Updated donation');

        const saveButton = screen.getByRole('button', { name: /Kaydet/i });
        await userEvent.click(saveButton);

        await waitFor(() => {
            expect(onSave).toHaveBeenCalledWith(
                expect.objectContaining({
                    description: 'Updated donation',
                })
            );
        });
    });

    it('calls onOpenChange when cancel button is clicked', async () => {
        const onOpenChange = vi.fn();
        render(
            <EditTransactionDialog
                open={true}
                onOpenChange={onOpenChange}
                record={mockRecord}
                onSave={vi.fn()}
            />
        );

        const cancelButton = screen.getByRole('button', { name: /İptal/i });
        await userEvent.click(cancelButton);

        expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it('disables save button when isLoading is true', () => {
        render(
            <EditTransactionDialog
                open={true}
                onOpenChange={vi.fn()}
                record={mockRecord}
                onSave={vi.fn()}
                isLoading={true}
            />
        );

        const saveButton = screen.getByRole('button', { name: /Kaydet/i });
        expect(saveButton).toBeDisabled();
    });
});
