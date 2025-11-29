/**
 * useCountUp Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useCountUp, formatNumber } from "@/hooks/useCountUp";

describe("useCountUp", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should start at start value and end at end value", async () => {
    // Use real timers for this test since useCountUp uses requestAnimationFrame 
    // which doesn't work well with fake timers - it needs actual animation frames
    vi.useRealTimers();
    
    const { result } = renderHook(() =>
      useCountUp({ start: 0, end: 100, duration: 100, enabled: true }),
    );

    // Initial value should be start
    expect(result.current.rawCount).toBe(0);

    // Wait for animation to complete
    await new Promise((resolve) => setTimeout(resolve, 200));

    // After animation, should be at or near end value
    expect(result.current.rawCount).toBeCloseTo(100, 0);
    
    vi.useFakeTimers();
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
    // Turkish compact format - can be "1,5 Mn" or "2 Mn" depending on rounding
    expect(result).toMatch(/Mn|Milyon|M/);
  });

  it("should use custom locale", () => {
    const result = formatNumber(1234.56, { locale: "en-US", decimals: 2 });
    expect(result).toBe("1,234.56");
  });
});
