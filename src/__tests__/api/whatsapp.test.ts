import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '@/app/api/whatsapp/send/route';
import { NextRequest } from 'next/server';
import * as whatsappService from '@/lib/services/whatsapp';
import * as authUtils from '@/lib/api/auth-utils';

// Mock WhatsApp service
vi.mock('@/lib/services/whatsapp', () => ({
  sendWhatsAppMessage: vi.fn(),
}));

// Mock auth
vi.mock('@/lib/api/auth-utils', () => ({
  requireModuleAccess: vi.fn(),
  verifyCsrfToken: vi.fn().mockResolvedValue(undefined),
  buildErrorResponse: vi.fn().mockReturnValue(null),
}));

// Mock logger
vi.mock('@/lib/logger', () => ({
  default: {
    info: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock rate limit
vi.mock('@/lib/rate-limit', () => ({
  dataModificationRateLimit: vi.fn((fn) => fn),
}));

describe('POST /api/whatsapp/send', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(authUtils.requireModuleAccess).mockResolvedValue({
      user: {
        id: 'test-user',
        permissions: ['messages:write'],
      },
    } as any);
  });

  it('sends WhatsApp message successfully to single recipient', async () => {
    const messageData = {
      to: '905551234567',
      message: 'Test message',
    };

    vi.mocked(whatsappService.sendWhatsAppMessage).mockResolvedValue(true);

    const request = new NextRequest('http://localhost/api/whatsapp/send', {
      method: 'POST',
      body: JSON.stringify(messageData),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toBe('WhatsApp mesajı başarıyla gönderildi');
    expect(data.recipientCount).toBe(1);
    expect(vi.mocked(whatsappService.sendWhatsAppMessage)).toHaveBeenCalledWith(messageData);
  });

  it('sends WhatsApp message successfully to multiple recipients', async () => {
    const messageData = {
      to: ['905551234567', '905559876543'],
      message: 'Test message',
    };

    vi.mocked(whatsappService.sendWhatsAppMessage).mockResolvedValue(true);

    const request = new NextRequest('http://localhost/api/whatsapp/send', {
      method: 'POST',
      body: JSON.stringify(messageData),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.recipientCount).toBe(2);
  });

  it('validates phone number format', async () => {
    const invalidMessage = {
      to: '123', // Too short
      message: 'Test message',
    };

    const request = new NextRequest('http://localhost/api/whatsapp/send', {
      method: 'POST',
      body: JSON.stringify(invalidMessage),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Geçersiz istek');
  });

  it('validates message is required and not empty', async () => {
    const invalidMessage = {
      to: '905551234567',
      message: '', // Empty message
    };

    const request = new NextRequest('http://localhost/api/whatsapp/send', {
      method: 'POST',
      body: JSON.stringify(invalidMessage),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Geçersiz istek');
  });

  it('validates message length', async () => {
    const invalidMessage = {
      to: '905551234567',
      message: 'a'.repeat(5000), // Too long
    };

    const request = new NextRequest('http://localhost/api/whatsapp/send', {
      method: 'POST',
      body: JSON.stringify(invalidMessage),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Geçersiz istek');
  });

  it('requires messages module access', async () => {
    vi.mocked(authUtils.requireModuleAccess).mockRejectedValue(new Error('Access denied'));

    const messageData = {
      to: '905551234567',
      message: 'Test message',
    };

    const request = new NextRequest('http://localhost/api/whatsapp/send', {
      method: 'POST',
      body: JSON.stringify(messageData),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const response = await POST(request);

    expect(response.status).toBeGreaterThanOrEqual(400);
  });

  it('handles send failure', async () => {
    vi.mocked(whatsappService.sendWhatsAppMessage).mockResolvedValue(false);

    const messageData = {
      to: '905551234567',
      message: 'Test message',
    };

    const request = new NextRequest('http://localhost/api/whatsapp/send', {
      method: 'POST',
      body: JSON.stringify(messageData),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toBe('WhatsApp mesajı gönderilemedi');
  });

  it('handles send errors gracefully', async () => {
    vi.mocked(whatsappService.sendWhatsAppMessage).mockRejectedValue(new Error('Service error'));

    const messageData = {
      to: '905551234567',
      message: 'Test message',
    };

    const request = new NextRequest('http://localhost/api/whatsapp/send', {
      method: 'POST',
      body: JSON.stringify(messageData),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toBe('WhatsApp mesajı gönderilemedi');
  });
});
