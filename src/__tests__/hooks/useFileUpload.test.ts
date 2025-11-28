/**
 * useFileUpload Tests
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useFileUpload } from "@/components/kumbara/hooks/useFileUpload";

interface TestFormData {
  document: string | undefined;
}

describe("useFileUpload", () => {
  const mockSetValue = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should initialize with null file and empty filename", () => {
    const { result } = renderHook(() =>
      useFileUpload<TestFormData>({
        setValue: mockSetValue,
        fieldName: "document",
      }),
    );

    expect(result.current.uploadedFile).toBeNull();
    expect(result.current.uploadedFileName).toBe("");
  });

  it("should have handleFileSelect and resetFile functions", () => {
    const { result } = renderHook(() =>
      useFileUpload<TestFormData>({
        setValue: mockSetValue,
        fieldName: "document",
      }),
    );

    expect(typeof result.current.handleFileSelect).toBe("function");
    expect(typeof result.current.resetFile).toBe("function");
  });

  it("should update file state when handleFileSelect is called with a file", () => {
    const { result } = renderHook(() =>
      useFileUpload<TestFormData>({
        setValue: mockSetValue,
        fieldName: "document",
      }),
    );

    const mockFile = new File(["test content"], "test.pdf", {
      type: "application/pdf",
    });

    act(() => {
      result.current.handleFileSelect(mockFile);
    });

    expect(result.current.uploadedFile).toBe(mockFile);
    expect(result.current.uploadedFileName).toBe("test.pdf");
    expect(mockSetValue).toHaveBeenCalledWith("document", "test.pdf", {
      shouldValidate: true,
    });
  });

  it("should use sanitized filename when provided", () => {
    const { result } = renderHook(() =>
      useFileUpload<TestFormData>({
        setValue: mockSetValue,
        fieldName: "document",
      }),
    );

    const mockFile = new File(["test content"], "test file (1).pdf", {
      type: "application/pdf",
    });

    act(() => {
      result.current.handleFileSelect(mockFile, "test-file-1.pdf");
    });

    expect(result.current.uploadedFileName).toBe("test-file-1.pdf");
    expect(mockSetValue).toHaveBeenCalledWith("document", "test-file-1.pdf", {
      shouldValidate: true,
    });
  });

  it("should clear file state when handleFileSelect is called with null", () => {
    const { result } = renderHook(() =>
      useFileUpload<TestFormData>({
        setValue: mockSetValue,
        fieldName: "document",
      }),
    );

    const mockFile = new File(["test content"], "test.pdf", {
      type: "application/pdf",
    });

    // First set a file
    act(() => {
      result.current.handleFileSelect(mockFile);
    });

    expect(result.current.uploadedFile).toBe(mockFile);

    // Then clear it
    act(() => {
      result.current.handleFileSelect(null);
    });

    expect(result.current.uploadedFile).toBeNull();
    expect(result.current.uploadedFileName).toBe("");
    expect(mockSetValue).toHaveBeenLastCalledWith("document", undefined, {
      shouldValidate: false,
    });
  });

  it("should reset file state when resetFile is called", () => {
    const { result } = renderHook(() =>
      useFileUpload<TestFormData>({
        setValue: mockSetValue,
        fieldName: "document",
      }),
    );

    const mockFile = new File(["test content"], "test.pdf", {
      type: "application/pdf",
    });

    // First set a file
    act(() => {
      result.current.handleFileSelect(mockFile);
    });

    // Then reset
    act(() => {
      result.current.resetFile();
    });

    expect(result.current.uploadedFile).toBeNull();
    expect(result.current.uploadedFileName).toBe("");
    expect(mockSetValue).toHaveBeenLastCalledWith("document", undefined, {
      shouldValidate: false,
    });
  });
});
