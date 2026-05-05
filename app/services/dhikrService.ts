import apiClient from './api';

// ✅ GET HISTORY
export const fetchDhikrHistory = async () => {
  const response = await apiClient.get('/dhikr/history');
  return response.data; // returns sessions[]
};

// ✅ SAVE / UPDATE SESSION
export const saveDhikrSession = async (session: any) => {
  const response = await apiClient.post('/dhikr/save', session);
  return response.data;
};

// ✅ DELETE ONE
export const deleteDhikrSession = async (sessionId: string) => {
  const response = await apiClient.delete(`/dhikr/${sessionId}`);
  return response.data;
};

// ✅ CLEAR ALL
export const clearAllDhikrSessions = async () => {
  const response = await apiClient.delete('/dhikr');
  return response.data;
};

// ✅ STATS (optional)
export const fetchDhikrStats = async () => {
  const response = await apiClient.get('/dhikr/stats');
  return response.data;
};