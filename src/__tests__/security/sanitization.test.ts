/**
 * Security Tests - Input Sanitization
 * Tests for XSS, SQL injection, and other security vulnerabilities prevention
 */

import { describe, it, expect } from 'vitest';
import {
  sanitizeHtml,
  sanitizeText,
  sanitizeEmail,
  sanitizePhone,
  sanitizeSearchQuery,
  sanitizeUrl,
} from '@/lib/sanitization';

describe('Input Sanitization', () => {
  describe('sanitizeHtml', () => {
    it('should remove script tags', () => {
      const input = '<script>alert("XSS")</script><p>Safe content</p>';
      const result = sanitizeHtml(input);
      expect(result).not.toContain('<script>');
      expect(result).toContain('Safe content');
    });

    it('should remove event handlers', () => {
      const input = '<img src="x" onerror="alert(\'XSS\')" />';
      const result = sanitizeHtml(input);
      expect(result).not.toContain('onerror');
    });

    it('should remove javascript: URLs', () => {
      const input = '<a href="javascript:alert(\'XSS\')">Click</a>';
      const result = sanitizeHtml(input);
      expect(result).not.toContain('javascript:');
    });

    it('should preserve safe HTML tags', () => {
      const input = '<p>Safe <strong>content</strong></p>';
      const result = sanitizeHtml(input);
      expect(result).toContain('<p>');
      expect(result).toContain('<strong>');
    });
  });

  describe('sanitizeText', () => {
    it('should remove HTML tags', () => {
      const input = '<p>Test <strong>content</strong></p>';
      const result = sanitizeText(input);
      expect(result).not.toContain('<');
      expect(result).not.toContain('>');
      expect(result).toContain('Test content');
    });

    it('should remove special characters', () => {
      const input = 'Test<>"\'content';
      const result = sanitizeText(input);
      expect(result).not.toContain('<');
      expect(result).not.toContain('>');
      expect(result).not.toContain('"');
      expect(result).not.toContain("'");
    });
  });

  describe('sanitizeEmail', () => {
    it('should accept valid email', () => {
      const result = sanitizeEmail('test@example.com');
      expect(result).toBe('test@example.com');
    });

    it('should normalize email to lowercase', () => {
      const result = sanitizeEmail('Test@Example.COM');
      expect(result).toBe('test@example.com');
    });

    it('should reject invalid email', () => {
      const result = sanitizeEmail('invalid-email');
      expect(result).toBeNull();
    });

    it('should reject email with XSS attempt', () => {
      const result = sanitizeEmail('test<script>@example.com');
      expect(result).toBeNull();
    });
  });

  describe('sanitizePhone', () => {
    it('should normalize Turkish mobile format', () => {
      const result = sanitizePhone('05551234567');
      expect(result).toBe('5551234567');
    });

    it('should normalize with country code', () => {
      const result = sanitizePhone('905551234567');
      expect(result).toBe('5551234567');
    });

    it('should accept already normalized format', () => {
      const result = sanitizePhone('5551234567');
      expect(result).toBe('5551234567');
    });

    it('should reject invalid phone numbers', () => {
      expect(sanitizePhone('123')).toBeNull();
      expect(sanitizePhone('555123456789')).toBeNull();
      expect(sanitizePhone('0123456789')).toBeNull(); // Doesn't start with 5
    });
  });

  describe('sanitizeSearchQuery', () => {
    it('should remove SQL injection attempts', () => {
      const input = "test'; DROP TABLE users; --";
      const result = sanitizeSearchQuery(input);
      expect(result).not.toContain("'");
      expect(result).not.toContain(';');
      expect(result).not.toContain('--');
    });

    it('should remove SQL comments', () => {
      const input = 'test/* SQL comment */query';
      const result = sanitizeSearchQuery(input);
      expect(result).not.toContain('/*');
    });

    it('should limit query length', () => {
      const longInput = 'a'.repeat(300);
      const result = sanitizeSearchQuery(longInput);
      expect(result.length).toBeLessThanOrEqual(200);
    });
  });

  describe('sanitizeUrl', () => {
    it('should accept valid HTTP URL', () => {
      const result = sanitizeUrl('http://example.com');
      expect(result).toBe('http://example.com');
    });

    it('should accept valid HTTPS URL', () => {
      const result = sanitizeUrl('https://example.com');
      expect(result).toBe('https://example.com');
    });

    it('should reject javascript: URLs', () => {
      const result = sanitizeUrl('javascript:alert("XSS")');
      expect(result).toBeNull();
    });

    it('should reject data: URLs', () => {
      const result = sanitizeUrl('data:text/html,<script>alert("XSS")</script>');
      expect(result).toBeNull();
    });

    it('should reject invalid URLs', () => {
      const result = sanitizeUrl('not-a-url');
      expect(result).toBeNull();
    });
  });
});

