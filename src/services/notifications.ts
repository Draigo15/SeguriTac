import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';

export async function registerForPushNotificationsAsync(email?: string) {
  let token;

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
    await fetch('https://seguridad-ciudadana-backend.onrender.com/api/guardar-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, email }),
    });
  } else {
    alert('Debes usar un dispositivo físico para recibir notificaciones');
  }

  return token;
}
