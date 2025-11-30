/**
 * Tests for DonorInfoSection component
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';
import { useForm, FormProvider, UseFormReturn } from 'react-hook-form';
import { DonorInfoSection } from '@/components/kumbara/sections/DonorInfoSection';
import type { KumbaraCreateInput } from '@/lib/validations/kumbara';

// Wrapper component to properly use React hooks
function TestWrapper({
  children,
}: {
  children: (methods: UseFormReturn<KumbaraCreateInput>) => React.ReactNode;
}) {
  const methods = useForm<KumbaraCreateInput>({
    defaultValues: {
      donor_name: '',
      donor_phone: '',
      donor_email: '',
      receipt_number: '',
      amount: 0,
      currency: 'TRY',
      donation_type: 'Kumbara',
      donation_purpose: 'Kumbara Bağışı',
      payment_method: 'Nakit',
      kumbara_location: '',
      kumbara_institution: '',
      collection_date: new Date().toISOString().split('T')[0],
      status: 'pending',
      is_kumbara: true,
      notes: '',
    },
  });

  return <FormProvider {...methods}>{children(methods)}</FormProvider>;
}

describe('DonorInfoSection', () => {
  const renderWithForm = () => {
    let methods: UseFormReturn<KumbaraCreateInput> | null = null;

    const result = render(
      <TestWrapper>
        {(m) => {
          methods = m;
          return <DonorInfoSection control={m.control} />;
        }}
      </TestWrapper>
    );

    return { ...result, methods: methods! };
  };

  it('should render the section title', () => {
    renderWithForm();
    expect(screen.getByText('Bağışçı Bilgileri')).toBeInTheDocument();
  });

  it('should render all required form fields', () => {
    renderWithForm();

    expect(screen.getByLabelText(/Bağışçı Adı/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Telefon/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/E-posta/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Makbuz No/i)).toBeInTheDocument();
  });

  it('should show required asterisk for mandatory fields', () => {
    renderWithForm();

    const donorNameLabel = screen.getByText(/Bağışçı Adı/i).closest('label');
    expect(donorNameLabel).toHaveTextContent('*');

    const phoneLabel = screen.getByText(/Telefon/i).closest('label');
    expect(phoneLabel).toHaveTextContent('*');

    const receiptLabel = screen.getByText(/Makbuz No/i).closest('label');
    expect(receiptLabel).toHaveTextContent('*');
  });

  it('should not show required asterisk for optional email field', () => {
    renderWithForm();

    const emailLabel = screen.getByText(/E-posta/i).closest('label');
    expect(emailLabel?.textContent).not.toContain('*');
  });

  it('should allow typing in donor name field', async () => {
    const user = userEvent.setup();
    renderWithForm();

    const input = screen.getByPlaceholderText('Ahmet Yılmaz');
    await user.type(input, 'Test Donor');

    expect(input).toHaveValue('Test Donor');
  });

  it('should allow typing in email field', async () => {
    const user = userEvent.setup();
    renderWithForm();

    const input = screen.getByPlaceholderText('ornek@email.com');
    await user.type(input, 'test@example.com');

    expect(input).toHaveValue('test@example.com');
  });

  it('should allow typing in receipt number field', async () => {
    const user = userEvent.setup();
    renderWithForm();

    const input = screen.getByPlaceholderText('KB-2024-001');
    await user.type(input, 'KB-2025-999');

    expect(input).toHaveValue('KB-2025-999');
  });

  it('should only allow numeric input in phone field', async () => {
    const user = userEvent.setup();
    const { methods } = renderWithForm();

    const input = screen.getByPlaceholderText('5XX XXX XX XX');
    await user.type(input, 'abc123def456');

    // Should filter out letters and only keep numbers
    const phoneValue = methods.getValues('donor_phone');
    expect(phoneValue).toBe('123456');
  });

  it('should limit phone field to 11 characters', async () => {
    const user = userEvent.setup();
    renderWithForm();

    const input = screen.getByPlaceholderText('5XX XXX XX XX') as HTMLInputElement;
    await user.type(input, '123456789012345'); // More than 11 digits

    expect(input.maxLength).toBe(11);
  });

  it('should have correct placeholders', () => {
    renderWithForm();

    expect(screen.getByPlaceholderText('Ahmet Yılmaz')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('5XX XXX XX XX')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('ornek@email.com')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('KB-2024-001')).toBeInTheDocument();
  });

  it('should render in a grid layout with proper styling', () => {
    const { container } = renderWithForm();

    const gridContainer = container.querySelector('.grid.grid-cols-2');
    expect(gridContainer).toBeInTheDocument();
  });

  it('should have user icon emoji in section header', () => {
    renderWithForm();
    expect(screen.getByText('👤')).toBeInTheDocument();
  });
});
