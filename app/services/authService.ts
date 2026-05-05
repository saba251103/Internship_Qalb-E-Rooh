import * as SecureStore from 'expo-secure-store';
import apiClient, { setAuthToken } from './api';

const TOKEN_KEY = 'qalb_e_rooh_jwt';

export const loginUser = async (email: string, password: string) => {
  try {
    const response = await apiClient.post('/auth/login', { email, password });
    const { access_token, user } = response.data;

    // 1. Save the token securely to the device
    await SecureStore.setItemAsync(TOKEN_KEY, access_token);
    
    // 2. Attach the token to all future Axios requests
    setAuthToken(access_token);

    return user; // Return user data to the UI
  } catch (error: any) {
    throw error.response?.data?.message || 'Login failed';
  }
};

export const registerUser = async (firstName: string, email: string, password: string) => {
  try {
    const response = await apiClient.post('/auth/register', { firstName, email, password });
    return response.data;
  } catch (error: any) {
    throw error.response?.data?.message || 'Registration failed';
  }
};

// MAKE SURE THIS EXACT STRING MATCHES THE ONE IN index.tsx

export const logoutUser = async () => {
  try {
    console.log("🔒 LOGOUT INITIATED: Deleting token...");
    
    // 1. Delete from secure vault
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    
    // 2. Remove from Axios headers
    setAuthToken(null);
    
    // 3. Verify it is actually gone
    const checkToken = await SecureStore.getItemAsync(TOKEN_KEY);
    console.log("🔒 TOKEN STATUS AFTER DELETION (Should be null):", checkToken);

  } catch (error) {
    console.error("❌ ERROR DURING LOGOUT:", error);
  }
};
export const deleteAccount = async () => {
  try {
    // 1. Call the backend to delete data from AWS RDS
    await apiClient.delete('/users/me');
    
    // 2. Clear local session/token
    await logoutUser(); 
  } catch (error) {
    console.error("Account deletion failed", error);
    throw error;
  }
};