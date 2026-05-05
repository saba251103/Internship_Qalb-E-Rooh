import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { setAuthToken } from './services/api';

// This must exactly match the key used in authService.ts
const TOKEN_KEY = 'qalb_e_rooh_jwt';

export default function Index() {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkUserSession = async () => {
      try {
        // 1. Peek inside the device's secure vault
        const token = await SecureStore.getItemAsync(TOKEN_KEY);
        
        if (token) {
          // 2. Token found! Attach it to Axios for the NestJS backend
          setAuthToken(token);
          
          // 3. Teleport directly to the main app (bypassing onboarding and login)
          router.replace('/(tabs)');
        } else {
          // 4. No token found! Send them to your beautiful Ramadan Onboarding
          router.replace('/screens/splash');
        }
      } catch (error) {
        console.error("Failed to read token", error);
        // If anything fails, play it safe and send them to the splash screen
        router.replace('/screens/splash');
      } finally {
        setIsChecking(false);
      }
    };

    checkUserSession();
  }, []);

  // Show a minimal teal background matching your theme while doing the 0.1s check
  return (
    <View style={styles.container}>
      {isChecking && <ActivityIndicator size="large" color="#9FF0D0" />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#041A10', // Deepest background (Dark Pine) from your design tokens
    justifyContent: 'center',
    alignItems: 'center',
  }
});