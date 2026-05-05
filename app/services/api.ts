import axios from 'axios';

// Use your IP address here!
const BASE_URL = 'http://192.168.29.12:3000'; 

const apiClient = axios.create({
    baseURL: BASE_URL,
    timeout: 10000, // 10 seconds timeout so it doesn't hang forever
    headers: {
      'Content-Type': 'application/json',
    },
  });
  
  // THIS is the missing function! It attaches the token to your requests.
  export const setAuthToken = (token: string | null) => {
    if (token) {
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete apiClient.defaults.headers.common['Authorization'];
    }
  };
  
  export default apiClient;