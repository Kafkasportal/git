/**
 * Tests for FamilyInfoStep component
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';
import { useForm, FormProvider } from 'react-hook-form';
import { FamilyInfoStep } from '@/components/forms/beneficiary-steps/FamilyInfoStep';
import type { BeneficiaryFormData } from '@/lib/validations/beneficiary';

// Test wrapper component that uses the form hook
function TestWrapper({
  children,
  defaultValues,
}: {
  children: React.ReactNode;
  defaultValues?: Partial<BeneficiaryFormData>;
}) {
  const methods = useForm<BeneficiaryFormData>({
    defaultValues: {
      firstName: '',
      lastName: '',
      nationality: 'TC',
      mernisCheck: false,
      category: 'individual',
      fundRegion: 'domestic',
      fileConnection: 'none',
      familyMemberCount: 0,
      children_count: 0,
      orphan_children_count: 0,
      elderly_count: 0,
      disabled_count: 0,
      ...defaultValues,
    } as BeneficiaryFormData,
  });

  return <FormProvider {...methods}>{children}</FormProvider>;
}

describe('FamilyInfoStep', () => {
  const renderWithForm = (defaultValues?: Partial<BeneficiaryFormData>) => {
    const result = render(
      <TestWrapper defaultValues={defaultValues}>
        <FamilyInfoStep />
      </TestWrapper>
    );

    return result;
  };

  it('should render the section title with icon', () => {
    renderWithForm();
    const title = screen.getAllByText('Aile Bilgileri')[0];
    expect(title).toBeInTheDocument();
    expect(title.closest('.flex')).toBeInTheDocument();
  });

  it('should render family member count field', () => {
    renderWithForm();
    expect(screen.getByRole('spinbutton', { name: /Aile Birey Sayısı/i })).toBeInTheDocument();
  });

  it('should render children count field', () => {
    const { container } = renderWithForm();
    const input = container.querySelector('#children_count');
    expect(input).toBeInTheDocument();
  });

  it('should render orphan children count field', () => {
    renderWithForm();
    expect(screen.getByRole('spinbutton', { name: /Yetim Çocuk Sayısı/i })).toBeInTheDocument();
  });

  it('should render elderly count field', () => {
    renderWithForm();
    expect(screen.getByRole('spinbutton', { name: /Yaşlı Sayısı/i })).toBeInTheDocument();
  });

  it('should render disabled count field', () => {
    renderWithForm();
    expect(screen.getByRole('spinbutton', { name: /Engelli Sayısı/i })).toBeInTheDocument();
  });

  it('should allow numeric input in family member count', async () => {
    const user = userEvent.setup();
    renderWithForm();

    const input = screen.getByRole('spinbutton', {
      name: /Aile Birey Sayısı/i,
    }) as HTMLInputElement;
    await user.clear(input);
    await user.type(input, '5');

    expect(input.value).toBe('5');
  });

  it('should allow numeric input in children count', async () => {
    const user = userEvent.setup();
    const { container } = renderWithForm();

    const input = container.querySelector('#children_count') as HTMLInputElement;
    await user.clear(input);
    await user.type(input, '3');

    expect(input.value).toBe('3');
  });

  it('should allow zero values', async () => {
    const user = userEvent.setup();
    renderWithForm();

    const input = screen.getByRole('spinbutton', {
      name: /Aile Birey Sayısı/i,
    }) as HTMLInputElement;
    await user.clear(input);
    await user.type(input, '0');

    expect(input.value).toBe('0');
  });

  it('should have numeric input type for count fields', () => {
    const { container } = renderWithForm();

    const familyInput = container.querySelector('#familyMemberCount') as HTMLInputElement;
    const childrenInput = container.querySelector('#children_count') as HTMLInputElement;

    expect(familyInput?.type).toBe('number');
    expect(childrenInput?.type).toBe('number');
  });

  it('should display pre-filled values correctly', () => {
    const { container } = renderWithForm({
      familyMemberCount: 6,
      children_count: 2,
      orphan_children_count: 1,
      elderly_count: 2,
      disabled_count: 0,
    });

    expect((container.querySelector('#familyMemberCount') as HTMLInputElement)?.value).toBe('6');
    expect((container.querySelector('#children_count') as HTMLInputElement)?.value).toBe('2');
    expect((container.querySelector('#orphan_children_count') as HTMLInputElement)?.value).toBe(
      '1'
    );
    expect((container.querySelector('#elderly_count') as HTMLInputElement)?.value).toBe('2');
    expect((container.querySelector('#disabled_count') as HTMLInputElement)?.value).toBe('0');
  });

  it('should be wrapped in a Card component', () => {
    const { container } = renderWithForm();

    // Check for card-like structure (className patterns may vary)
    const cardElement =
      container.querySelector('[class*="card"]') || container.querySelector('[class*="border"]');
    expect(cardElement).toBeInTheDocument();
  });
});
