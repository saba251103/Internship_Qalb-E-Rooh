import apiClient from './api';

export const fetchSavedDuasFromBackend = async () => {
  try {
    const response = await apiClient.get('/users/favorites/duas');
    return response.data; // Returns array of string IDs: ['dua-1', 'dua-5']
  } catch (error) {
    console.error("Error fetching saved duas:", error);
    throw error;
  }
};

export const syncDuaToggleWithBackend = async (duaId: string) => {
  try {
    const response = await apiClient.post('/users/favorites/duas/toggle', { duaId });
    return response.data;
  } catch (error) {
    console.error("Error syncing dua:", error);
    throw error;
  } 
};