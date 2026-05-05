import apiClient from './api';

export const fetchMakkahStreams = async () => {
  try {
    const res = await apiClient.get('/api/streams/makkah');
    if (res.data && res.data.videoIds && res.data.videoIds.length > 0) {
      return res.data.videoIds; 
    }
    return ['Eoit4fgJPOA', 'H5D7gPbnLrY']; // Working Fallbacks
  } catch (error) {
    console.error("Error fetching Makkah streams:", error);
    // 🟢 Make absolutely sure this line is updated! Do not use Cm1v4bteXbI here.
    return ['Eoit4fgJPOA', 'H5D7gPbnLrY']; 
  }
};