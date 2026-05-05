import apiClient from './api';

// Notice the addition of "school: number" right here!
export const fetchTimingsFromBackend = async (city: string, country: string, school: number) => {
  try {
    const response = await apiClient.get('/prayer/timings', {
      params: { city, country, school }, // Passing all 3 parameters to NestJS
    });
    return response.data; 
  } catch (error: any) {
    console.error("Prayer Fetch Error:", error.response?.data || error.message);
    throw error;
  }
};