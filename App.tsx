import React, { useEffect } from 'react';
import AppNavigator from './src/navigation/AppNavigator';
import { registerForPushNotificationsAsync } from './src/services/notifications';
import Toast from 'react-native-toast-message';
import { PaperProvider } from 'react-native-paper';
import { Platform, View, Text, LogBox } from 'react-native';
import Constants from 'expo-constants';
import { auth } from './src/services/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { logMetric } from './src/utils/metrics';

// Marca global del inicio de la app para medir el primer render.
// Si ya existe (por hot reload), no la sobrescribimos.
// @ts-ignore
if (typeof globalThis !== 'undefined' && !(globalThis as any).__APP_START_TS__) {
  // @ts-ignore
  (globalThis as any).__APP_START_TS__ = Date.now();
}

export default function App() {
  // Silenciar logs conocidos en modo Detox para evitar overlays que interrumpen las pruebas
  const detoxE2E = !!Constants.expoConfig?.extra?.detoxE2E;
  if (detoxE2E) {
    LogBox.ignoreLogs(['FirebaseError: Missing or insufficient permissions']);
  }

  useEffect(() => {
    // Medir tiempo hasta el primer render/effect.
    // @ts-ignore
    const t0 = (globalThis as any).__APP_START_TS__ || Date.now();
    logMetric('cold_start_first_render_ms', Date.now() - t0, { platform: Platform.OS });

    // Cargar estilos web solo en plataforma web
    if (Platform.OS === 'web') {
      import('./src/utils/loadWebStyles.web')
        .then((module) => {
          if (module && module.default) {
            module.default();
          }
        })
        .catch((error) => {
          console.warn('Error loading web styles:', error);
        });
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user && Platform.OS !== 'web') {
        const token = await registerForPushNotificationsAsync(user.email || undefined);
        console.log('FCM Token registrado para:', user.email);
      }
    });

    return () => unsubscribe();
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
          info: ({ text1, text2 }) => (
  <View
    style={{
      backgroundColor: '#2196F3',
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
