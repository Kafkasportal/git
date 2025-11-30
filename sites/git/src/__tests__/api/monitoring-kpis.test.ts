import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '@/app/api/monitoring/kpis/route';

// Mock Appwrite
vi.mock('@/lib/appwrite/server', () => ({
    serverDatabases: {
        listDocuments: vi.fn().mockResolvedValue({
            total: 10,
            documents: [],
        }),
    },
    getDatabases: vi.fn(() => ({
        listDocuments: vi.fn().mockResolvedValue({
            total: 10,
            documents: [],
        }),
    })),
}));

// Mock config
vi.mock('@/lib/appwrite/config', () => ({
    appwriteConfig: {
        databaseId: 'test-db',
        collections: {
            tasks: 'tasks',
            aidApplications: 'applications',
            meetings: 'meetings',
        },
    },
}));

describe('GET /api/monitoring/kpis', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('returns KPI data successfully', async () => {
        const response = await GET();
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data).toHaveProperty('success', true);
        expect(data.data).toHaveProperty('pendingOperations');
        expect(data.data).toHaveProperty('trackedWorkItems');
        expect(data.data).toHaveProperty('calendarEvents');
        expect(data.data).toHaveProperty('plannedMeetings');
    });

    it('returns numeric values for all KPIs', async () => {
        const response = await GET();
        const data = await response.json();
        const kpis = data.data;

        expect(typeof kpis.pendingOperations.total).toBe('number');
        expect(typeof kpis.trackedWorkItems.total).toBe('number');
        expect(typeof kpis.calendarEvents.total).toBe('number');
        expect(typeof kpis.plannedMeetings.total).toBe('number');
    });
});
