import { describe, it, expect } from 'vitest';
import { cn } from '@/lib/utils';

describe('Utils Library', () => {
  describe('cn (className utility)', () => {
    it('should combine class names correctly', () => {
      const result = cn('class1', 'class2');
      expect(result).toBe('class1 class2');
    });

    it('should handle conditional classes', () => {
      const isActive = true;
      const result = cn('base', isActive && 'active');
      expect(result).toBe('base active');
    });

    it('should handle false values', () => {
      const isActive = false;
      const result = cn('base', isActive && 'active');
      expect(result).toBe('base');
    });

    it('should merge Tailwind classes correctly', () => {
      const result = cn('p-4', 'padding-2');
      // These are different properties so both should be present
      expect(result).toContain('p-4');
      expect(result).toContain('padding-2');
    });

    it('should handle array of classes', () => {
      const result = cn(['class1', 'class2'], { class3: true, class4: false });
      expect(result).toContain('class1');
      expect(result).toContain('class2');
      expect(result).toContain('class3');
      expect(result).not.toContain('class4');
    });

    it('should handle undefined and null values', () => {
      const result = cn('class1', undefined, null, 'class2');
      expect(result).toBe('class1 class2');
    });

    it('should work with empty input', () => {
      const result = cn();
      expect(result).toBe('');
    });
  });
});
