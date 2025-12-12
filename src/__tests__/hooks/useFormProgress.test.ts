/**
 * useFormProgress Tests
 */

import { describe, it, expect, vi } from "vitest";
import { renderHook } from "@testing-library/react";

// Mock react-hook-form useWatch
vi.mock("react-hook-form", async () => {
  const actual = await vi.importActual("react-hook-form");
  return {
    ...actual,
    useWatch: vi.fn(),
  };
});

import { useFormProgress } from "@/components/kumbara/hooks/useFormProgress";
import { useWatch } from "react-hook-form";

interface TestFormData {
  name: string;
  email: string;
  phone: string;
}

describe("useFormProgress", () => {
  const requiredFields = ["name", "email", "phone"] as const;

  it("should return 0% when no fields are completed", () => {
    (useWatch as ReturnType<typeof vi.fn>).mockReturnValue([
      undefined,
      undefined,
      undefined,
    ]);

    const { result } = renderHook(() =>
      useFormProgress<TestFormData>({
        control: {} as unknown,
        requiredFieldNames: requiredFields,
      }),
    );

    expect(result.current).toBe(0);
  });

  it("should return 33% when 1 of 3 fields is completed", () => {
    (useWatch as ReturnType<typeof vi.fn>).mockReturnValue([
      "John",
      undefined,
      undefined,
    ]);

    const { result } = renderHook(() =>
      useFormProgress<TestFormData>({
        control: {} as unknown,
        requiredFieldNames: requiredFields,
      }),
    );

    expect(result.current).toBe(33);
  });

  it("should return 67% when 2 of 3 fields are completed", () => {
    (useWatch as ReturnType<typeof vi.fn>).mockReturnValue([
      "John",
      "john@example.com",
      undefined,
    ]);

    const { result } = renderHook(() =>
      useFormProgress<TestFormData>({
        control: {} as unknown,
        requiredFieldNames: requiredFields,
      }),
    );

    expect(result.current).toBe(67);
  });

  it("should return 100% when all fields are completed", () => {
    (useWatch as ReturnType<typeof vi.fn>).mockReturnValue([
      "John",
      "john@example.com",
      "5551234567",
    ]);

    const { result } = renderHook(() =>
      useFormProgress<TestFormData>({
        control: {} as unknown,
        requiredFieldNames: requiredFields,
      }),
    );

    expect(result.current).toBe(100);
  });

  it("should treat empty string as incomplete", () => {
    (useWatch as ReturnType<typeof vi.fn>).mockReturnValue([
      "John",
      "",
      "5551234567",
    ]);

    const { result } = renderHook(() =>
      useFormProgress<TestFormData>({
        control: {} as unknown,
        requiredFieldNames: requiredFields,
      }),
    );

    expect(result.current).toBe(67);
  });

  it("should treat null as incomplete", () => {
    (useWatch as ReturnType<typeof vi.fn>).mockReturnValue([
      "John",
      null,
      "5551234567",
    ]);

    const { result } = renderHook(() =>
      useFormProgress<TestFormData>({
        control: {} as unknown,
        requiredFieldNames: requiredFields,
      }),
    );

    expect(result.current).toBe(67);
  });
});
