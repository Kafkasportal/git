import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, PUT, DELETE, POST } from '@/app/api/messages/[id]/route';
import { NextRequest } from 'next/server';
import * as appwriteApi from '@/lib/appwrite/api';

// Mock Appwrite API
vi.mock('@/lib/appwrite/api', () => ({
  appwriteMessages: {
    get: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  },
  appwriteUsers: {
    get: vi.fn(),
  },
}));

// Mock route helpers
vi.mock('@/lib/api/route-helpers', () => ({
  extractParams: vi.fn(async (params) => {
    const resolved = await params;
    return resolved;
  }),
}));

// Mock sanitization
vi.mock('@/lib/sanitization', () => ({
  sanitizePhone: vi.fn((phone) => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.startsWith('0')) {
      return cleaned.substring(1);
    }
    if (cleaned.startsWith('90')) {
      return cleaned.substring(2);
    }
    return cleaned;
  }),
}));

// Mock services
vi.mock('@/lib/services/sms', () => ({
  sendBulkSMS: vi.fn().mockResolvedValue({
    success: true,
    failed: 0,
  }),
}));

vi.mock('@/lib/services/email', () => ({
  sendBulkEmails: vi.fn().mockResolvedValue({
    success: true,
    failed: 0,
  }),
}));

// Mock logger
vi.mock('@/lib/logger', () => ({
  default: {
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

describe('GET /api/messages/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns message by ID successfully', async () => {
    const mockMessage = {
      _id: 'test-id',
      message_type: 'internal',
      sender: 'user1',
      recipients: ['user2'],
      content: 'Test message',
      status: 'sent',
      is_bulk: false,
    };

    vi.mocked(appwriteApi.appwriteMessages.get).mockResolvedValue(mockMessage);

    const request = new NextRequest('http://localhost/api/messages/test-id');
    const params = Promise.resolve({ id: 'test-id' });
    const response = await GET(request, { params });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toEqual(mockMessage);
  });

  it('returns 404 when message not found', async () => {
    vi.mocked(appwriteApi.appwriteMessages.get).mockResolvedValue(null);

    const request = new NextRequest('http://localhost/api/messages/non-existent');
    const params = Promise.resolve({ id: 'non-existent' });
    const response = await GET(request, { params });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Mesaj bulunamadı');
  });

  it('handles errors gracefully', async () => {
    vi.mocked(appwriteApi.appwriteMessages.get).mockRejectedValue(new Error('Database error'));

    const request = new NextRequest('http://localhost/api/messages/test-id');
    const params = Promise.resolve({ id: 'test-id' });
    const response = await GET(request, { params });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
  });
});

describe('PUT /api/messages/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('updates message successfully', async () => {
    const updateData = {
      content: 'Updated content',
      status: 'sent',
    };

    const updatedMessage = {
      _id: 'test-id',
      message_type: 'internal',
      content: 'Updated content',
      status: 'sent',
    };

    vi.mocked(appwriteApi.appwriteMessages.update).mockResolvedValue(updatedMessage as any);

    const request = new NextRequest('http://localhost/api/messages/test-id', {
      method: 'PUT',
      body: JSON.stringify(updateData),
      headers: {
        'Content-Type': 'application/json',
      },
    });
    const params = Promise.resolve({ id: 'test-id' });
    const response = await PUT(request, { params });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toEqual(updatedMessage);
    expect(data.message).toBe('Mesaj başarıyla güncellendi');
  });

  it('validates update data', async () => {
    const invalidUpdate = {
      content: 'AB', // Too short
    };

    const request = new NextRequest('http://localhost/api/messages/test-id', {
      method: 'PUT',
      body: JSON.stringify(invalidUpdate),
      headers: {
        'Content-Type': 'application/json',
      },
    });
    const params = Promise.resolve({ id: 'test-id' });
    const response = await PUT(request, { params });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Doğrulama hatası');
  });

  it('validates message_type values', async () => {
    const invalidUpdate = {
      message_type: 'INVALID',
    };

    const request = new NextRequest('http://localhost/api/messages/test-id', {
      method: 'PUT',
      body: JSON.stringify(invalidUpdate),
      headers: {
        'Content-Type': 'application/json',
      },
    });
    const params = Promise.resolve({ id: 'test-id' });
    const response = await PUT(request, { params });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
  });

  it('validates status values', async () => {
    const invalidUpdate = {
      status: 'INVALID',
    };

    const request = new NextRequest('http://localhost/api/messages/test-id', {
      method: 'PUT',
      body: JSON.stringify(invalidUpdate),
      headers: {
        'Content-Type': 'application/json',
      },
    });
    const params = Promise.resolve({ id: 'test-id' });
    const response = await PUT(request, { params });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
  });

  it('returns 404 when message not found', async () => {
    vi.mocked(appwriteApi.appwriteMessages.update).mockRejectedValue(
      new Error('Document not found')
    );

    const updateData = {
      content: 'Updated content',
    };

    const request = new NextRequest('http://localhost/api/messages/non-existent', {
      method: 'PUT',
      body: JSON.stringify(updateData),
      headers: {
        'Content-Type': 'application/json',
      },
    });
    const params = Promise.resolve({ id: 'non-existent' });
    const response = await PUT(request, { params });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.success).toBe(false);
  });

  it('handles update errors gracefully', async () => {
    vi.mocked(appwriteApi.appwriteMessages.update).mockRejectedValue(new Error('Database error'));

    const updateData = {
      content: 'Updated content',
    };

    const request = new NextRequest('http://localhost/api/messages/test-id', {
      method: 'PUT',
      body: JSON.stringify(updateData),
      headers: {
        'Content-Type': 'application/json',
      },
    });
    const params = Promise.resolve({ id: 'test-id' });
    const response = await PUT(request, { params });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
  });
});

describe('DELETE /api/messages/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deletes message successfully', async () => {
    vi.mocked(appwriteApi.appwriteMessages.remove).mockResolvedValue(undefined);

    const request = new NextRequest('http://localhost/api/messages/test-id', {
      method: 'DELETE',
    });
    const params = Promise.resolve({ id: 'test-id' });
    const response = await DELETE(request, { params });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toBe('Mesaj başarıyla silindi');
    expect(vi.mocked(appwriteApi.appwriteMessages.remove)).toHaveBeenCalledWith('test-id');
  });

  it('returns 404 when message not found', async () => {
    vi.mocked(appwriteApi.appwriteMessages.remove).mockRejectedValue(
      new Error('Document not found')
    );

    const request = new NextRequest('http://localhost/api/messages/non-existent', {
      method: 'DELETE',
    });
    const params = Promise.resolve({ id: 'non-existent' });
    const response = await DELETE(request, { params });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.success).toBe(false);
  });

  it('handles delete errors gracefully', async () => {
    vi.mocked(appwriteApi.appwriteMessages.remove).mockRejectedValue(new Error('Database error'));

    const request = new NextRequest('http://localhost/api/messages/test-id', {
      method: 'DELETE',
    });
    const params = Promise.resolve({ id: 'test-id' });
    const response = await DELETE(request, { params });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
  });
});

describe('POST /api/messages/[id]/send', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('sends internal message successfully', async () => {
    const mockMessage = {
      _id: 'test-id',
      message_type: 'internal',
      recipients: ['user2'],
      content: 'Test message',
      status: 'draft',
    };

    vi.mocked(appwriteApi.appwriteMessages.get).mockResolvedValue(mockMessage as any);
    vi.mocked(appwriteApi.appwriteMessages.update).mockResolvedValue({
      ...mockMessage,
      status: 'sent',
      sent_at: new Date().toISOString(),
    } as any);

    const request = new NextRequest('http://localhost/api/messages/test-id/send', {
      method: 'POST',
    });
    const params = Promise.resolve({ id: 'test-id' });
    const response = await POST(request, { params });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toBe('Mesaj gönderildi');
  });

  it('returns error for SMS message (SMS disabled)', async () => {
    const mockMessage = {
      _id: 'test-id',
      message_type: 'sms',
      recipients: ['user1'],
      content: 'SMS content',
      status: 'draft',
    };

    const mockUser = {
      _id: 'user1',
      phone: '5551234567',
    };

    vi.mocked(appwriteApi.appwriteMessages.get).mockResolvedValue(mockMessage as any);
    vi.mocked(appwriteApi.appwriteUsers.get).mockResolvedValue(mockUser as any);

    const request = new NextRequest('http://localhost/api/messages/test-id/send', {
      method: 'POST',
    });
    const params = Promise.resolve({ id: 'test-id' });
    const response = await POST(request, { params });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toBe('SMS gönderimi şu anda devre dışı');
  });

  it('sends email message successfully', async () => {
    const mockMessage = {
      _id: 'test-id',
      message_type: 'email',
      recipients: ['user1'],
      content: 'Email content',
      subject: 'Test Subject',
      status: 'draft',
    };

    const mockUser = {
      _id: 'user1',
      email: 'test@example.com',
    };

    vi.mocked(appwriteApi.appwriteMessages.get).mockResolvedValue(mockMessage as any);
    vi.mocked(appwriteApi.appwriteUsers.get).mockResolvedValue(mockUser as any);
    vi.mocked(appwriteApi.appwriteMessages.update).mockResolvedValue({
      ...mockMessage,
      status: 'sent',
    } as any);

    const request = new NextRequest('http://localhost/api/messages/test-id/send', {
      method: 'POST',
    });
    const params = Promise.resolve({ id: 'test-id' });
    const response = await POST(request, { params });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });

  it('returns 404 when message not found', async () => {
    vi.mocked(appwriteApi.appwriteMessages.get).mockResolvedValue(null);

    const request = new NextRequest('http://localhost/api/messages/non-existent/send', {
      method: 'POST',
    });
    const params = Promise.resolve({ id: 'non-existent' });
    const response = await POST(request, { params });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Mesaj bulunamadı');
  });

  it('handles send errors gracefully', async () => {
    vi.mocked(appwriteApi.appwriteMessages.get).mockRejectedValue(new Error('Database error'));

    const request = new NextRequest('http://localhost/api/messages/test-id/send', {
      method: 'POST',
    });
    const params = Promise.resolve({ id: 'test-id' });
    const response = await POST(request, { params });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
  });
});
