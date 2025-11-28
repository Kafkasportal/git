import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '@/app/api/monitoring/kpis/route';

// Mock Appwrite
vi.mock('@/lib/appwrite/server', () => ({
    getDatabases: vi.fn(() => ({
        listDocuments: vi.fn().mockResolvedValue({
            total: 10,
            documents: [],
        }),
    })),
}));

// Mock session
vi.mock('@/lib/session', () => ({
    getSession: vi.fn().mockResolvedValue({
        user: { id: 'test-user', email: 'test@example.com' },
    }),
}));

describe('GET /api/monitoring/kpis', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('returns KPI data successfully', async () => {
        const response = await GET();
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data).toHaveProperty('pendingTasks');
        expect(data).toHaveProperty('upcomingMeetings');
        expect(data).toHaveProperty('activeBeneficiaries');
        expect(data).toHaveProperty('monthlyDonations');
    });

    it('returns numeric values for all KPIs', async () => {
        const response = await GET();
        const data = await response.json();

        expect(typeof data.pendingTasks).toBe('number');
        expect(typeof data.upcomingMeetings).toBe('number');
        expect(typeof data.activeBeneficiaries).toBe('number');
        expect(typeof data.monthlyDonations).toBe('number');
    });
});
