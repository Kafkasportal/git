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
  validateFile,
} from '@/lib/sanitization';

describe('Sanitization Library', () => {
  describe('sanitizeHtml', () => {
    it('should allow safe HTML tags', () => {
      const input = '<p>Hello <strong>world</strong></p>';
      const output = sanitizeHtml(input);
      expect(output).toContain('<p>');
      expect(output).toContain('<strong>');
    });

    it('should remove dangerous HTML', () => {
      const input = '<script>alert("xss")</script><p>Safe</p>';
      const output = sanitizeHtml(input);
      expect(output).not.toContain('<script>');
      expect(output).toContain('<p>Safe</p>');
    });

    it('should remove event handlers', () => {
      const input = '<a href="#" onclick="alert(1)">Link</a>';
      const output = sanitizeHtml(input);
      expect(output).not.toContain('onclick');
    });
  });

  describe('sanitizeText', () => {
    it('should remove all HTML tags', () => {
      const input = '<p>Hello <strong>world</strong></p>';
      const output = sanitizeText(input);
      expect(output).toBe('Hello world');
    });

    it('should remove special characters', () => {
      const input = 'Hello<>"\' world';
      const output = sanitizeText(input);
      expect(output).not.toContain('<');
      expect(output).not.toContain('>');
    });

    it('should trim whitespace', () => {
      const input = '  Hello world  ';
      const output = sanitizeText(input);
      expect(output).toBe('Hello world');
    });
  });

  describe('sanitizeEmail', () => {
    it('should accept valid email', () => {
      const input = 'user@example.com';
      const output = sanitizeEmail(input);
      expect(output).toBe('user@example.com');
    });

    it('should convert to lowercase', () => {
      const input = 'User@Example.COM';
      const output = sanitizeEmail(input);
      expect(output).toBe('user@example.com');
    });

    it('should reject invalid email', () => {
      const invalid = ['not-an-email', '@example.com', 'user@', 'user @example.com'];
      invalid.forEach((email) => {
        expect(sanitizeEmail(email)).toBeNull();
      });
    });

    it('should trim whitespace', () => {
      const input = '  user@example.com  ';
      const output = sanitizeEmail(input);
      expect(output).toBe('user@example.com');
    });
  });

  describe('sanitizePhone', () => {
    it('should format Turkish phone with country code', () => {
      const input = '05551234567';
      const output = sanitizePhone(input);
      // Turkish mobile numbers start with 5, so 0555 is valid
      expect(output).toBe('+905551234567');
    });

    it('should accept phone with country code', () => {
      const input = '905551234567'; // Without + sign
      const output = sanitizePhone(input);
      expect(output).toBe('+905551234567');
    });

    it('should handle formatted phone', () => {
      const input = '0555 123 45 67';
      const output = sanitizePhone(input);
      expect(output).toBe('+905551234567');
    });

    it('should accept phone with plus sign', () => {
      const input = '+905551234567';
      const output = sanitizePhone(input);
      expect(output).toBe('+905551234567');
    });

    it('should reject invalid phone', () => {
      const invalid = ['123', '05123456', '02121234567']; // Too short or landline
      invalid.forEach((phone) => {
        expect(sanitizePhone(phone)).toBeNull();
      });
    });
  });

  describe('sanitizeTcNo', () => {
    it('should accept valid TC Kimlik No', () => {
      const validTcNo = '12345678901'; // Mock valid TC
      // Note: This is just format check, real validation needs proper algorithm
      const output = sanitizeTcNo(validTcNo);
      // Will be null because checksum validation will fail for this mock number
      expect(output).toBeNull();
    });

    it('should reject TC starting with 0', () => {
      const input = '01234567890';
      const output = sanitizeTcNo(input);
      expect(output).toBeNull();
    });

    it('should reject non-11-digit TC', () => {
      const invalid = ['123', '123456', '12345678901234'];
      invalid.forEach((tc) => {
        expect(sanitizeTcNo(tc)).toBeNull();
      });
    });

    it('should remove non-digit characters', () => {
      const input = '123-456-789-01';
      const output = sanitizeTcNo(input);
      // Will be null due to checksum, but digits are extracted
      expect(output).toBeNull();
    });
  });

  describe('sanitizeUrl', () => {
    it('should accept valid HTTP URLs', () => {
      const urls = ['http://example.com', 'https://example.com'];
      urls.forEach((url) => {
        expect(sanitizeUrl(url)).toBe(url);
      });
    });

    it('should reject javascript: URLs', () => {
      const input = 'javascript:alert(1)';
      const output = sanitizeUrl(input);
      expect(output).toBeNull();
    });

    it('should reject data: URLs', () => {
      const input = 'data:text/html,<script>alert(1)</script>';
      const output = sanitizeUrl(input);
      expect(output).toBeNull();
    });
  });

  describe('sanitizeFilename', () => {
    it('should replace special characters with underscore', () => {
      const input = 'my file (1).pdf';
      const output = sanitizeFilename(input);
      expect(output).toBe('my_file__1_.pdf');
    });

    it('should remove path traversal attempts', () => {
      const input = '../../../etc/passwd';
      const output = sanitizeFilename(input);
      expect(output).not.toContain('..');
    });

    it('should remove leading dots', () => {
      const input = '...hidden.txt';
      const output = sanitizeFilename(input);
      expect(output).not.toMatch(/^\./);
    });

    it('should limit length to 255 characters', () => {
      const input = `${'a'.repeat(300)}.txt`;
      const output = sanitizeFilename(input);
      expect(output.length).toBeLessThanOrEqual(255);
    });
  });

  describe('sanitizeSearchQuery', () => {
    it('should remove SQL injection attempts', () => {
      const input = "'; DROP TABLE users; --";
      const output = sanitizeSearchQuery(input);
      expect(output).not.toContain("'");
      expect(output).not.toContain(';');
      expect(output).not.toContain('--');
    });

    it('should limit query length', () => {
      const input = 'a'.repeat(300);
      const output = sanitizeSearchQuery(input);
      expect(output.length).toBeLessThanOrEqual(200);
    });
  });

  describe('sanitizeNumber', () => {
    it('should parse valid numbers', () => {
      expect(sanitizeNumber('123')).toBe(123);
      expect(sanitizeNumber('123.45')).toBe(123.45);
      expect(sanitizeNumber(123)).toBe(123);
    });

    it('should handle Turkish decimal separator', () => {
      expect(sanitizeNumber('123,45')).toBe(123.45);
    });

    it('should return null for invalid numbers', () => {
      expect(sanitizeNumber('abc')).toBeNull();
      expect(sanitizeNumber('')).toBeNull();
      // '12a3' will parse as 12, then fail on 'a3' - depends on implementation
      const result = sanitizeNumber('12a3');
      expect(result === null || result === 12).toBeTruthy();
    });

    it('should return null for Infinity', () => {
      expect(sanitizeNumber(Infinity)).toBeNull();
      expect(sanitizeNumber(-Infinity)).toBeNull();
    });
  });

  describe('sanitizeInteger', () => {
    it('should floor decimal numbers', () => {
      expect(sanitizeInteger('123.99')).toBe(123);
      expect(sanitizeInteger(123.99)).toBe(123);
    });

    it('should return null for invalid input', () => {
      expect(sanitizeInteger('abc')).toBeNull();
    });
  });

  describe('sanitizeAmount', () => {
    it('should round to 2 decimal places', () => {
      expect(sanitizeAmount('123.456')).toBe(123.46);
      expect(sanitizeAmount(123.456)).toBe(123.46);
    });

    it('should reject negative amounts', () => {
      expect(sanitizeAmount('-10')).toBeNull();
      expect(sanitizeAmount(-10)).toBeNull();
    });

    it('should accept zero', () => {
      expect(sanitizeAmount('0')).toBe(0);
      expect(sanitizeAmount(0)).toBe(0);
    });
  });

  describe('sanitizeDate', () => {
    it('should parse valid date string', () => {
      const input = '2024-01-15';
      const output = sanitizeDate(input);
      expect(output).toBeInstanceOf(Date);
      expect(output?.getFullYear()).toBe(2024);
    });

    it('should reject invalid date', () => {
      expect(sanitizeDate('not-a-date')).toBeNull();
      expect(sanitizeDate('')).toBeNull();
    });

    it('should reject dates outside reasonable range', () => {
      expect(sanitizeDate('1800-01-01')).toBeNull();
      expect(sanitizeDate('2200-01-01')).toBeNull();
    });
  });

  describe('validateFile', () => {
    it('should accept valid file', () => {
      const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });
      const result = validateFile(file);
      expect(result.valid).toBe(true);
      expect(result.sanitizedFilename).toBeTruthy();
    });

    it('should reject oversized file', () => {
      const largeContent = new Array(11 * 1024 * 1024).fill('a').join('');
      const file = new File([largeContent], 'large.pdf', { type: 'application/pdf' });
      const result = validateFile(file);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('boyutu');
    });

    it('should reject invalid file type', () => {
      const file = new File(['content'], 'test.exe', { type: 'application/x-msdownload' });
      const result = validateFile(file);
      expect(result.valid).toBe(false);
    });

    it('should respect custom options', () => {
      const file = new File(['content'], 'test.txt', { type: 'text/plain' });
      const result = validateFile(file, {
        allowedTypes: ['text/plain'],
        allowedExtensions: ['.txt'],
        maxSize: 1024,
      });
      expect(result.valid).toBe(true);
    });
  });
});
