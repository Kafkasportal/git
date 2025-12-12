import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockDocuments, createMockAuthResponse } from '../test-utils';
import { GET, POST } from '@/app/api/messages/route';
import { NextRequest } from 'next/server';
import * as appwriteApi from '@/lib/appwrite/api';
import * as authUtils from '@/lib/api/auth-utils';

// Mock Appwrite API
vi.mock('@/lib/appwrite/api', () => ({
  appwriteMessages: {
    list: vi.fn(),
    create: vi.fn(),
  },
  normalizeQueryParams: vi.fn((params) => ({
    page: params.get('page') ? parseInt(params.get('page')!) : 1,
    limit: params.get('limit') ? parseInt(params.get('limit')!) : 50,
  })),
}));

// Mock auth
vi.mock('@/lib/api/auth-utils', () => ({
  requireModuleAccess: vi.fn().mockResolvedValue({
    session: { sessionId: 'test-session', userId: 'test-user-id' },
    user: { id: 'test-user', email: 'test@example.com', name: 'Test User', isActive: true, permissions: [] },
  }),
  verifyCsrfToken: vi.fn().mockResolvedValue(undefined),
  buildErrorResponse: vi.fn().mockReturnValue(null),
}));

// Mock logger
vi.mock('@/lib/logger', () => ({
  default: {
    error: vi.fn(),
  },
}));

describe('GET /api/messages', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns messages list successfully', async () => {
    const mockMessagesData = [
      {
        _id: '1',
        message_type: 'internal',
        sender: 'user1',
        recipients: ['user2'],
        content: 'Test message',
        status: 'sent',
        is_bulk: false,
      },
      {
        _id: '2',
        message_type: 'email',
        sender: 'user1',
        recipients: ['user3'],
        content: 'Test email',
        status: 'draft',
        is_bulk: false,
      },
    ];
    const mockMessages = createMockDocuments(mockMessagesData);

    vi.mocked(appwriteApi.appwriteMessages.list).mockResolvedValue({
      documents: mockMessages,
      total: 2,
    });

    const request = new NextRequest('http://localhost/api/messages');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toEqual(mockMessages);
    expect(data.total).toBe(2);
  });

  it('filters by inbox tab', async () => {
    const mockMessages = createMockDocuments([
      {
        _id: '1',
        message_type: 'internal',
        recipient: 'test-user',
        content: 'Inbox message',
      },
    ]);

    vi.mocked(appwriteApi.appwriteMessages.list).mockResolvedValue({
      documents: mockMessages,
      total: 1,
    });

    const request = new NextRequest('http://localhost/api/messages?tab=inbox');
    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(vi.mocked(appwriteApi.appwriteMessages.list)).toHaveBeenCalledWith(
      expect.objectContaining({
        recipient: 'test-user',
        message_type: 'internal',
      })
    );
  });

  it('filters by sent tab', async () => {
    const mockMessages = createMockDocuments([
      {
        _id: '1',
        message_type: 'internal',
        sender: 'test-user',
        content: 'Sent message',
      },
    ]);

    vi.mocked(appwriteApi.appwriteMessages.list).mockResolvedValue({
      documents: mockMessages,
      total: 1,
    });

    const request = new NextRequest('http://localhost/api/messages?tab=sent');
    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(vi.mocked(appwriteApi.appwriteMessages.list)).toHaveBeenCalledWith(
      expect.objectContaining({
        sender: 'test-user',
        message_type: 'internal',
      })
    );
  });

  it('filters by drafts tab', async () => {
    const mockMessages = createMockDocuments([
      {
        _id: '1',
        message_type: 'internal',
        sender: 'test-user',
        status: 'draft',
        content: 'Draft message',
      },
    ]);

    vi.mocked(appwriteApi.appwriteMessages.list).mockResolvedValue({
      documents: mockMessages,
      total: 1,
    });

    const request = new NextRequest('http://localhost/api/messages?tab=drafts');
    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(vi.mocked(appwriteApi.appwriteMessages.list)).toHaveBeenCalledWith(
      expect.objectContaining({
        sender: 'test-user',
        status: 'draft',
        message_type: 'internal',
      })
    );
  });

  it('filters by message_type', async () => {
    const mockMessages = createMockDocuments([
      {
        _id: '1',
        message_type: 'sms',
        content: 'SMS message',
      },
    ]);

    vi.mocked(appwriteApi.appwriteMessages.list).mockResolvedValue({
      documents: mockMessages,
      total: 1,
    });

    const request = new NextRequest('http://localhost/api/messages?message_type=sms');
    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(vi.mocked(appwriteApi.appwriteMessages.list)).toHaveBeenCalledWith(
      expect.objectContaining({
        message_type: 'sms',
      })
    );
  });

  it('returns 403 when user tries to access other users messages without permission', async () => {
    const request = new NextRequest('http://localhost/api/messages?sender=other-user');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.success).toBe(false);
    expect(data.error).toContain('erişim yetkiniz bulunmuyor');
  });

  it('allows admin users to view all messages', async () => {
    vi.mocked(authUtils.requireModuleAccess).mockResolvedValueOnce(
      createMockAuthResponse({ id: 'admin-user', permissions: ['users:manage'] as unknown })
    );

    const mockMessages = createMockDocuments([
      {
        _id: '1',
        sender: 'other-user',
        content: 'Admin can see this',
      },
    ]);

    vi.mocked(appwriteApi.appwriteMessages.list).mockResolvedValue({
      documents: mockMessages,
      total: 1,
    });

    const request = new NextRequest('http://localhost/api/messages?sender=other-user');
    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(vi.mocked(appwriteApi.appwriteMessages.list)).toHaveBeenCalled();
  });

  it('handles pagination', async () => {
    vi.mocked(appwriteApi.appwriteMessages.list).mockResolvedValue({
      documents: [],
      total: 0,
    });

    const request = new NextRequest('http://localhost/api/messages?page=2&limit=20');
    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(vi.mocked(appwriteApi.appwriteMessages.list)).toHaveBeenCalled();
  });

  it('handles empty list', async () => {
    vi.mocked(appwriteApi.appwriteMessages.list).mockResolvedValue({
      documents: [],
      total: 0,
    });

    const request = new NextRequest('http://localhost/api/messages');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data).toEqual([]);
    expect(data.total).toBe(0);
  });

  it('handles errors gracefully', async () => {
    vi.mocked(appwriteApi.appwriteMessages.list).mockRejectedValue(new Error('Database error'));

    const request = new NextRequest('http://localhost/api/messages');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Veri alınamadı');
  });
});

describe('POST /api/messages', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates message successfully', async () => {
    const newMessage = {
      message_type: 'internal',
      recipients: ['user2'],
      content: 'Test message content',
      subject: 'Test Subject',
    };

    const createdMessage = {
      _id: 'new-id',
      ...newMessage,
      sender: 'test-user',
      status: 'draft',
      is_bulk: false,
    };

    vi.mocked(appwriteApi.appwriteMessages.create).mockResolvedValue(createdMessage as unknown);

    const request = new NextRequest('http://localhost/api/messages', {
      method: 'POST',
      body: JSON.stringify(newMessage),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.data).toEqual(createdMessage);
    expect(data.message).toBe('Mesaj taslağı oluşturuldu');
  });

  it('validates message_type is required and valid', async () => {
    const invalidMessage = {
      message_type: 'INVALID', // Invalid type
      recipients: ['user2'],
      content: 'Test content',
    };

    const request = new NextRequest('http://localhost/api/messages', {
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
    expect(data.error).toBe('Doğrulama hatası');
    expect(data.details).toContain('Geçersiz mesaj türü');
  });

  it('validates recipients array is required and not empty', async () => {
    const invalidMessage = {
      message_type: 'internal',
      recipients: [], // Empty array
      content: 'Test content',
    };

    const request = new NextRequest('http://localhost/api/messages', {
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
    expect(data.details).toContain('En az bir alıcı seçilmelidir');
  });

  it('validates content is required and minimum length', async () => {
    const invalidMessage = {
      message_type: 'internal',
      recipients: ['user2'],
      content: 'AB', // Too short (less than 3 characters)
    };

    const request = new NextRequest('http://localhost/api/messages', {
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
    expect(data.details).toContain('İçerik en az 3 karakter olmalıdır');
  });

  it('sets default status to draft', async () => {
    const newMessage = {
      message_type: 'internal',
      recipients: ['user2'],
      content: 'Test message',
    };

    const createdMessage = {
      _id: 'new-id',
      ...newMessage,
      sender: 'test-user',
      status: 'draft',
      is_bulk: false,
    };

    vi.mocked(appwriteApi.appwriteMessages.create).mockResolvedValue(createdMessage as unknown);

    const request = new NextRequest('http://localhost/api/messages', {
      method: 'POST',
      body: JSON.stringify(newMessage),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
  });

  it('returns 403 when non-admin tries to create bulk message', async () => {
    const bulkMessage = {
      message_type: 'internal',
      recipients: ['user2', 'user3'],
      content: 'Bulk message',
      is_bulk: true,
    };

    const request = new NextRequest('http://localhost/api/messages', {
      method: 'POST',
      body: JSON.stringify(bulkMessage),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.success).toBe(false);
    expect(data.error).toContain('Toplu mesaj göndermek için yetkiniz bulunmuyor');
  });

  it('allows admin users to create bulk messages', async () => {
    vi.mocked(authUtils.requireModuleAccess).mockResolvedValueOnce(
      createMockAuthResponse({ id: 'admin-user', permissions: ['users:manage'] as unknown })
    );

    const bulkMessage = {
      message_type: 'internal',
      recipients: ['user2', 'user3'],
      content: 'Bulk message',
      is_bulk: true,
    };

    const createdMessage = {
      _id: 'new-id',
      ...bulkMessage,
      sender: 'admin-user',
      status: 'draft',
    };

    vi.mocked(appwriteApi.appwriteMessages.create).mockResolvedValue(createdMessage as unknown);

    const request = new NextRequest('http://localhost/api/messages', {
      method: 'POST',
      body: JSON.stringify(bulkMessage),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
  });

  it('handles creation errors gracefully', async () => {
    vi.mocked(appwriteApi.appwriteMessages.create).mockRejectedValue(new Error('Database error'));

    const validMessage = {
      message_type: 'internal',
      recipients: ['user2'],
      content: 'Valid message',
    };

    const request = new NextRequest('http://localhost/api/messages', {
      method: 'POST',
      body: JSON.stringify(validMessage),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Oluşturma işlemi başarısız');
  });
});
