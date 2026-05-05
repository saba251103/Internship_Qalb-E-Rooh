import apiClient from './api';

// ✅ Save last read
export const saveLastRead = async (data: any) => {
  const response = await apiClient.post('/users/last-read', data);
  return response.data;
};

// ✅ Fetch last read
export const fetchLastRead = async () => {
    const res = await apiClient.get('/users/last-read');
    return res.data; // NOT res.data.lastReadSurah
  };
