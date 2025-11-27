/**
 * useStandardForm Tests
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { z } from "zod";
import React from "react";

// Mock useFormMutation
vi.mock("@/hooks/useFormMutation", () => ({
  useFormMutation: vi.fn(() => ({
    mutate: vi.fn(),
    isPending: false,
    isSuccess: false,
    isError: false,
    error: null,
    data: undefined,
  })),
}));

// Import after mocking
import {
  useStandardForm,
  useCreateForm,
  useUpdateForm,
} from "@/hooks/useStandardForm";
import { useFormMutation } from "@/hooks/useFormMutation";

// Test schema
const testSchema = z.object({
  name: z.string().min(2, "İsim en az 2 karakter olmalı"),
  email: z.string().email("Geçerli email giriniz"),
});

type TestFormData = z.infer<typeof testSchema>;

// Create wrapper with QueryClient
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const Wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
  Wrapper.displayName = "QueryClientWrapper";
  return Wrapper;
};

describe("useStandardForm", () => {
  const mockMutationFn = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockMutationFn.mockResolvedValue({ success: true });
  });

  it("should initialize form with default values", () => {
    const { result } = renderHook(
      () =>
        useStandardForm<TestFormData>({
          schema: testSchema,
          mutationFn: mockMutationFn,
          queryKey: "test",
          defaultValues: { name: "Test", email: "test@example.com" },
        }),
      { wrapper: createWrapper() },
    );

    expect(result.current.form).toBeDefined();
    expect(result.current.isSubmitting).toBe(false);
    expect(result.current.isDirty).toBe(false);
  });

  it("should return correct state properties", () => {
    const { result } = renderHook(
      () =>
        useStandardForm<TestFormData>({
          schema: testSchema,
          mutationFn: mockMutationFn,
          queryKey: "test",
        }),
      { wrapper: createWrapper() },
    );

    expect(result.current).toHaveProperty("form");
    expect(result.current).toHaveProperty("handleSubmit");
    expect(result.current).toHaveProperty("isSubmitting");
    expect(result.current).toHaveProperty("isDirty");
    expect(result.current).toHaveProperty("isValid");
    expect(result.current).toHaveProperty("isSuccess");
    expect(result.current).toHaveProperty("isError");
    expect(result.current).toHaveProperty("reset");
  });

  it("should have handleSubmit as a function", () => {
    const { result } = renderHook(
      () =>
        useStandardForm<TestFormData>({
          schema: testSchema,
          mutationFn: mockMutationFn,
          queryKey: "test",
        }),
      { wrapper: createWrapper() },
    );

    expect(typeof result.current.handleSubmit).toBe("function");
  });

  it("should have reset as a function", () => {
    const { result } = renderHook(
      () =>
        useStandardForm<TestFormData>({
          schema: testSchema,
          mutationFn: mockMutationFn,
          queryKey: "test",
          defaultValues: { name: "Test", email: "test@example.com" },
        }),
      { wrapper: createWrapper() },
    );

    expect(typeof result.current.reset).toBe("function");

    // Test reset function
    act(() => {
      result.current.reset();
    });

    expect(result.current.isDirty).toBe(false);
  });
});

describe("useCreateForm", () => {
  const mockMutationFn = vi.fn().mockResolvedValue({ success: true });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should use create-specific success message", () => {
    const { result: _result } = renderHook(
      () =>
        useCreateForm<TestFormData>({
          schema: testSchema,
          mutationFn: mockMutationFn,
          queryKey: "test",
          entityName: "Kullanıcı",
        }),
      { wrapper: createWrapper() },
    );

    // useFormMutation should be called with create-specific messages
    expect(useFormMutation).toHaveBeenCalledWith(
      expect.objectContaining({
        successMessage: "Kullanıcı başarıyla oluşturuldu",
        errorMessage: "Kullanıcı oluşturulurken hata",
      }),
    );
  });
});

describe("useUpdateForm", () => {
  const mockMutationFn = vi.fn().mockResolvedValue({ success: true });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should use update-specific success message", () => {
    const { result: _result } = renderHook(
      () =>
        useUpdateForm<TestFormData>({
          schema: testSchema,
          mutationFn: mockMutationFn,
          queryKey: "test",
          entityName: "Kullanıcı",
        }),
      { wrapper: createWrapper() },
    );

    // useFormMutation should be called with update-specific messages
    expect(useFormMutation).toHaveBeenCalledWith(
      expect.objectContaining({
        successMessage: "Kullanıcı başarıyla güncellendi",
        errorMessage: "Kullanıcı güncellenirken hata",
      }),
    );
  });
});
