import apiClient from './api';

export interface PilgrimageStats {
  appId: string;
  views: number;
  clicks: number;
}

export const PilgrimageService = {
  getStats: async (appId: string): Promise<PilgrimageStats> => {
    try {
      const response = await apiClient.get<PilgrimageStats>(`/api/pilgrimage/stats/${appId}`);
      return response.data;
    } catch (error) {
      console.warn(`Failed to fetch stats for appId: ${appId}`, error);
      return { appId, views: 0, clicks: 0 };
    }
  },

  // 🚀 getBatchStats fires all requests concurrently for maximum speed
  getBatchStats: async (appIds: string[]): Promise<Record<string, PilgrimageStats>> => {
    try {
      const promises = appIds.map(id => apiClient.get<PilgrimageStats>(`/api/pilgrimage/stats/${id}`));
      const responses = await Promise.all(promises);
      
      // Transform the array of responses into a Map dictionary:
      // { "haj-committee": { views: 10 }, "nusuk": { views: 5 } }
      const results: Record<string, PilgrimageStats> = {};
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
      await apiClient.post(`/api/pilgrimage/stats/${appId}/view`);
    } catch (error) {
      console.warn(`Failed to track view for appId: ${appId}`, error);
    }
  },

  trackClick: async (appId: string): Promise<void> => {
    try {
      await apiClient.post(`/api/pilgrimage/stats/${appId}/click`);
    } catch (error) {
      console.warn(`Failed to track click for appId: ${appId}`, error);
    }
  }
};