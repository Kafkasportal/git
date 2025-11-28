import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StudentForm } from '@/components/forms/StudentForm';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock the API
vi.mock('@/lib/api', () => ({
    scholarshipsApi: {
        list: vi.fn().mockResolvedValue({
            success: true,
            data: [
                { $id: '1', title: 'Test Scholarship 1', is_active: true },
                { $id: '2', title: 'Test Scholarship 2', is_active: true },
            ],
        }),
    },
}));

// Mock toast
vi.mock('sonner', () => ({
    toast: {
        error: vi.fn(),
        success: vi.fn(),
    },
}));

describe('StudentForm', () => {
    let queryClient: QueryClient;

    beforeEach(() => {
        queryClient = new QueryClient({
            defaultOptions: {
                queries: { retry: false },
            },
        });
    });

    const renderForm = (props = {}) => {
        const defaultProps = {
            onSubmit: vi.fn(),
            isLoading: false,
            ...props,
        };

        return render(
            <QueryClientProvider client={queryClient}>
                <StudentForm {...defaultProps} />
            </QueryClientProvider>
        );
    };

    it('renders all required form fields', async () => {
        renderForm();

        await waitFor(() => {
            expect(screen.getByLabelText(/Ad Soyad/i)).toBeInTheDocument();
            expect(screen.getByLabelText(/TC Kimlik No/i)).toBeInTheDocument();
            expect(screen.getByLabelText(/Telefon/i)).toBeInTheDocument();
            expect(screen.getByLabelText(/Üniversite/i)).toBeInTheDocument();
            expect(screen.getByLabelText(/Bölüm/i)).toBeInTheDocument();
        });
    });

    it('validates required fields on submit', async () => {
        const onSubmit = vi.fn();
        renderForm({ onSubmit });

        const submitButton = screen.getByRole('button', { name: /Kaydet/i });
        await userEvent.click(submitButton);

        // Form should not submit without required fields
        expect(onSubmit).not.toHaveBeenCalled();
    });

    it('submits form with valid data', async () => {
        const onSubmit = vi.fn().mockResolvedValue(undefined);
        renderForm({ onSubmit });

        // Wait for scholarships to load
        await waitFor(() => {
            expect(screen.getByLabelText(/Başvurulan Burs Programı/i)).toBeInTheDocument();
        });

        // Fill in required fields
        await userEvent.type(screen.getByLabelText(/Ad Soyad/i), 'Test Student');
        await userEvent.type(screen.getByLabelText(/TC Kimlik No/i), '12345678901');
        await userEvent.type(screen.getByLabelText(/Telefon/i), '05551234567');
        await userEvent.type(screen.getByLabelText(/Üniversite/i), 'Test University');
        await userEvent.type(screen.getByLabelText(/Bölüm/i), 'Computer Science');

        // Select grade level
        const gradeSelect = screen.getByRole('combobox', { name: /Sınıf/i });
        await userEvent.click(gradeSelect);
        const gradeOption = await screen.findByText('2. Sınıf');
        await userEvent.click(gradeOption);

        // Select scholarship
        const scholarshipSelect = screen.getByRole('combobox', { name: /Başvurulan Burs Programı/i });
        await userEvent.click(scholarshipSelect);
        const scholarshipOption = await screen.findByText('Test Scholarship 1');
        await userEvent.click(scholarshipOption);

        const submitButton = screen.getByRole('button', { name: /Kaydet/i });
        await userEvent.click(submitButton);

        await waitFor(() => {
            expect(onSubmit).toHaveBeenCalled();
        }, { timeout: 3000 });
    });

    it('displays loading state when isLoading is true', () => {
        renderForm({ isLoading: true });

        const submitButton = screen.getByRole('button', { name: /Kaydet/i });
        expect(submitButton).toBeDisabled();
    });

    it('populates form with initial data', async () => {
        const initialData = {
            applicant_name: 'John Doe',
            applicant_tc_no: '12345678901',
            applicant_phone: '05551234567',
            university: 'Test University',
            department: 'Computer Science',
            grade_level: '2',
            scholarship_id: '1',
            is_orphan: false,
            has_disability: false,
        };

        renderForm({ initialData });

        await waitFor(() => {
            expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
            expect(screen.getByDisplayValue('12345678901')).toBeInTheDocument();
            expect(screen.getByDisplayValue('Test University')).toBeInTheDocument();
        });
    });
});
