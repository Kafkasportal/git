/**
 * Standard Form Hook
 * Simplified version that works with existing form patterns
 * Eliminates duplicate form logic across the application
 */

import { useForm, UseFormReturn, FieldValues } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { ZodType } from 'zod';
import { useFormMutation } from './useFormMutation';

export interface UseStandardFormOptions<TFormData extends FieldValues, TResponse> {
  /**
   * Zod schema for form validation
   */
  schema: ZodType<TFormData>;
  /**
   * Mutation function
   */
  mutationFn: (variables: TFormData) => Promise<TResponse>;
  /**
   * Query key for invalidation after success
   */
  queryKey: string | string[];
  /**
   * Success message to show
   */
  successMessage?: string;
  /**
   * Error message prefix
   */
  errorMessage?: string;
  /**
   * Default form values
   */
  defaultValues?: Partial<TFormData>;
  /**
   * Callback after successful mutation
   */
  onSuccess?: (data: TResponse) => void;
  /**
   * Callback on error
   */
  onError?: (error: unknown) => void;
  /**
   * Transform data before mutation
   */
  transformData?: (data: TFormData) => TFormData | Promise<TFormData>;
  /**
   * Reset form after success
   */
  resetOnSuccess?: boolean;
  /**
   * Show success toast (default: true)
   */
  showSuccessToast?: boolean;
  /**
   * Show error toast (default: true)
   */
  showErrorToast?: boolean;
  /**
   * Collection name for offline sync routing (required for offline support)
   */
  collection?: string;
}

export interface UseStandardFormReturn<TFormData extends FieldValues, TResponse> {
  /**
   * React Hook Form instance
   */
  form: UseFormReturn<TFormData>;
  /**
   * Form submission handler
   */
  handleSubmit: (e?: React.BaseSyntheticEvent) => Promise<void>;
  /**
   * Is form currently submitting
   */
  isSubmitting: boolean;
  /**
   * Has form been modified
   */
  isDirty: boolean;
  /**
   * Is form valid
   */
  isValid: boolean;
  /**
   * Was mutation successful
   */
  isSuccess: boolean;
  /**
   * Did mutation have error
   */
  isError: boolean;
  /**
   * Error from mutation
   */
  error: unknown;
  /**
   * Response data from mutation
   */
  data: TResponse | undefined;
  /**
   * Reset form to initial state
   */
  reset: () => void;
}

/**
 * Standard form hook with built-in validation, mutation, and error handling
 * Combines React Hook Form with React Query mutations
 */
export function useStandardForm<TFormData extends FieldValues, TResponse = unknown>(
  options: UseStandardFormOptions<TFormData, TResponse>
): UseStandardFormReturn<TFormData, TResponse> {
  const {
    schema,
    mutationFn,
    queryKey,
    successMessage = 'İşlem başarılı',
    errorMessage = 'İşlem başarısız',
    defaultValues,
    onSuccess,
    onError: _onError,
    transformData,
    resetOnSuccess = true,
    showSuccessToast = true,
    showErrorToast = true,
    collection,
  } = options;

  // Initialize form with schema validation
  const form = useForm<TFormData>({
    // @ts-expect-error - Zod v4 type incompatibility with hookform resolver
    resolver: zodResolver(schema),
    defaultValues: defaultValues as any,
    mode: 'onBlur',
  });

  // Handle mutation with form data transformation
  const handleMutationFn = async (data: TFormData): Promise<TResponse> => {
    const transformedData = transformData ? await transformData(data) : data;
    return mutationFn(transformedData);
  };

  // Create mutation hook
  const mutation = useFormMutation<TResponse, TFormData>({
    mutationFn: handleMutationFn,
    queryKey,
    successMessage,
    errorMessage,
    collection: collection || 'unknown',
    showSuccessToast,
    showErrorToast,
    onSuccess: () => {
      if (resetOnSuccess) {
        form.reset();
      }
      onSuccess?.(mutation.data as TResponse);
    },
  });

  // Create form submission handler
  const handleSubmit = form.handleSubmit(async (data) => {
    // @ts-expect-error - Generic type constraint issue with FieldValues
    await mutation.mutate(data);
  });

  return {
    form: form as any,
    handleSubmit,
    isSubmitting: form.formState.isSubmitting || mutation.isPending,
    isDirty: form.formState.isDirty,
    isValid: form.formState.isValid,
    isSuccess: mutation.isSuccess,
    isError: mutation.isError,
    error: mutation.error,
    data: mutation.data,
    reset: () => form.reset(),
  };
}

// ============================================================================
// SPECIALIZED HOOKS
// ============================================================================

interface CreateFormOptions<TFormData extends FieldValues, TResponse = unknown>
  extends Omit<
    UseStandardFormOptions<TFormData, TResponse>,
    'queryKey' | 'successMessage' | 'errorMessage'
  > {
  entityName: string;
  queryKey: string | string[];
}

/**
 * Hook for creating new entities
 * Pre-configured with appropriate messages
 */
export function useCreateForm<TFormData extends FieldValues, TResponse = unknown>(
  options: CreateFormOptions<TFormData, TResponse>
): UseStandardFormReturn<TFormData, TResponse> {
  return useStandardForm({
    ...options,
    successMessage: `${options.entityName} başarıyla oluşturuldu`,
    errorMessage: `${options.entityName} oluşturulurken hata`,
    resetOnSuccess: true,
  });
}

interface UpdateFormOptions<TFormData extends FieldValues, TResponse = unknown>
  extends Omit<
    UseStandardFormOptions<TFormData, TResponse>,
    'queryKey' | 'successMessage' | 'errorMessage'
  > {
  entityName: string;
  queryKey: string | string[];
}

/**
 * Hook for updating existing entities
 * Pre-configured with appropriate messages
 */
export function useUpdateForm<TFormData extends FieldValues, TResponse = unknown>(
  options: UpdateFormOptions<TFormData, TResponse>
): UseStandardFormReturn<TFormData, TResponse> {
  return useStandardForm({
    ...options,
    successMessage: `${options.entityName} başarıyla güncellendi`,
    errorMessage: `${options.entityName} güncellenirken hata`,
    resetOnSuccess: false,
  });
}

interface DeleteFormOptions<TResponse = unknown> {
  mutationFn: () => Promise<TResponse>;
  queryKey: string | string[];
  entityName: string;
  collection?: string;
  onSuccess?: (data: TResponse) => void;
}

/**
 * Hook for delete confirmations
 * Pre-configured for delete operations
 */
export function useDeleteForm<TResponse = unknown>(
  options: DeleteFormOptions<TResponse>
): ReturnType<typeof useFormMutation<TResponse, void>> {
  const { mutationFn, queryKey, entityName, collection, onSuccess } = options;

  return useFormMutation<TResponse, void>({
    mutationFn,
    queryKey,
    collection: collection || 'unknown',
    mutationType: 'delete',
    successMessage: `${entityName} başarıyla silindi`,
    errorMessage: `${entityName} silinirken hata`,
    onSuccess: () => {
      onSuccess?.(undefined as unknown as TResponse);
    },
  });
}
