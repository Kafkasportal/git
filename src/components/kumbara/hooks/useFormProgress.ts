/**
 * Form completion progress tracking hook
 * Extracted from KumbaraForm for reusability
 */

import { useMemo } from 'react';
import { useWatch, type Control, type FieldValues } from 'react-hook-form';

interface UseFormProgressOptions<T extends FieldValues> {
  control: Control<T>;
  requiredFieldNames: readonly (keyof T)[];
}

export function useFormProgress<T extends FieldValues>({
  control,
  requiredFieldNames,
}: UseFormProgressOptions<T>) {
  const watchedFields = useWatch({
    control,
    name: requiredFieldNames as any,
  });

  const progress = useMemo(() => {
    const fieldValues = Array.isArray(watchedFields) ? watchedFields : [watchedFields] as unknown[];

    const completedFields = (fieldValues as unknown[]).filter((value: unknown) => {
      return value !== undefined && value !== null && value !== '';
    });

    return Math.round((completedFields.length / requiredFieldNames.length) * 100);
  }, [watchedFields, requiredFieldNames]);

  return progress;
}
