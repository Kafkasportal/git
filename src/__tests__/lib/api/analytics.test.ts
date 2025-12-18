/**
 * Analytics API Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { analyticsApi } from '@/lib/api/analytics';

// Mock fetchWithCsrf
vi.mock('@/lib/csrf-client', () => ({
    fetchWithCsrf: vi.fn(),
}));

import { fetchWithCsrf } from '@/lib/csrf-client';

describe('analyticsApi', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let fetchSpy: any;

    beforeEach(() => {
        vi.clearAllMocks();
        fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue(
            new Response(JSON.stringify({ success: true, data: [] }), { status: 200 })
        );
    });

    afterEach(() => {
        fetchSpy.mockRestore();
    });

    describe('trackEvent', () => {
        it('should track event with all parameters', async () => {
            vi.mocked(fetchWithCsrf).mockResolvedValue(
                new Response(JSON.stringify({ success: true }), { status: 200 })
            );

            const result = await analyticsApi.trackEvent({
                event: 'page_view',
                properties: { page: '/dashboard' },
                userId: 'user-123',
                sessionId: 'session-456',
            });

            expect(fetchWithCsrf).toHaveBeenCalledWith('/api/analytics', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    event: 'page_view',
                    properties: { page: '/dashboard' },
                    userId: 'user-123',
                    sessionId: 'session-456',
                }),
            });
            expect((result as unknown as { success: boolean }).success).toBe(true);
        });

        it('should track event with minimal parameters', async () => {
            vi.mocked(fetchWithCsrf).mockResolvedValue(
                new Response(JSON.stringify({ success: true }), { status: 200 })
            );

            const result = await analyticsApi.trackEvent({
                event: 'button_click',
            });

            expect(fetchWithCsrf).toHaveBeenCalledWith('/api/analytics', expect.objectContaining({
                method: 'POST',
            }));
            expect((result as unknown as { success: boolean }).success).toBe(true);
        });
    });

    describe('getStats', () => {
        it('should get stats without parameters', async () => {
            fetchSpy.mockResolvedValue(
                new Response(JSON.stringify({ success: true, data: { views: 100 } }), { status: 200 })
            );

            const result = await analyticsApi.getStats();

            expect(fetchSpy).toHaveBeenCalledWith('/api/analytics?');
            expect((result as unknown as { success: boolean }).success).toBe(true);
        });

        it('should get stats with limit parameter', async () => {
            fetchSpy.mockResolvedValue(
                new Response(JSON.stringify({ success: true, data: [] }), { status: 200 })
            );

            const result = await analyticsApi.getStats({ limit: 10 });

            expect(fetchSpy).toHaveBeenCalledWith('/api/analytics?limit=10');
            expect((result as unknown as { success: boolean }).success).toBe(true);
        });
    });
});
