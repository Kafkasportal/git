/**
 * Utils Tests
 */

import { describe, it, expect } from 'vitest';
import { cn } from '@/lib/utils';

describe('cn (class name utility)', () => {
  it('should merge single class', () => {
    expect(cn('text-red-500')).toBe('text-red-500');
  });

  it('should merge multiple classes', () => {
    expect(cn('text-red-500', 'bg-blue-500')).toBe('text-red-500 bg-blue-500');
  });

  it('should handle conditional classes', () => {
    const isActive = true;
    const isDisabled = false;
    expect(cn('base', isActive && 'active', isDisabled && 'disabled')).toBe('base active');
  });

  it('should merge tailwind classes correctly', () => {
    // Later class should override earlier conflicting class
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500');
    expect(cn('p-2', 'p-4')).toBe('p-4');
  });

  it('should handle arrays of classes', () => {
    expect(cn(['text-red-500', 'bg-blue-500'])).toBe('text-red-500 bg-blue-500');
  });

  it('should handle objects with conditional classes', () => {
    expect(cn({ 'text-red-500': true, 'bg-blue-500': false })).toBe('text-red-500');
  });

  it('should handle undefined and null values', () => {
    expect(cn('base', undefined, null, 'active')).toBe('base active');
  });

  it('should return empty string for no arguments', () => {
    expect(cn()).toBe('');
  });

  it('should handle empty strings', () => {
    expect(cn('', 'text-red-500', '')).toBe('text-red-500');
  });
});
