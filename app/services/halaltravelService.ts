import apiClient from './api';

export interface HalalTravelStats {
  appId: string;
  views: number;
  clicks: number;
}

export const HalalTravelService = {
  getStats: async (appId: string): Promise<HalalTravelStats> => {
    try {
      const response = await apiClient.get<HalalTravelStats>(`/api/halal-travel/stats/${appId}`);
      return response.data;
    } catch (error) {
      console.warn(`Failed to fetch stats for appId: ${appId}`, error);
      return { appId, views: 0, clicks: 0 };
    }
  },

  // 🚀 Fetches all stats concurrently for maximum UI performance
  getBatchStats: async (appIds: string[]): Promise<Record<string, HalalTravelStats>> => {
    try {
      const promises = appIds.map(id => apiClient.get<HalalTravelStats>(`/api/halal-travel/stats/${id}`));
      const responses = await Promise.all(promises);
      
      // Transform the array of responses into a dictionary:
      // { "halalbooking": { views: 120 }, "tripfez": { views: 85 } }
      const results: Record<string, HalalTravelStats> = {};
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
      await apiClient.post(`/api/halal-travel/stats/${appId}/view`);
    } catch (error) {
      console.warn(`Failed to track view for appId: ${appId}`, error);
    }
  },

  trackClick: async (appId: string): Promise<void> => {
    try {
      await apiClient.post(`/api/halal-travel/stats/${appId}/click`);
    } catch (error) {
      console.warn(`Failed to track click for appId: ${appId}`, error);
    }
  }
};