import apiClient from './api'; // Adjust this path to wherever your api.ts is located

// Define the interface to match your backend exactly
export interface Kalima {
  id: number;
  title: string;
  subtitle: string;
  arabic: string;
  transliteration: string;
  meaning: string;
  youtubeId: string;
}

export const kalimaService = {
  /**
   * Fetches all 6 Kalimas from the backend
   */
  getAllKalimas: async (): Promise<Kalima[]> => {
    try {
      const response = await apiClient.get<Kalima[]>('/api/kalimas');
      return response.data;
    } catch (error) {
      console.error('Error fetching Kalimas:', error);
      throw error;
    }
  },

  /**
   * Fetches a specific Kalima by its ID
   */
  getKalimaById: async (id: number): Promise<Kalima> => {
    try {
      const response = await apiClient.get<Kalima>(`/api/kalimas/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching Kalima with ID ${id}:`, error);
      throw error;
    }
  }
};