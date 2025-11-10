/**
 * Configuración de Firebase
 * Inicializa y exporta las instancias de Firebase Auth y Firestore
 */

import { initializeApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth, initializeAuth, browserLocalPersistence } from 'firebase/auth';
import { getFirestore, Firestore, enableNetwork, disableNetwork } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { firebaseConfig, validateConfig } from '../config/appConfig';
import { logError, createAppError, ErrorType } from './errorHandling';
import NetInfo from '@react-native-community/netinfo';

// Validar configuración antes de inicializar
const configValidation = validateConfig();
if (!configValidation.isValid) {
  const errorMessage = `Configuración de Firebase inválida: ${configValidation.errors.join(', ')}`;
  logError(createAppError(ErrorType.FIREBASE, errorMessage, undefined, 'Firebase Initialization'));
  
  if (__DEV__) {
    console.error('❌ Error de configuración de Firebase:', configValidation.errors);
  }
}

let app!: FirebaseApp;
let auth!: Auth;
let db!: Firestore;
let storage!: FirebaseStorage;

// Evitar inicialización real en entorno de pruebas (Jest)
const isTestEnv = typeof process !== 'undefined' &&
  process.env && (process.env.JEST_WORKER_ID !== undefined || process.env.NODE_ENV === 'test');

if (isTestEnv) {
  app = {} as FirebaseApp;
  auth = {
    currentUser: null,
    // @ts-ignore
    authStateReady: async () => {},
  } as unknown as Auth;
  db = {} as unknown as Firestore;
  storage = {} as unknown as FirebaseStorage;
}

try {
  if (isTestEnv) {
    // En pruebas ya definimos stubs; saltar inicialización real
    if (__DEV__) {
      console.log('🧪 Firebase stubs activos en entorno de pruebas');
    }
  } else {
    // Inicializar Firebase
    app = initializeApp(firebaseConfig);
  
  // Inicializar servicios con persistencia apropiada según la plataforma
  try {
    // Detectar si estamos en un entorno web
    const isWeb = typeof window !== 'undefined' && typeof navigator !== 'undefined';
    
    if (isWeb) {
      // Para web, usar browserLocalPersistence
      auth = initializeAuth(app, {
        persistence: browserLocalPersistence
      });
    } else {
      // Para React Native, usar getAuth directamente
      // Firebase v10+ maneja automáticamente la persistencia en React Native
      auth = getAuth(app);
    }
  } catch (error: any) {
    // Si ya está inicializado, usar getAuth
    if (error.code === 'auth/already-initialized') {
      auth = getAuth(app);
    } else {
      throw error;
    }
  }
  
  // Inicializar Firestore con configuración básica sin persistencia offline
  try {
    db = getFirestore(app);
    
    // Configurar manejo de errores de red para Firestore
    const isWeb = typeof window !== 'undefined';
    if (isWeb) {
      // Manejar errores de conexión abortada
      const originalConsoleError = console.error;
      console.error = (...args) => {
        const message = args.join(' ');
        if (message.includes('net::ERR_ABORTED') && message.includes('firestore.googleapis.com')) {
          console.warn('⚠️ Conexión Firestore abortada - reintentando automáticamente');
          return; // Suprimir el error en consola
        }
        originalConsoleError.apply(console, args);
      };
      
      // Configurar reconexión automática después de errores de red
      setTimeout(async () => {
        try {
          await disableNetwork(db);
          await new Promise(resolve => setTimeout(resolve, 500));
          await enableNetwork(db);
          console.log('✅ Firestore reiniciado correctamente');
        } catch (error) {
          console.warn('⚠️ No se pudo reiniciar Firestore, continuando normalmente');
        }
      }, 1000);
    }
    
    console.log('✅ Firestore inicializado con configuración básica');
  } catch (error: any) {
    console.error('❌ Error al inicializar Firestore:', error);
    throw error;
  }
  
  storage = getStorage(app);
  
  if (__DEV__) {
    console.log('✅ Firebase inicializado correctamente');
    console.log('📱 Proyecto:', firebaseConfig.projectId);
  }
  
  }
} catch (error: any) {
  const errorMessage = 'Error al inicializar Firebase';
  logError(createAppError(
    ErrorType.FIREBASE, 
    errorMessage, 
    error instanceof Error ? error : new Error(String(error)),
    'Firebase Initialization'
  ));
  
  if (__DEV__) {
    console.error('❌ Error al inicializar Firebase:', error);
  }
  
  throw error;
}

/**
 * Función para verificar el estado de conexión de Firebase
 * @returns Promise<boolean> - true si está conectado, false en caso contrario
 */
export const checkFirebaseConnection = async (): Promise<boolean> => {
  try {
    // Intentar una operación simple para verificar la conexión
    await auth.authStateReady();
    return true;
  } catch (error: any) {
    logError(createAppError(
      ErrorType.NETWORK,
      'Error de conexión con Firebase',
      error instanceof Error ? error : new Error(String(error)),
      'Firebase Connection Check'
    ));
    return false;
  }
};

/**
 * Función para habilitar la red de Firestore
 */
export const enableFirestoreNetwork = async (): Promise<void> => {
  try {
    await enableNetwork(db);
    if (__DEV__) {
      console.log('✅ Red de Firestore habilitada');
    }
  } catch (error: any) {
    logError(createAppError(
      ErrorType.NETWORK,
      'Error al habilitar la red de Firestore',
      error instanceof Error ? error : new Error(String(error)),
      'Enable Firestore Network'
    ));
  }
};

/**
 * Función para deshabilitar la red de Firestore
 */
export const disableFirestoreNetwork = async (): Promise<void> => {
  try {
    await disableNetwork(db);
    if (__DEV__) {
      console.log('⚠️ Red de Firestore deshabilitada');
    }
  } catch (error: any) {
    logError(createAppError(
      ErrorType.NETWORK,
      'Error al deshabilitar la red de Firestore',
      error instanceof Error ? error : new Error(String(error)),
      'Disable Firestore Network'
    ));
  }
};

/**
 * Función para obtener información del estado de Firebase
 * @returns Promise con información del estado
 */
export const getFirebaseStatus = async () => {
  const netInfo = await NetInfo.fetch();
  return {
    isInitialized: !!app,
    projectId: firebaseConfig.projectId,
    authDomain: firebaseConfig.authDomain,
    currentUser: auth?.currentUser?.uid || null,
    isOnline: netInfo.isConnected ?? false,
    networkType: netInfo.type,
    isInternetReachable: netInfo.isInternetReachable ?? false
  };
};

/**
 * Función para manejar cambios en la conectividad de red
 */
export const handleNetworkChange = (isConnected: boolean | null) => {
  if (isConnected === false) {
    if (__DEV__) {
      console.log('📱 Dispositivo sin conexión - usando datos offline');
    }
  } else if (isConnected === true) {
    if (__DEV__) {
      console.log('📱 Dispositivo conectado - sincronizando datos');
    }
    // Reactivar la red de Firestore cuando se recupere la conexión
    enableFirestoreNetwork();
  }
};

// Exportar instancias
export { auth, db, storage, app };

// Exportar por defecto para compatibilidad
export default {
  auth,
  db,
  storage,
  app,
  checkConnection: checkFirebaseConnection,
  getStatus: getFirebaseStatus,
  enableNetwork: enableFirestoreNetwork,
  disableNetwork: disableFirestoreNetwork,
  handleNetworkChange
};
