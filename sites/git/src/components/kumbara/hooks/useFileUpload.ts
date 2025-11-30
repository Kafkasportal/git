/**
 * File upload management hook
 * Extracted from KumbaraForm for reusability
 */

import { useState, useCallback } from 'react';
import type { UseFormSetValue, FieldValues, Path } from 'react-hook-form';

interface UseFileUploadOptions<T extends FieldValues> {
  setValue: UseFormSetValue<T>;
  fieldName: Path<T>;
}

export function useFileUpload<T extends FieldValues>({
  setValue,
  fieldName,
}: UseFileUploadOptions<T>) {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string>('');

  const handleFileSelect = useCallback(
    (file: File | null, sanitizedFilename?: string) => {
      setUploadedFile(file);
      if (file) {
        const fileName = sanitizedFilename || file.name;
        setUploadedFileName(fileName);
        setValue(fieldName, fileName as any, { shouldValidate: true });
      } else {
        setUploadedFileName('');
        setValue(fieldName, undefined as any, { shouldValidate: false });
      }
    },
    [setValue, fieldName]
  );

  const resetFile = useCallback(() => {
    setUploadedFile(null);
    setUploadedFileName('');
    setValue(fieldName, undefined as any, { shouldValidate: false });
  }, [setValue, fieldName]);

  return {
    uploadedFile,
    uploadedFileName,
    handleFileSelect,
    resetFile,
  };
}
