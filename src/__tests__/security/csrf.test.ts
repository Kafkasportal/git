/**
 * Security Tests - CSRF Protection
 * Tests for CSRF token validation
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { verifyCsrfToken } from '@/lib/api/auth-utils';

vi.mock('@/lib/csrf', () => ({
  validateCsrfToken: vi.fn(),
}));

describe('CSRF Protection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should accept valid CSRF token', async () => {
    const { validateCsrfToken } = await import('@/lib/csrf');
    vi.mocked(validateCsrfToken).mockReturnValue(true);

    const request = new NextRequest('http://localhost/api/test', {
      method: 'POST',
      headers: { 'x-csrf-token': 'valid-token' },
    });

    await expect(verifyCsrfToken(request)).resolves.not.toThrow();
    expect(validateCsrfToken).toHaveBeenCalledWith('valid-token');
  });

  it('should reject missing CSRF token', async () => {
    const { validateCsrfToken } = await import('@/lib/csrf');
    vi.mocked(validateCsrfToken).mockReturnValue(false);

    const request = new NextRequest('http://localhost/api/test', {
      method: 'POST',
    });

    await expect(verifyCsrfToken(request)).rejects.toThrow();
  });

  it('should reject invalid CSRF token', async () => {
    const { validateCsrfToken } = await import('@/lib/csrf');
    vi.mocked(validateCsrfToken).mockReturnValue(false);

    const request = new NextRequest('http://localhost/api/test', {
      method: 'POST',
      headers: { 'x-csrf-token': 'invalid-token' },
    });

    await expect(verifyCsrfToken(request)).rejects.toThrow();
  });

  it('should check cookie CSRF token as fallback', async () => {
    const { validateCsrfToken } = await import('@/lib/csrf');
    vi.mocked(validateCsrfToken).mockReturnValue(true);

    const request = new NextRequest('http://localhost/api/test', {
      method: 'POST',
      headers: {
        cookie: 'csrf-token=valid-token',
      },
    });

    await expect(verifyCsrfToken(request)).resolves.not.toThrow();
  });
});

