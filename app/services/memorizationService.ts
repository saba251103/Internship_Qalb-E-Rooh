import apiClient from './api';

// ✅ Get full memorization data (all 3 dictionaries)
export const fetchMemorization = async () => {
  try {
    const response = await apiClient.get('/memorization');
    return response.data;
  } catch (error) {
    console.error('Error fetching memorization:', error);
    throw error;
  }
};

// ✅ Update status (memorized / needs_practice / not_memorized)
export const updateMemorizationStatus = async (
  surahId: string,
  ayahNum: number,
  status: 'memorized' | 'needs_practice' 
) => {
  try {
    const response = await apiClient.post('/memorization/update', {
      surahId,
      ayahNum,
      status,
    });
    return response.data;
  } catch (error) {
    console.error('Error updating memorization:', error);
    throw error;
  }
};

// ✅ Reset a single ayah (remove from all → becomes not_memorized)
export const resetMemorization = async (
  surahId: string,
  ayahNum: number
) => {
  try {
    const response = await apiClient.delete('/memorization/reset', {
      data: { surahId, ayahNum }, // ⚠️ axios delete needs data like this
    });
    return response.data;
  } catch (error) {
    console.error('Error resetting memorization:', error);
    throw error;
  }
};

// ✅ Clear ALL memorization data
export const clearAllMemorization = async () => {
  try {
    const response = await apiClient.delete('/memorization/all');
    return response.data;
  } catch (error) {
    console.error('Error clearing memorization:', error);
    throw error;
  }
};