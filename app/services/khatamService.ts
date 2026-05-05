import apiClient from './api';

export const fetchKhatamPlanFromBackend = async () => {
  try {
    const response = await apiClient.get('/users/khatam');
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const syncKhatamPlanWithBackend = async (planData: any) => {
  try {
    const response = await apiClient.post('/users/khatam', planData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const deleteKhatamPlanFromBackend = async () => {
  try {
    const response = await apiClient.delete('/users/khatam');
    return response.data;
  } catch (error) {
    throw error;
  }
};