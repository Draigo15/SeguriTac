import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';

export async function registerForPushNotificationsAsync() {
  let token = null;

  try {
    if (!Device.isDevice) {
      alert('Debes usar un dispositivo físico para recibir notificaciones push');
      return null;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      alert('Permiso para notificaciones denegado');
      return null;
    }

    const { data } = await Notifications.getExpoPushTokenAsync({
      projectId: Constants.expoConfig?.extra?.eas?.projectId || 'seguridadciudadanaapp-cs1',
    });

    token = data;
    console.log('✅ Token FCM obtenido:', token);

    // Mensaje opcional de éxito (puedes comentar esto si no lo quieres mostrar)
    // alert('Notificaciones habilitadas correctamente');

    return token;

  } catch (error) {
    console.error('❌ Error al registrar FCM:', error);
    alert('Error al registrar las notificaciones');
    return null;
  }
}
