import React, { useEffect } from 'react';
import AppNavigator from './src/navigation/AppNavigator';
import { registerForPushNotificationsAsync } from './src/services/notifications';
import Toast from 'react-native-toast-message';
import { PaperProvider } from 'react-native-paper';
import { View, Text } from 'react-native';

export default function App() {
  useEffect(() => {
    const getToken = async () => {
      const token = await registerForPushNotificationsAsync();
      console.log('FCM Token:', token);

      if (token) {
        await fetch('https://seguridad-ciudadana-backend.onrender.com/api/guardar-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });
      }
    };

    getToken();
  }, []);

  return (
    <PaperProvider>
      <AppNavigator />
      <Toast
        config={{
          success: ({ text1, text2 }) => (
            <View
              style={{
                backgroundColor: '#4CAF50',
                padding: 16,
                borderRadius: 10,
                marginHorizontal: 16,
                shadowColor: '#000',
                shadowOpacity: 0.2,
                shadowOffset: { width: 0, height: 2 },
                shadowRadius: 4,
              }}
            >
              <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>{text1}</Text>
              {text2 && <Text style={{ color: 'white' }}>{text2}</Text>}
            </View>
          ),
          error: ({ text1, text2 }) => (
            <View
              style={{
                backgroundColor: '#f44336',
                padding: 16,
                borderRadius: 10,
                marginHorizontal: 16,
                shadowColor: '#000',
                shadowOpacity: 0.2,
                shadowOffset: { width: 0, height: 2 },
                shadowRadius: 4,
              }}
            >
              <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>{text1}</Text>
              {text2 && <Text style={{ color: 'white' }}>{text2}</Text>}
            </View>
          ),
        }}
      />
    </PaperProvider>
  );
}
