import apiClient from './api';

export const fetchNearbyMosquesFromBackend = async (lat: number, lng: number) => {
  try {
    const response = await apiClient.get('/mosques/nearby', {
      params: { lat, lng }
    });
    return response.data; // This is the clean array from NestJS
  } catch (error) {
    console.error("Error fetching mosques from backend:", error);
    throw error;
  }
};