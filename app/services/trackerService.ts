import apiClient from './api';

export const fetchAllPrayerLogs = async () => {
  const response = await apiClient.get('/tracker');
  return response.data;
};

export const syncDailyPrayerLog = async (date: string, dailyData: any) => {
  const response = await apiClient.post('/tracker/sync', { date, data: dailyData });
  return response.data;
};