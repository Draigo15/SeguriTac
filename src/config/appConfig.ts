/**
 * Configuración centralizada de la aplicación
 * Maneja todas las configuraciones de manera segura y organizada
 */

/**
 * Configuración de Firebase
 * Usa las variables de entorno del archivo .env
 */
import { FIREBASE_CONFIG } from '../../env';
import { Platform } from 'react-native';

export const firebaseConfig = FIREBASE_CONFIG;

/**
 * URLs de la API backend
 */
export const apiConfig = {
  baseUrl: __DEV__
    ? (Platform.OS === 'android' ? 'http://10.0.2.2:3000/api' : 'http://localhost:3000/api')
    : 'https://seguridad-ciudadana-backend.onrender.com/api',
  // Afirmación de HTTPS en producción
  get isHttpsRequired() {
    return !__DEV__;
  },
  get isHttpsConfigured() {
    try {
      return this.baseUrl.startsWith('https://');
    } catch {
      return false;
    }
  },
  
  endpoints: {
    notifications: '/notifications',
    reports: '/reports',
    emergency: '/emergency',
    users: '/users',
    auth: '/auth'
  }
};

/**
 * Configuración de notificaciones push
 */
export const notificationConfig = {
  // Configuración para Expo Notifications
  experienceId: '@your-username/seguridad-ciudadana',
  
  // Configuración para Firebase Cloud Messaging
  fcm: {
    senderId: firebaseConfig.messagingSenderId
  },
  
  // Configuración de canales de notificación (Android)
  channels: {
    emergency: {
      id: 'emergency-alerts',
      name: 'Alertas de Emergencia',
      description: 'Notificaciones críticas de emergencia',
      importance: 'high',
      sound: 'emergency_alert.wav'
    },
    reports: {
      id: 'report-updates',
      name: 'Actualizaciones de Reportes',
      description: 'Notificaciones sobre el estado de tus reportes',
      importance: 'default'
    },
    general: {
      id: 'general-notifications',
      name: 'Notificaciones Generales',
      description: 'Notificaciones informativas generales',
      importance: 'low'
    }
  }
};

/**
 * Configuración de mapas
 */
export const mapConfig = {
  // Configuración por defecto del mapa
  defaultRegion: {
    latitude: -12.0464, // Lima, Perú
    longitude: -77.0428,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  },
  
  // Configuración de marcadores
  markers: {
    emergency: {
      color: '#ef4444',
      size: 'large'
    },
    report: {
      color: '#0055CC',
      size: 'medium'
    },
    user: {
      color: '#10b981',
      size: 'small'
    }
  },
  
  // Radio de búsqueda en metros
  searchRadius: 5000
};

/**
 * Configuración de la aplicación
 */
export const appConfig = {
  // Información de la app
  name: 'Seguridad Ciudadana',
  version: '1.0.0',
  
  // Configuración de timeouts
  timeouts: {
    api: 10000, // 10 segundos
    location: 15000, // 15 segundos
    emergency: 5000 // 5 segundos para emergencias
  },
  
  // Límites de la aplicación
  limits: {
    maxImageSize: 5 * 1024 * 1024, // 5MB
    maxDescriptionLength: 500,
    minDescriptionLength: 10,
    maxEmergencyContacts: 5,
    reportCooldown: 60000 // 1 minuto entre reportes
  },
  
  // Configuración de validaciones
  validation: {
    email: {
      regex: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      message: 'Email inválido'
    },
    password: {
      minLength: 6,
      message: 'La contraseña debe tener al menos 6 caracteres'
    },
    phone: {
      regex: /^[\d\s\-\(\)\+]{9,}$/,
      message: 'Número de teléfono inválido'
    }
  },
  
  // Configuración de almacenamiento local
  storage: {
    keys: {
      userToken: '@user_token',
      userProfile: '@user_profile',
      emergencyContacts: '@emergency_contacts',
      notificationSettings: '@notification_settings',
      lastLocation: '@last_location'
    }
  },
  
  // Configuración de logging
  logging: {
    enabled: __DEV__,
    level: __DEV__ ? 'debug' : 'error',
    maxLogs: 100
  }
};

/**
 * Configuración de servicios externos
 */
export const externalServices = {
  // Configuración para servicios de SMS (Twilio, etc.)
  sms: {
    provider: 'twilio', // 'twilio' | 'aws-sns' | 'firebase'
    config: {
      // Configuración específica del proveedor
      // En producción usar variables de entorno
    }
  },
  
  // Configuración para servicios de email
  email: {
    provider: 'sendgrid', // 'sendgrid' | 'aws-ses' | 'firebase'
    config: {
      // Configuración específica del proveedor
    }
  },
  
  // Configuración para analytics
  analytics: {
    enabled: !__DEV__,
    providers: ['firebase-analytics', 'crashlytics']
  }
};

/**
 * Función para obtener configuración basada en el entorno
 */
export const getEnvironmentConfig = () => {
  const isDev = __DEV__;
  
  return {
    isDevelopment: isDev,
    isProduction: !isDev,
    apiUrl: isDev ? apiConfig.baseUrl : apiConfig.baseUrl,
    enableLogging: isDev,
    enableAnalytics: !isDev
  };
};

/**
 * Función para validar que todas las configuraciones requeridas estén presentes
 */
export const validateConfig = (): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  // Validar configuración de Firebase
  if (!firebaseConfig.apiKey || firebaseConfig.apiKey.includes('placeholder')) {
    errors.push('Firebase API Key no configurada correctamente');
  }
  
  if (!firebaseConfig.projectId) {
    errors.push('Firebase Project ID no configurado');
  }
  
  // Validar configuración de API
  if (!apiConfig.baseUrl) {
    errors.push('URL base de la API no configurada');
  }
  if (apiConfig.isHttpsRequired && !apiConfig.isHttpsConfigured) {
    errors.push('Producción requiere HTTPS para la API');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Configuración por defecto para exportar
 */
export default {
  firebase: firebaseConfig,
  api: apiConfig,
  notifications: notificationConfig,
  map: mapConfig,
  app: appConfig,
  external: externalServices,
  environment: getEnvironmentConfig(),
  validate: validateConfig
};