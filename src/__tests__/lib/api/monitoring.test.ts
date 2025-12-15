/**
 * Monitoring API Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { monitoringApi } from '@/lib/api/monitoring';

describe('monitoringApi', () => {
    let fetchSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
        vi.clearAllMocks();
        fetchSpy = vi.spyOn(global, 'fetch');
    });

    afterEach(() => {
        fetchSpy.mockRestore();
    });

    describe('getEnhancedKPIs', () => {
        it('should fetch KPIs from API', async () => {
            const mockKPIs = {
                success: true,
                data: {
                    totalDonations: 50000,
                    activeBeneficiaries: 150,
                    pendingApplications: 25,
                },
            };

            fetchSpy.mockResolvedValue(
                new Response(JSON.stringify(mockKPIs), { status: 200 })
            );

            const result = await monitoringApi.getEnhancedKPIs();

            expect(fetchSpy).toHaveBeenCalledWith('/api/monitoring/kpis');
            const typedResult = result as unknown as { success: boolean; data: { totalDonations: number } };
            expect(typedResult.success).toBe(true);
            expect(typedResult.data.totalDonations).toBe(50000);
        });

        it('should handle API errors', async () => {
            fetchSpy.mockResolvedValue(
                new Response(JSON.stringify({ success: false, error: 'Server error' }), { status: 500 })
            );

            const result = await monitoringApi.getEnhancedKPIs();

            expect((result as unknown as { success: boolean }).success).toBe(false);
        });
    });

    describe('getDashboardStats', () => {
        it('should fetch dashboard stats from API', async () => {
            const mockStats = {
                success: true,
                data: {
                    recentDonations: [],
                    upcomingMeetings: [],
                    pendingTasks: 10,
                },
            };

            fetchSpy.mockResolvedValue(
                new Response(JSON.stringify(mockStats), { status: 200 })
            );

            const result = await monitoringApi.getDashboardStats();

            expect(fetchSpy).toHaveBeenCalledWith('/api/monitoring/stats');
            expect((result as unknown as { success: boolean }).success).toBe(true);
        });
    });

    describe('getCurrencyRates', () => {
        it('should fetch currency rates from API', async () => {
            const mockRates = {
                success: true,
                data: {
                    USD: 32.5,
                    EUR: 35.2,
                    GBP: 41.0,
                },
            };

            fetchSpy.mockResolvedValue(
                new Response(JSON.stringify(mockRates), { status: 200 })
            );

            const result = await monitoringApi.getCurrencyRates();

            expect(fetchSpy).toHaveBeenCalledWith('/api/monitoring/currency');
            const typedResult = result as unknown as { success: boolean; data: { USD: number } };
            expect(typedResult.success).toBe(true);
            expect(typedResult.data.USD).toBe(32.5);
        });
    });
});
