/**
 * Tests for useFileUpload hook
 */

import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { useFileUpload } from '@/components/kumbara/hooks/useFileUpload';

describe('useFileUpload', () => {
  const createMockFile = (name: string, _size = 1024, type = 'image/png'): File => {
    return new File(['test'], name, { type, lastModified: Date.now() });
  };

  describe('initial state', () => {
    it('should initialize with no file', () => {
      const setValue = vi.fn();
      const { result } = renderHook(() =>
        useFileUpload({ setValue, fieldName: 'receipt_file_id' })
      );

      expect(result.current.uploadedFile).toBeNull();
      expect(result.current.uploadedFileName).toBe('');
    });
  });

  describe('handleFileSelect', () => {
    it('should update state when file is selected', () => {
      const setValue = vi.fn();
      const { result } = renderHook(() =>
        useFileUpload({ setValue, fieldName: 'receipt_file_id' })
      );

      const mockFile = createMockFile('test.png');

      act(() => {
        result.current.handleFileSelect(mockFile);
      });

      expect(result.current.uploadedFile).toBe(mockFile);
      expect(result.current.uploadedFileName).toBe('test.png');
      expect(setValue).toHaveBeenCalledWith('receipt_file_id', 'test.png', {
        shouldValidate: true,
      });
    });

    it('should use sanitized filename when provided', () => {
      const setValue = vi.fn();
      const { result } = renderHook(() =>
        useFileUpload({ setValue, fieldName: 'receipt_file_id' })
      );

      const mockFile = createMockFile('test.png');

      act(() => {
        result.current.handleFileSelect(mockFile, 'sanitized-filename.png');
      });

      expect(result.current.uploadedFile).toBe(mockFile);
      expect(result.current.uploadedFileName).toBe('sanitized-filename.png');
      expect(setValue).toHaveBeenCalledWith('receipt_file_id', 'sanitized-filename.png', {
        shouldValidate: true,
      });
    });

    it('should clear state when file is null', () => {
      const setValue = vi.fn();
      const { result } = renderHook(() =>
        useFileUpload({ setValue, fieldName: 'receipt_file_id' })
      );

      // First select a file
      const mockFile = createMockFile('test.png');
      act(() => {
        result.current.handleFileSelect(mockFile);
      });

      // Then clear it
      act(() => {
        result.current.handleFileSelect(null);
      });

      expect(result.current.uploadedFile).toBeNull();
      expect(result.current.uploadedFileName).toBe('');
      expect(setValue).toHaveBeenLastCalledWith('receipt_file_id', undefined, {
        shouldValidate: false,
      });
    });

    it('should handle different file types', () => {
      const setValue = vi.fn();
      const { result } = renderHook(() =>
        useFileUpload({ setValue, fieldName: 'receipt_file_id' })
      );

      const pdfFile = createMockFile('document.pdf', 2048, 'application/pdf');

      act(() => {
        result.current.handleFileSelect(pdfFile);
      });

      expect(result.current.uploadedFile).toBe(pdfFile);
      expect(result.current.uploadedFileName).toBe('document.pdf');
    });
  });

  describe('resetFile', () => {
    it('should clear all file state', () => {
      const setValue = vi.fn();
      const { result } = renderHook(() =>
        useFileUpload({ setValue, fieldName: 'receipt_file_id' })
      );

      // First select a file
      const mockFile = createMockFile('test.png');
      act(() => {
        result.current.handleFileSelect(mockFile);
      });

      // Then reset
      act(() => {
        result.current.resetFile();
      });

      expect(result.current.uploadedFile).toBeNull();
      expect(result.current.uploadedFileName).toBe('');
      expect(setValue).toHaveBeenLastCalledWith('receipt_file_id', undefined, {
        shouldValidate: false,
      });
    });

    it('should be safe to call multiple times', () => {
      const setValue = vi.fn();
      const { result } = renderHook(() =>
        useFileUpload({ setValue, fieldName: 'receipt_file_id' })
      );

      act(() => {
        result.current.resetFile();
        result.current.resetFile();
        result.current.resetFile();
      });

      expect(result.current.uploadedFile).toBeNull();
      expect(result.current.uploadedFileName).toBe('');
    });
  });

  describe('memoization', () => {
    it('should return stable function references with same dependencies', () => {
      const setValue = vi.fn();
      const { result, rerender } = renderHook(() =>
        useFileUpload({ setValue, fieldName: 'receipt_file_id' })
      );

      const firstHandleFileSelect = result.current.handleFileSelect;
      const firstResetFile = result.current.resetFile;

      rerender();

      expect(result.current.handleFileSelect).toBe(firstHandleFileSelect);
      expect(result.current.resetFile).toBe(firstResetFile);
    });

    it('should update function references when dependencies change', () => {
      const setValue1 = vi.fn();
      const setValue2 = vi.fn();

      const { result, rerender } = renderHook(
        ({ setValue, fieldName }) => useFileUpload({ setValue, fieldName }),
        {
          initialProps: { setValue: setValue1, fieldName: 'field1' as const },
        }
      );

      const firstHandleFileSelect = result.current.handleFileSelect;

      rerender({ setValue: setValue2, fieldName: 'field1' as const });

      expect(result.current.handleFileSelect).not.toBe(firstHandleFileSelect);
    });
  });

  describe('integration scenarios', () => {
    it('should handle file selection flow correctly', () => {
      const setValue = vi.fn();
      const { result } = renderHook(() =>
        useFileUpload({ setValue, fieldName: 'receipt_file_id' })
      );

      // Select first file
      const file1 = createMockFile('file1.png');
      act(() => {
        result.current.handleFileSelect(file1);
      });

      expect(result.current.uploadedFileName).toBe('file1.png');

      // Select second file (replace)
      const file2 = createMockFile('file2.pdf', 2048, 'application/pdf');
      act(() => {
        result.current.handleFileSelect(file2);
      });

      expect(result.current.uploadedFileName).toBe('file2.pdf');
      expect(result.current.uploadedFile).toBe(file2);

      // Reset
      act(() => {
        result.current.resetFile();
      });

      expect(result.current.uploadedFile).toBeNull();
    });
  });
});
