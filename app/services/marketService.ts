import apiClient from './api';

export interface MarketStats {
  appId: string;
  views: number;
  clicks: number;
}

export const MarketService = {
  getStats: async (appId: string): Promise<MarketStats> => {
    try {
      const response = await apiClient.get<MarketStats>(`/api/market/stats/${appId}`);
      return response.data;
    } catch (error) {
      console.warn(`Failed to fetch stats for appId: ${appId}`, error);
      return { appId, views: 0, clicks: 0 };
    }
  },

  // 🚀 NEW: Added getBatchStats to resolve your TypeScript error
  getBatchStats: async (appIds: string[]): Promise<Record<string, MarketStats>> => {
    try {
      // Fire all requests concurrently for maximum speed
      const promises = appIds.map(id => apiClient.get<MarketStats>(`/api/market/stats/${id}`));
      const responses = await Promise.all(promises);
      
      // Transform the array of responses into a Map dictionary:
      // { "muzz": { views: 10 }, "salams": { views: 5 } }
      const results: Record<string, MarketStats> = {};
      responses.forEach(res => {
        if (res.data && res.data.appId) {
          results[res.data.appId] = res.data;
        }
      });
      
      return results;
    } catch (error) {
      console.warn(`Failed to fetch batch stats`, error);
      return {}; // Return empty object on fail so the UI handles it gracefully
    }
  },

  trackView: async (appId: string): Promise<void> => {
    try {
      await apiClient.post(`/api/market/stats/${appId}/view`);
    } catch (error) {
      console.warn(`Failed to track view for appId: ${appId}`, error);
    }
  },

  trackClick: async (appId: string): Promise<void> => {
    try {
      await apiClient.post(`/api/market/stats/${appId}/click`);
    } catch (error) {
      console.warn(`Failed to track click for appId: ${appId}`, error);
    }
  }
};