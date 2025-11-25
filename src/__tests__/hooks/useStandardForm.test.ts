/**
 * Tests for useStandardForm hook
 * Covers form validation, mutation, and error handling
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useStandardForm } from '@/hooks/useStandardForm';
import { z } from 'zod';
import { createElement, type ReactNode } from 'react';

// Test schema
const testSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
  age: z.number().min(18, 'Must be 18+'),
});

type TestFormData = z.infer<typeof testSchema>;

// Create wrapper with QueryClient
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  const Wrapper = ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children);
  Wrapper.displayName = 'QueryClientWrapper';
  return Wrapper;
}

describe('useStandardForm', () => {
  const mockMutationFn = vi.fn();
  const mockOnSuccess = vi.fn();

  beforeEach(() => {
    mockMutationFn.mockClear();
    mockOnSuccess.mockClear();
    vi.clearAllMocks();
  });

  it('initializes form with provided default values', () => {
    const defaultValues = {
      name: 'John',
      email: 'john@example.com',
      age: 25,
    };

    const { result } = renderHook(
      () =>
        useStandardForm<TestFormData, string>({
          schema: testSchema,
          mutationFn: mockMutationFn,
          queryKey: ['test'],
          defaultValues,
        }),
      { wrapper: createWrapper() }
    );

    expect(result.current.form.getValues()).toEqual(defaultValues);
  });

  it('returns correct form state properties', () => {
    const { result } = renderHook(
      () =>
        useStandardForm<TestFormData, string>({
          schema: testSchema,
          mutationFn: mockMutationFn,
          queryKey: ['test'],
        }),
      { wrapper: createWrapper() }
    );

    expect(result.current).toHaveProperty('form');
    expect(result.current).toHaveProperty('handleSubmit');
    expect(result.current).toHaveProperty('isSubmitting');
    expect(result.current).toHaveProperty('isDirty');
    expect(result.current).toHaveProperty('isValid');
    expect(result.current).toHaveProperty('isSuccess');
    expect(result.current).toHaveProperty('isError');
    expect(result.current).toHaveProperty('reset');
  });

  it('validates form data according to schema', async () => {
    const { result } = renderHook(
      () =>
        useStandardForm<TestFormData, string>({
          schema: testSchema,
          mutationFn: mockMutationFn,
          queryKey: ['test'],
        }),
      { wrapper: createWrapper() }
    );

    // Set invalid email
    await act(async () => {
      result.current.form.setValue('email', 'invalid-email');
      await result.current.form.trigger('email');
    });

    expect(result.current.form.formState.errors.email).toBeDefined();
  });

  it('clears errors when valid data is entered', async () => {
    const { result } = renderHook(
      () =>
        useStandardForm<TestFormData, string>({
          schema: testSchema,
          mutationFn: mockMutationFn,
          queryKey: ['test'],
        }),
      { wrapper: createWrapper() }
    );

    // Set invalid then valid email
    await act(async () => {
      result.current.form.setValue('email', 'invalid-email');
      await result.current.form.trigger('email');
    });

    expect(result.current.form.formState.errors.email).toBeDefined();

    await act(async () => {
      result.current.form.setValue('email', 'valid@example.com');
      await result.current.form.trigger('email');
    });

    expect(result.current.form.formState.errors.email).toBeUndefined();
  });

  it('calls mutation function with form data on submit', async () => {
    mockMutationFn.mockResolvedValue('success');

    const { result } = renderHook(
      () =>
        useStandardForm<TestFormData, string>({
          schema: testSchema,
          mutationFn: mockMutationFn,
          queryKey: ['test'],
          defaultValues: {
            name: 'John',
            email: 'john@example.com',
            age: 25,
          },
        }),
      { wrapper: createWrapper() }
    );

    await act(async () => {
      await result.current.handleSubmit();
    });

    await waitFor(() => {
      expect(mockMutationFn).toHaveBeenCalledWith({
        name: 'John',
        email: 'john@example.com',
        age: 25,
      });
    });
  });

  it('resets form on successful submission when resetOnSuccess is true', async () => {
    mockMutationFn.mockResolvedValue('success');

    const { result } = renderHook(
      () =>
        useStandardForm<TestFormData, string>({
          schema: testSchema,
          mutationFn: mockMutationFn,
          queryKey: ['test'],
          defaultValues: {
            name: 'John',
            email: 'john@example.com',
            age: 25,
          },
          resetOnSuccess: true,
        }),
      { wrapper: createWrapper() }
    );

    // Modify form
    await act(async () => {
      result.current.form.setValue('name', 'Jane');
    });

    expect(result.current.isDirty).toBe(true);

    // Submit form
    await act(async () => {
      await result.current.handleSubmit();
    });

    await waitFor(() => {
      expect(result.current.isDirty).toBe(false);
    });
  });

  it('does not reset form when resetOnSuccess is false', async () => {
    mockMutationFn.mockResolvedValue('success');

    const { result } = renderHook(
      () =>
        useStandardForm<TestFormData, string>({
          schema: testSchema,
          mutationFn: mockMutationFn,
          queryKey: ['test'],
          defaultValues: {
            name: 'John',
            email: 'john@example.com',
            age: 25,
          },
          resetOnSuccess: false,
        }),
      { wrapper: createWrapper() }
    );

    // Modify form
    await act(async () => {
      result.current.form.setValue('name', 'Jane');
    });

    const modifiedValue = result.current.form.getValues('name');

    // Submit form
    await act(async () => {
      await result.current.handleSubmit();
    });

    await waitFor(() => {
      expect(result.current.form.getValues('name')).toBe(modifiedValue);
    });
  });

  it('calls onSuccess callback with response data', async () => {
    const responseData = 'success-response';
    mockMutationFn.mockResolvedValue(responseData);

    const { result } = renderHook(
      () =>
        useStandardForm<TestFormData, string>({
          schema: testSchema,
          mutationFn: mockMutationFn,
          queryKey: ['test'],
          onSuccess: mockOnSuccess,
          defaultValues: {
            name: 'John',
            email: 'john@example.com',
            age: 25,
          },
        }),
      { wrapper: createWrapper() }
    );

    await act(async () => {
      await result.current.handleSubmit();
    });

    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });

  it('transforms data before mutation if transformData is provided', async () => {
    mockMutationFn.mockResolvedValue('success');
    const transformFn = vi.fn((data: TestFormData) => ({
      ...data,
      name: data.name.toUpperCase(),
    }));

    const { result } = renderHook(
      () =>
        useStandardForm<TestFormData, string>({
          schema: testSchema,
          mutationFn: mockMutationFn,
          queryKey: ['test'],
          transformData: transformFn,
          defaultValues: {
            name: 'john',
            email: 'john@example.com',
            age: 25,
          },
        }),
      { wrapper: createWrapper() }
    );

    await act(async () => {
      await result.current.handleSubmit();
    });

    await waitFor(() => {
      expect(transformFn).toHaveBeenCalled();
      expect(mockMutationFn).toHaveBeenCalledWith({
        name: 'JOHN',
        email: 'john@example.com',
        age: 25,
      });
    });
  });

  it('manually resets form via reset() function', async () => {
    const { result } = renderHook(
      () =>
        useStandardForm<TestFormData, string>({
          schema: testSchema,
          mutationFn: mockMutationFn,
          queryKey: ['test'],
          defaultValues: {
            name: 'John',
            email: 'john@example.com',
            age: 25,
          },
        }),
      { wrapper: createWrapper() }
    );

    await act(async () => {
      result.current.form.setValue('name', 'Jane');
    });

    expect(result.current.form.getValues('name')).toBe('Jane');

    await act(async () => {
      result.current.reset();
    });

    expect(result.current.form.getValues('name')).toBe('John');
  });
});
