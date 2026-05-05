import apiClient from './api';

export const fetchAllSurahsFromBackend = async () => {
  try {
    const response = await apiClient.get('/quran/surahs');
    return response.data;
  } catch (error) {
    console.error("Error fetching Surah list:", error);
    throw error;
  }
};
export const fetchAyahAudioUrlFromBackend = async (ayahNumber: number) => {
    try {
      const response = await apiClient.get(`/quran/audio/${ayahNumber}`);
      return response.data.url; // Returns the secure string from NestJS
    } catch (error) {
      console.error("Error fetching audio URL from backend:", error);
      throw error;
    }
  };
export const fetchSurahDetailsFromBackend = async (id: string | number, editions?: string) => {
    try {
      const response = await apiClient.get(`/quran/surah/${id}`, {
        params: { editions } // This sends the requested edition to NestJS
      });
      return response.data; 
    } catch (error) {
      console.error("Error fetching Surah details:", error);
      throw error;
    }
  };
  export const fetchAyahDetailsFromBackend = async (surahNumber: number, ayahNumber: number) => {
    try {
      const response = await apiClient.get(`/quran/ayah/${surahNumber}/${ayahNumber}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching Ayah details:", error);
      throw error;
    }
  };
  
  export const fetchAudioUrlForReciterFromBackend = async (reciterId: string, globalAyahNumber: number) => {
    try {
      const response = await apiClient.get(`/quran/audio/${reciterId}/${globalAyahNumber}`);
      return response.data.url; // Returns the clean audio string
    } catch (error) {
      console.error("Error fetching Reciter Audio URL:", error);
      throw error;
    }
  };
export const fetchJuzDetailsFromBackend = async (id: string | number) => {
  try {
    const response = await apiClient.get(`/quran/juz/${id}`);
    return response.data; // Array containing [Arabic, Translation]
  } catch (error) {
    console.error("Error fetching Juz details:", error);
    throw error;
  }
};