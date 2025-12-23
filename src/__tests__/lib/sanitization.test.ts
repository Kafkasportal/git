/**
 * Sanitization Library Tests
 */

import { describe, it, expect } from 'vitest';
import {
  sanitizeHtml,
  sanitizeText,
  sanitizeEmail,
  sanitizePhone,
  sanitizeTcNo,
  sanitizeUrl,
  sanitizeFilename,
  sanitizeSearchQuery,
  sanitizeNumber,
  sanitizeInteger,
  sanitizeAmount,
  sanitizeDate,
  sanitizeObject,
} from '@/lib/sanitization';

describe('sanitizeHtml', () => {
  it('should return empty string for empty input', () => {
    expect(sanitizeHtml('')).toBe('');
  });

  it('should remove script tags', () => {
    const input = '<p>Hello</p><script>alert("xss")</script>';
    expect(sanitizeHtml(input)).not.toContain('<script>');
  });

  it('should remove onclick handlers', () => {
    const input = '<button onclick="alert(\'xss\')">Click</button>';
    expect(sanitizeHtml(input)).not.toContain('onclick');
  });

  it('should remove javascript: protocol', () => {
    const input = '<a href="javascript:alert(\'xss\')">Link</a>';
    expect(sanitizeHtml(input)).not.toContain('javascript:');
  });
});

describe('sanitizeText', () => {
  it('should return empty string for empty input', () => {
    expect(sanitizeText('')).toBe('');
  });

  it('should remove HTML tags', () => {
    expect(sanitizeText('<p>Hello</p>')).toBe('Hello');
  });

  it('should remove special characters', () => {
    expect(sanitizeText('Hello<>"\'')).toBe('Hello');
  });

  it('should trim whitespace', () => {
    expect(sanitizeText('  Hello  ')).toBe('Hello');
  });
});

describe('sanitizeEmail', () => {
  it('should return null for empty input', () => {
    expect(sanitizeEmail('')).toBeNull();
  });

  it('should return sanitized email for valid input', () => {
    expect(sanitizeEmail('Test@Example.COM')).toBe('test@example.com');
  });

  it('should return null for invalid email', () => {
    expect(sanitizeEmail('invalid-email')).toBeNull();
    expect(sanitizeEmail('test@')).toBeNull();
    expect(sanitizeEmail('@example.com')).toBeNull();
  });

  it('should trim whitespace', () => {
    expect(sanitizeEmail('  test@example.com  ')).toBe('test@example.com');
  });
});

describe('sanitizePhone', () => {
  it('should return null for empty input', () => {
    expect(sanitizePhone('')).toBeNull();
  });

  it('should handle 10-digit format starting with 5', () => {
    expect(sanitizePhone('5551234567')).toBe('5551234567');
  });

  it('should handle 11-digit format with leading 0', () => {
    expect(sanitizePhone('05551234567')).toBe('5551234567');
  });

  it('should handle format with country code +90', () => {
    expect(sanitizePhone('905551234567')).toBe('5551234567');
  });

  it('should remove non-digit characters', () => {
    expect(sanitizePhone('+90 555 123 45 67')).toBe('5551234567');
  });

  it('should return null for invalid phone numbers', () => {
    expect(sanitizePhone('123')).toBeNull();
    expect(sanitizePhone('1234567890')).toBeNull(); // Doesn't start with 5
  });
});

describe('sanitizeTcNo', () => {
  it('should return null for empty input', () => {
    expect(sanitizeTcNo('')).toBeNull();
  });

  it('should return null for wrong length', () => {
    expect(sanitizeTcNo('1234567890')).toBeNull(); // 10 digits
    expect(sanitizeTcNo('123456789012')).toBeNull(); // 12 digits
  });

  it('should return null if first digit is 0', () => {
    expect(sanitizeTcNo('01234567890')).toBeNull();
  });

  it('should validate correct TC Kimlik No', () => {
    // Valid TC: 10000000146
    expect(sanitizeTcNo('10000000146')).toBe('10000000146');
  });

  it('should return null for invalid checksum', () => {
    expect(sanitizeTcNo('12345678901')).toBeNull();
  });
});

describe('sanitizeUrl', () => {
  it('should return null for empty input', () => {
    expect(sanitizeUrl('')).toBeNull();
  });

  it('should accept valid http/https URLs', () => {
    expect(sanitizeUrl('https://example.com')).toBe('https://example.com');
    expect(sanitizeUrl('http://example.com')).toBe('http://example.com');
  });

  it('should block javascript: URLs', () => {
    expect(sanitizeUrl('javascript:alert(1)')).toBeNull();
  });

  it('should block data: URLs', () => {
    expect(sanitizeUrl('data:text/html,<script>alert(1)</script>')).toBeNull();
  });

  it('should handle relative URLs', () => {
    expect(sanitizeUrl('/path/to/page')).toBe('/path/to/page');
  });
});

describe('sanitizeFilename', () => {
  it('should return empty string for empty input', () => {
    expect(sanitizeFilename('')).toBe('');
  });

  it('should replace special characters with underscore', () => {
    expect(sanitizeFilename('file name.txt')).toBe('file_name.txt');
    expect(sanitizeFilename('file@#$.txt')).toBe('file___.txt');
  });

  it('should remove path traversal attempts', () => {
    expect(sanitizeFilename('../../../etc/passwd')).not.toContain('..');
  });

  it('should remove leading dots', () => {
    expect(sanitizeFilename('.hidden')).toBe('hidden');
  });

  it('should limit filename length to 255 characters', () => {
    const longName = `${'a'.repeat(300)  }.txt`;
    expect(sanitizeFilename(longName).length).toBeLessThanOrEqual(255);
  });
});

describe('sanitizeSearchQuery', () => {
  it('should return empty string for empty input', () => {
    expect(sanitizeSearchQuery('')).toBe('');
  });

  it('should remove SQL injection characters', () => {
    expect(sanitizeSearchQuery("'; DROP TABLE users;--")).not.toContain("'");
    expect(sanitizeSearchQuery("'; DROP TABLE users;--")).not.toContain(';');
    expect(sanitizeSearchQuery("'; DROP TABLE users;--")).not.toContain('--');
  });

  it('should limit query length', () => {
    const longQuery = 'a'.repeat(300);
    expect(sanitizeSearchQuery(longQuery).length).toBeLessThanOrEqual(200);
  });

  it('should trim whitespace', () => {
    expect(sanitizeSearchQuery('  search term  ')).toBe('search term');
  });
});

describe('sanitizeNumber', () => {
  it('should return null for empty input', () => {
    expect(sanitizeNumber('')).toBeNull();
  });

  it('should handle number type input', () => {
    expect(sanitizeNumber(123.45)).toBe(123.45);
  });

  it('should handle US format (comma thousands, dot decimal)', () => {
    expect(sanitizeNumber('1,234.56')).toBe(1234.56);
  });

  it('should handle Turkish format (dot thousands, comma decimal)', () => {
    expect(sanitizeNumber('1.234,56')).toBe(1234.56);
  });

  it('should handle simple decimal with comma', () => {
    expect(sanitizeNumber('5,50')).toBe(5.5);
  });

  it('should return null for invalid numbers', () => {
    expect(sanitizeNumber('abc')).toBeNull();
    expect(sanitizeNumber('NaN')).toBeNull();
  });
});

describe('sanitizeInteger', () => {
  it('should return null for empty input', () => {
    expect(sanitizeInteger('')).toBeNull();
  });

  it('should floor decimal numbers', () => {
    expect(sanitizeInteger(5.9)).toBe(5);
    expect(sanitizeInteger('5.9')).toBe(5);
  });

  it('should handle string integers', () => {
    expect(sanitizeInteger('123')).toBe(123);
  });
});

describe('sanitizeAmount', () => {
  it('should return null for empty input', () => {
    expect(sanitizeAmount('')).toBeNull();
  });

  it('should round to 2 decimal places', () => {
    expect(sanitizeAmount(123.456)).toBe(123.46);
    expect(sanitizeAmount(123.454)).toBe(123.45);
  });

  it('should return null for negative amounts', () => {
    expect(sanitizeAmount(-100)).toBeNull();
  });

  it('should handle string amounts', () => {
    expect(sanitizeAmount('100.50')).toBe(100.5);
  });
});

describe('sanitizeDate', () => {
  it('should return null for empty input', () => {
    expect(sanitizeDate('')).toBeNull();
  });

  it('should return valid Date object', () => {
    const result = sanitizeDate('2024-01-15');
    expect(result).toBeInstanceOf(Date);
    expect(result?.getFullYear()).toBe(2024);
  });

  it('should return null for invalid date string', () => {
    expect(sanitizeDate('invalid-date')).toBeNull();
  });

  it('should return null for dates outside reasonable range', () => {
    expect(sanitizeDate('1800-01-01')).toBeNull(); // Before 1900
    expect(sanitizeDate('2200-01-01')).toBeNull(); // After 2100
  });
});

describe('sanitizeObject', () => {
  it('should return input for non-object', () => {
    expect(sanitizeObject(null as any)).toBeNull();
    expect(sanitizeObject(undefined as any)).toBeUndefined();
  });

  it('should sanitize string fields', () => {
    const obj = { name: '<script>alert(1)</script>Test' };
    const result = sanitizeObject(obj);
    expect(result.name).not.toContain('<script>');
  });

  it('should handle nested objects', () => {
    const obj = { user: { name: '<b>Test</b>' } };
    const result = sanitizeObject(obj);
    expect(result.user.name).toBe('Test');
  });

  it('should skip ignored fields', () => {
    const obj = { html: '<b>Bold</b>', name: '<b>Test</b>' };
    const result = sanitizeObject(obj, { fieldsToIgnore: ['html'] });
    expect(result.html).toBe('<b>Bold</b>');
    expect(result.name).toBe('Test');
  });

  it('should handle arrays', () => {
    const arr = [{ name: '<b>Test</b>' }];
    const result = sanitizeObject(arr as any);
    expect(Array.isArray(result)).toBe(true);
    expect(result[0].name).toBe('Test');
  });

  it('should preserve non-string values', () => {
    const obj = { count: 5, active: true, data: null };
    const result = sanitizeObject(obj);
    expect(result.count).toBe(5);
    expect(result.active).toBe(true);
    expect(result.data).toBeNull();
  });
});
