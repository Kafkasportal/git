import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StudentForm } from '@/components/forms/StudentForm';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock the API
vi.mock('@/lib/api/client', () => ({
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

// Mock scrollIntoView for Radix UI Select
const mockScrollIntoView = vi.fn();
const originalScrollIntoView = Element.prototype.scrollIntoView;

beforeEach(() => {
  Element.prototype.scrollIntoView = mockScrollIntoView;
});

afterEach(() => {
  vi.clearAllMocks();
  // Restore original scrollIntoView to prevent test pollution
  if (originalScrollIntoView !== undefined) {
    Element.prototype.scrollIntoView = originalScrollIntoView;
  } else {
    // If it didn't exist originally, delete it
    delete (Element.prototype as any).scrollIntoView;
  }
});

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
    const user = userEvent.setup();

    // Use initialData to bypass dropdown selection issues in test environment
    renderForm({
      onSubmit,
      initialData: {
        applicant_name: 'Test Student',
        applicant_tc_no: '10000000146',
        applicant_phone: '05551234567',
        university: 'Test University',
        department: 'Computer Science',
        grade_level: '2',
        scholarship_id: '1',
        is_orphan: false,
        has_disability: false,
      },
    });

    // Wait for scholarships to load and form to be populated
    await waitFor(() => {
      expect(screen.getByDisplayValue('Test Student')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Test University')).toBeInTheDocument();
    });

    // Verify all fields are filled
    expect(screen.getByDisplayValue('Test Student')).toBeInTheDocument();
    expect(screen.getByDisplayValue('10000000146')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test University')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Computer Science')).toBeInTheDocument();

    const submitButton = screen.getByRole('button', { name: /Kaydet/i });
    await user.click(submitButton);

    await waitFor(
      () => {
        expect(onSubmit).toHaveBeenCalled();
      },
      { timeout: 3000 }
    );
  });

  it('displays loading state when isLoading is true', () => {
    renderForm({ isLoading: true });

    const submitButton = screen.getByRole('button', { name: /Kaydet/i });
    expect(submitButton).toBeDisabled();
  });

  it('populates form with initial data', async () => {
    const initialData = {
      applicant_name: 'John Doe',
      applicant_tc_no: '10000000146',
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
      expect(screen.getByDisplayValue('10000000146')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Test University')).toBeInTheDocument();
    });
  });
});
