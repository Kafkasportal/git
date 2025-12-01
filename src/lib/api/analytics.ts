import { ConvexResponse } from '@/types/database';
import { fetchWithCsrf } from '@/lib/csrf-client';

export const analyticsApi = {
  trackEvent: async (data: {
    event: string;
    properties?: Record<string, unknown>;
    userId?: string;
    sessionId?: string;
  }): Promise<ConvexResponse<any>> => {
    const response = await fetchWithCsrf('/api/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await response.json();
    return result;
  },
  getStats: async (params?: { limit?: number }): Promise<ConvexResponse<any>> => {
    const searchParams = new URLSearchParams();
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    const response = await fetch(`/api/analytics?${searchParams.toString()}`);
    const data = await response.json();
    return data;
  },
};
