import { auth, db } from './firebase';
import { 
  collection, 
  addDoc, 
  serverTimestamp, 
  query, 
  where, 
  getDocs,
  doc,
  getDoc
} from 'firebase/firestore';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';

/**
 * Servicio para manejar las alertas de emergencia
 */
export const emergencyService = {
  /**
   * Envía una alerta de emergencia
   * @param description Descripción opcional de la emergencia
   * @returns El ID del documento creado
   */
  async sendEmergencyAlert(description: string = 'ALERTA DE EMERGENCIA - Solicitud de ayuda inmediata'): Promise<string> {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('Usuario no autenticado');
    }

    // Obtener la ubicación actual
    let location = null;
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const locationData = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        location = {
          latitude: locationData.coords.latitude,
          longitude: locationData.coords.longitude,
          accuracy: locationData.coords.accuracy,
        };
      }
    } catch (error) {
      console.error('Error al obtener ubicación:', error);
      // Continuamos sin ubicación si hay error
    }

    // Obtener información del usuario
    let userData = null;
    try {
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      if (userDoc.exists()) {
        userData = userDoc.data();
      }
    } catch (error) {
      console.error('Error al obtener datos del usuario:', error);
    }

    // Crear el documento de emergencia
    const emergencyData = {
      userId: currentUser.uid,
      userEmail: currentUser.email,
      userName: userData ? `${userData.firstName} ${userData.lastName}` : 'Usuario',
      userPhone: userData?.phone || 'No disponible',
      type: 'Emergencia',
      description,
      status: 'Urgente',
      location,
      timestamp: serverTimestamp(),
      priority: 'Alta',
      isEmergency: true,
    };

    // Guardar en Firestore
    const docRef = await addDoc(collection(db, 'reports'), emergencyData);
    
    // Notificar a las autoridades
    await this.notifyAuthorities(docRef.id, emergencyData);
    
    return docRef.id;
  },

  /**
   * Notifica a todas las autoridades sobre la emergencia
   * @param emergencyId ID del documento de emergencia
   * @param emergencyData Datos de la emergencia
   */
  async notifyAuthorities(emergencyId: string, emergencyData: any): Promise<void> {
    try {
      // Obtener tokens de notificación de las autoridades
      const authoritiesQuery = query(
        collection(db, 'users'),
        where('role', '==', 'autoridad')
      );
      
      const authoritiesSnapshot = await getDocs(authoritiesQuery);
      
      // Crear notificaciones para cada autoridad
      const notificationPromises = authoritiesSnapshot.docs.map(async (authorityDoc) => {
        const authorityData = authorityDoc.data();
        if (authorityData.notificationToken) {
          // Guardar notificación en Firestore
          await addDoc(collection(db, 'notifications'), {
            userId: authorityDoc.id,
            title: '🚨 ALERTA DE EMERGENCIA',
            body: `${emergencyData.userName || 'Un ciudadano'} ha enviado una alerta de emergencia.`,
            data: { reportId: emergencyId },
            read: false,
            timestamp: serverTimestamp(),
          });
          
          // Actualizar contador de notificaciones no leídas
          if (authorityData.email) {
            await addDoc(collection(db, 'user_notifications'), {
              email: authorityData.email,
              hasUnread: true,
            });
          }
        }
      });
      
      await Promise.all(notificationPromises);
      
    } catch (error) {
      console.error('Error al notificar a las autoridades:', error);
    }
  },

  /**
   * Envía una notificación local al usuario
   * @param title Título de la notificación
   * @param body Cuerpo de la notificación
   * @param data Datos adicionales
   */
  async sendLocalNotification(
    title: string,
    body: string,
    data: any = {}
  ): Promise<void> {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
      },
      trigger: null, // Inmediatamente
    });
  },
};