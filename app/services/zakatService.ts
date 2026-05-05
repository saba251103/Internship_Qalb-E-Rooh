import apiClient from './api';

export const fetchZakatHistory = async () => {
  const response = await apiClient.get('/zakat/history');
  return response.data;
};

export const syncZakatRecord = async (record: any) => {
  const response = await apiClient.post('/zakat/save', record);
  return response.data;
};

export const deleteZakatRecordFromServer = async (id: string) => {
  const response = await apiClient.delete(`/zakat/${id}`);
  return response.data;
};