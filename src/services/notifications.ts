import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { apiConfig } from '../config/appConfig';

export async function registerForPushNotificationsAsync(email?: string) {
  let token;

  // En web, las notificaciones push requieren configuración VAPID
  // Por ahora, simplemente retornamos null para evitar errores
  if (Platform.OS === 'web') {
    console.log('⚠️ Notificaciones push no configuradas para web');
    return null;
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      alert('No se pudo obtener el permiso para notificaciones push.');
      return;
    }

    const pushToken = await Notifications.getDevicePushTokenAsync();
    token = pushToken.data;
    console.log('✅ Token FCM:', token);

    // 🔁 Enviar al backend
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 segundos de timeout
      
      const response = await fetch(`${apiConfig.baseUrl}/guardar-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, email }),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        console.warn('⚠️ Error al guardar token FCM en backend:', response.status);
      }
    } catch (fetchError) {
      console.warn('⚠️ No se pudo conectar al backend para guardar token FCM:', fetchError);
      // No interrumpir el registro de notificaciones por este error
    }
  } else {
    alert('Debes usar un dispositivo físico para recibir notificaciones');
  }

  return token;
}
