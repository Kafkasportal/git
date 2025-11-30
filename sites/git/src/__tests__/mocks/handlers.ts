import { http, HttpResponse } from 'msw';

export const handlers = [
  // CSRF token handler
  http.get('/api/csrf', () => {
    return HttpResponse.json({
      success: true,
      token: 'mock-csrf-token-123',
    });
  }),

  // Auth handlers
  http.post('/api/auth/login', async ({ request }) => {
    const body = (await request.json()) as { email: string; password: string };
    const { email, password } = body;

    if (email === 'admin@test.com' && password === 'admin123') {
      return HttpResponse.json({
        success: true,
        user: {
          _id: 'user-123',
          name: 'Test Admin',
          email: 'admin@test.com',
          role: 'ADMIN',
        },
      });
    }

    return HttpResponse.json({ message: 'Invalid credentials' }, { status: 401 });
  }),

  // Logout handler
  http.post('/api/auth/logout', () => {
    return HttpResponse.json({ success: true });
  }),

  // Beneficiaries handlers
  http.get('/api/beneficiaries', () => {
    return HttpResponse.json({
      data: [
        {
          _id: 'beneficiary-1',
          _creationTime: Date.now(),
          name: 'Ahmet Yılmaz',
          tc_no: '12345678901',
          status: 'active',
        },
      ],
      total: 1,
    });
  }),

  // Dashboard metrics handler
  http.get('/api/donations/stats', () => {
    return HttpResponse.json({
      data: {
        totalBeneficiaries: 150,
        totalDonations: 75,
        totalDonationAmount: 125000,
        activeUsers: 12,
      },
    });
  }),
];
