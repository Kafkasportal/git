/**
 * useCountUp Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useCountUp, formatNumber } from "@/hooks/useCountUp";

describe("useCountUp", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should start at start value and end at end value", async () => {
    const { result } = renderHook(() =>
      useCountUp({ start: 0, end: 100, duration: 1000, enabled: true }),
    );

    // Initial value should be start
    expect(result.current.rawCount).toBe(0);

    // Fast-forward time
    await act(async () => {
      vi.advanceTimersByTime(1100);
    });

    // After animation, should be at end value
    await waitFor(() => {
      expect(result.current.rawCount).toBe(100);
    });
  });

  it("should show end value immediately when disabled", () => {
    const { result } = renderHook(() =>
      useCountUp({ start: 0, end: 100, duration: 1000, enabled: false }),
    );

    // When disabled, should show end value immediately
    expect(result.current.rawCount).toBe(100);
  });

  it("should format count with decimals", () => {
    const { result } = renderHook(() =>
      useCountUp({
        start: 0,
        end: 99.99,
        duration: 100,
        decimals: 2,
        enabled: false,
      }),
    );

    expect(result.current.count).toBe("99.99");
  });

  it("should round count when decimals is 0", () => {
    const { result } = renderHook(() =>
      useCountUp({
        start: 0,
        end: 100,
        duration: 100,
        decimals: 0,
        enabled: false,
      }),
    );

    expect(result.current.count).toBe(100);
  });
});

describe("formatNumber", () => {
  it("should format number with Turkish locale by default", () => {
    const result = formatNumber(1234567);
    expect(result).toBe("1.234.567");
  });

  it("should format number with decimals", () => {
    const result = formatNumber(1234.5678, { decimals: 2 });
    expect(result).toBe("1.234,57");
  });

  it("should format with compact notation", () => {
    const result = formatNumber(1500000, { notation: "compact" });
    // Turkish compact format
    expect(result).toMatch(/1,5/);
  });

  it("should use custom locale", () => {
    const result = formatNumber(1234.56, { locale: "en-US", decimals: 2 });
    expect(result).toBe("1,234.56");
  });
});
