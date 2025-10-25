import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { appConfig } from '../config/appConfig';

// Configuración de notificaciones optimizada para móvil
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export interface NotificationData {
  title: string;
  body: string;
  data?: Record<string, any>;
  categoryId?: string;
  priority?: 'low' | 'normal' | 'high' | 'max';
  sound?: boolean;
  vibrate?: boolean;
  badge?: number;
}

export interface ScheduledNotificationData extends NotificationData {
  trigger: {
    seconds?: number;
    date?: Date;
    repeats?: boolean;
  };
}

export interface NotificationPermissions {
  status: Notifications.PermissionStatus;
  canAskAgain: boolean;
  granted: boolean;
}

/**
 * Servicio optimizado de notificaciones para móvil
 * 
 * Características:
 * - Gestión automática de permisos
 * - Configuración optimizada para Android e iOS
 * - Soporte para notificaciones programadas
 * - Categorías de notificaciones personalizadas
 * - Manejo de tokens push para Firebase
 * - Optimización de batería y rendimiento
 */
class NotificationService {
  private static instance: NotificationService;
  private expoPushToken: string | null = null;
  private notificationListener: any = null;
  private responseListener: any = null;

  private constructor() {
    this.initializeNotifications();
  }

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  /**
   * Inicializa el servicio de notificaciones
   */
  private async initializeNotifications() {
    try {
      // Configurar categorías de notificaciones
      await this.setupNotificationCategories();
      
      // Configurar listeners
      this.setupNotificationListeners();
      
      // Obtener token push si es un dispositivo físico
      if (Device.isDevice) {
        await this.registerForPushNotificationsAsync();
      }
    } catch (error) {
      console.error('Error initializing notifications:', error);
    }
  }

  /**
   * Configura las categorías de notificaciones
   */
  private async setupNotificationCategories() {
    await Notifications.setNotificationCategoryAsync('emergency', [
      {
        identifier: 'view_emergency',
        buttonTitle: 'Ver Emergencia',
        options: {
          opensAppToForeground: true,
        },
      },
      {
        identifier: 'dismiss_emergency',
        buttonTitle: 'Descartar',
        options: {
          opensAppToForeground: false,
        },
      },
    ]);

    await Notifications.setNotificationCategoryAsync('report_update', [
      {
        identifier: 'view_report',
        buttonTitle: 'Ver Reporte',
        options: {
          opensAppToForeground: true,
        },
      },
    ]);

    await Notifications.setNotificationCategoryAsync('general', [
      {
        identifier: 'view_notification',
        buttonTitle: 'Ver',
        options: {
          opensAppToForeground: true,
        },
      },
    ]);
  }

  /**
   * Configura los listeners de notificaciones
   */
  private setupNotificationListeners() {
    // Listener para notificaciones recibidas mientras la app está en primer plano
    this.notificationListener = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log('📱 Notification received:', notification);
        this.handleNotificationReceived(notification);
      }
    );

    // Listener para respuestas a notificaciones
    this.responseListener = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        console.log('📱 Notification response:', response);
        this.handleNotificationResponse(response);
      }
    );
  }

  /**
   * Maneja notificaciones recibidas
   */
  private handleNotificationReceived(notification: Notifications.Notification) {
    // Lógica personalizada para manejar notificaciones recibidas
    const { data } = notification.request.content;
    
    if (data?.type === 'emergency') {
      // Vibración especial para emergencias
      if (Platform.OS === 'android') {
        // Patrón de vibración para emergencias
      }
    }
  }

  /**
   * Maneja respuestas a notificaciones
   */
  private handleNotificationResponse(response: Notifications.NotificationResponse) {
    const { actionIdentifier, notification } = response;
    const { data } = notification.request.content;

    switch (actionIdentifier) {
      case 'view_emergency':
        // Navegar a pantalla de emergencia
        break;
      case 'view_report':
        // Navegar a reporte específico
        break;
      case 'view_notification':
        // Acción general
        break;
      default:
        // Acción por defecto (tap en notificación)
        break;
    }
  }

  /**
   * Registra el dispositivo para notificaciones push
   */
  public async registerForPushNotificationsAsync(): Promise<string | null> {
    try {
      if (!Device.isDevice) {
        console.warn('Must use physical device for Push Notifications');
        return null;
      }

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync({
          ios: {
            allowAlert: true,
            allowBadge: true,
            allowSound: true,
    
          },
          android: {
            allowAlert: true,
            allowBadge: true,
            allowSound: true,
          },
        });
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.warn('Failed to get push token for push notification!');
        return null;
      }

      // Obtener token push
      const token = await Notifications.getExpoPushTokenAsync({
        projectId: Constants.expoConfig?.extra?.eas?.projectId,
      });

      this.expoPushToken = token.data;
      console.log('📱 Push token:', this.expoPushToken);

      // Configuración específica para Android
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
          sound: 'default',
        });

        // Canal para emergencias
        await Notifications.setNotificationChannelAsync('emergency', {
          name: 'Emergencias',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 500, 250, 500],
          lightColor: '#FF0000',
          sound: 'default',
          enableLights: true,
          enableVibrate: true,
        });

        // Canal para reportes
        await Notifications.setNotificationChannelAsync('reports', {
          name: 'Reportes',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#0055CC',
          sound: 'default',
        });
      }

      return this.expoPushToken;
    } catch (error) {
      console.error('Error registering for push notifications:', error);
      return null;
    }
  }

  /**
   * Obtiene el estado de los permisos de notificaciones
   */
  public async getPermissions(): Promise<NotificationPermissions> {
    const permissions = await Notifications.getPermissionsAsync();
    return {
      status: permissions.status,
      canAskAgain: permissions.canAskAgain,
      granted: permissions.granted,
    };
  }

  /**
   * Solicita permisos de notificaciones
   */
  public async requestPermissions(): Promise<NotificationPermissions> {
    const permissions = await Notifications.requestPermissionsAsync({
      ios: {
        allowAlert: true,
        allowBadge: true,
        allowSound: true,
  
      },
      android: {
        allowAlert: true,
        allowBadge: true,
        allowSound: true,
      },
    });

    return {
      status: permissions.status,
      canAskAgain: permissions.canAskAgain,
      granted: permissions.granted,
    };
  }

  /**
   * Envía una notificación local
   */
  public async sendLocalNotification(data: NotificationData): Promise<string> {
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: data.title,
        body: data.body,
        data: data.data || {},
        categoryIdentifier: data.categoryId,
        priority: this.mapPriority(data.priority || 'normal'),
        sound: data.sound !== false ? 'default' : undefined,
        badge: data.badge,
      },
      trigger: null, // Enviar inmediatamente
    });

    return notificationId;
  }

  /**
   * Programa una notificación
   */
  public async scheduleNotification(data: ScheduledNotificationData): Promise<string> {
    const trigger: Notifications.NotificationTriggerInput = data.trigger.date
      ? { type: Notifications.SchedulableTriggerInputTypes.DATE, date: data.trigger.date }
      : { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: data.trigger.seconds || 1 };

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: data.title,
        body: data.body,
        data: data.data || {},
        categoryIdentifier: data.categoryId,
        priority: this.mapPriority(data.priority || 'normal'),
        sound: data.sound !== false ? 'default' : undefined,
        badge: data.badge,
      },
      trigger,
    });

    return notificationId;
  }

  /**
   * Cancela una notificación programada
   */
  public async cancelNotification(notificationId: string): Promise<void> {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  }

  /**
   * Cancela todas las notificaciones programadas
   */
  public async cancelAllNotifications(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }

  /**
   * Obtiene todas las notificaciones programadas
   */
  public async getScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
    return await Notifications.getAllScheduledNotificationsAsync();
  }

  /**
   * Establece el badge de la aplicación
   */
  public async setBadgeCount(count: number): Promise<void> {
    await Notifications.setBadgeCountAsync(count);
  }

  /**
   * Obtiene el token push actual
   */
  public getExpoPushToken(): string | null {
    return this.expoPushToken;
  }

  /**
   * Mapea la prioridad a formato de Expo
   */
  private mapPriority(priority: string): Notifications.AndroidNotificationPriority {
    switch (priority) {
      case 'low':
        return Notifications.AndroidNotificationPriority.LOW;
      case 'normal':
        return Notifications.AndroidNotificationPriority.DEFAULT;
      case 'high':
        return Notifications.AndroidNotificationPriority.HIGH;
      case 'max':
        return Notifications.AndroidNotificationPriority.MAX;
      default:
        return Notifications.AndroidNotificationPriority.DEFAULT;
    }
  }

  /**
   * Limpia los listeners al destruir el servicio
   */
  public cleanup(): void {
    if (this.notificationListener) {
      Notifications.removeNotificationSubscription(this.notificationListener);
    }
    if (this.responseListener) {
      Notifications.removeNotificationSubscription(this.responseListener);
    }
  }
}

// Exportar instancia singleton
export const notificationService = NotificationService.getInstance();
export default notificationService;

// Funciones de utilidad
export const sendEmergencyNotification = async (title: string, body: string, data?: any) => {
  return await notificationService.sendLocalNotification({
    title,
    body,
    data,
    categoryId: 'emergency',
    priority: 'max',
    sound: true,
    vibrate: true,
  });
};

export const sendReportNotification = async (title: string, body: string, data?: any) => {
  return await notificationService.sendLocalNotification({
    title,
    body,
    data,
    categoryId: 'report_update',
    priority: 'high',
    sound: true,
  });
};

export const sendGeneralNotification = async (title: string, body: string, data?: any) => {
  return await notificationService.sendLocalNotification({
    title,
    body,
    data,
    categoryId: 'general',
    priority: 'normal',
    sound: true,
  });
};