import { ConvexResponse } from '@/types/database';

export const monitoringApi = {
  getEnhancedKPIs: async (): Promise<ConvexResponse<any>> => {
    const response = await fetch('/api/monitoring/kpis');
    const data = await response.json();
    return data;
  },
  getDashboardStats: async (): Promise<ConvexResponse<any>> => {
    const response = await fetch('/api/monitoring/stats');
    const data = await response.json();
    return data;
  },
  getCurrencyRates: async (): Promise<ConvexResponse<any>> => {
    const response = await fetch('/api/monitoring/currency');
    const data = await response.json();
    return data;
  },
};
