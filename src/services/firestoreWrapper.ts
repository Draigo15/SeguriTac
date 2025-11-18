/**
 * Firestore Wrapper Service
 * 
 * Proporciona funciones wrapper para operaciones de Firestore que manejan
 * automáticamente errores de red como ERR_ABORTED y reconexiones.
 */

import {
  onSnapshot,
  Query,
  DocumentReference,
  DocumentSnapshot,
  QuerySnapshot,
  DocumentData,
  Unsubscribe,
  FirestoreError,
  enableNetwork,
  disableNetwork
} from 'firebase/firestore';
import { db } from './firebase';
import { handleFirebaseError, logError, createAppError, ErrorType } from './errorHandling';

/**
 * Configuración para el wrapper de Firestore
 */
interface FirestoreWrapperConfig {
  maxRetries: number;
  retryDelay: number;
  enableLogging: boolean;
}

const defaultConfig: FirestoreWrapperConfig = {
  maxRetries: 3,
  retryDelay: 1000,
  enableLogging: __DEV__
};

/**
 * Wrapper robusto para onSnapshot que maneja errores ERR_ABORTED
 * y reconexiones automáticas
 * 
 * @param query - Query o DocumentReference de Firestore
 * @param onNext - Callback para datos exitosos
 * @param onError - Callback opcional para errores
 * @param config - Configuración opcional
 * @returns Función de cleanup
 */
export function robustOnSnapshot(
  query: Query<DocumentData> | DocumentReference<DocumentData>,
  onNext: (snapshot: QuerySnapshot<DocumentData> | DocumentSnapshot<DocumentData>) => void,
  onError?: (error: FirestoreError) => void,
  config: Partial<FirestoreWrapperConfig> = {}
): Unsubscribe {
  const finalConfig = { ...defaultConfig, ...config };
  let unsubscribe: Unsubscribe | null = null;
  let retryCount = 0;
  let isActive = true;
  
  const setupListener = () => {
    if (!isActive) return;
    
    try {
      // Verificar el tipo y usar la sobrecarga correcta
      if (query.type === 'query' || query.type === 'collection') {
        unsubscribe = onSnapshot(
          query as Query<DocumentData>,
          (snapshot: QuerySnapshot<DocumentData>) => {
            if (!isActive) return;
            retryCount = 0;
            onNext(snapshot);
          },
          (error: FirestoreError) => {
            if (!isActive) return;
            handleSnapshotError(error);
          }
        );
      } else {
        unsubscribe = onSnapshot(
          query as DocumentReference<DocumentData>,
          (snapshot: DocumentSnapshot<DocumentData>) => {
            if (!isActive) return;
            retryCount = 0;
            onNext(snapshot);
          },
          (error: FirestoreError) => {
            if (!isActive) return;
            handleSnapshotError(error);
          }
        );
      }
    } catch (error) {
      handleSnapshotError(error as FirestoreError);
    }
  };
  
  const handleSnapshotError = (error: FirestoreError) => {
    if (!isActive) return;
    
    const errorMessage = error.message || '';
    const isAbortedError = errorMessage.includes('net::ERR_ABORTED') || 
                          errorMessage.includes('ERR_ABORTED') ||
                          error.code === 'aborted';
    
    if (finalConfig.enableLogging) {
      console.warn(`⚠️ Error en listener Firestore:`, {
        code: error.code,
        message: error.message,
        isAbortedError,
        retryCount
      });
    }
    
    // Para errores ERR_ABORTED, reintentar automáticamente
    if (isAbortedError && retryCount < finalConfig.maxRetries) {
      retryCount++;
      
      if (finalConfig.enableLogging) {
        console.log(`🔄 Reintentando conexión Firestore (${retryCount}/${finalConfig.maxRetries})...`);
      }
      
      // Limpiar listener actual
      if (unsubscribe) {
        unsubscribe();
        unsubscribe = null;
      }
      
      // Reintentar después del delay
      setTimeout(() => {
        if (isActive) {
          setupListener();
        }
      }, finalConfig.retryDelay * retryCount);
      
      return;
    }
    
    // Para otros errores o si se agotaron los reintentos
    if (onError) {
      onError(error);
    } else {
      // Log del error si no hay handler personalizado
      logError(createAppError(
        ErrorType.FIREBASE,
        `Error en listener Firestore: ${handleFirebaseError(error)}`,
        error,
        'robustOnSnapshot'
      ));
    }
  };
  
  // Configurar listener inicial
  setupListener();
  
  // Retornar función de cleanup
  return () => {
    isActive = false;
    if (unsubscribe) {
      unsubscribe();
      unsubscribe = null;
    }
  };
}

/**
 * Función para reconectar Firestore manualmente
 * Útil cuando se detectan problemas de conectividad
 */
export const reconnectFirestore = async (): Promise<boolean> => {
  try {
    console.log('🔄 Reconectando Firestore...');
    
    await disableNetwork(db);
    await new Promise(resolve => setTimeout(resolve, 500));
    await enableNetwork(db);
    
    console.log('✅ Firestore reconectado exitosamente');
    return true;
  } catch (error: any) {
    console.error('❌ Error al reconectar Firestore:', error);
    return false;
  }
};

/**
 * Hook personalizado para manejar el estado de conexión de Firestore
 */
export const useFirestoreConnection = () => {
  const [isConnected, setIsConnected] = React.useState(true);
  const [isReconnecting, setIsReconnecting] = React.useState(false);
  
  const handleReconnect = async () => {
    setIsReconnecting(true);
    const success = await reconnectFirestore();
    setIsConnected(success);
    setIsReconnecting(false);
    return success;
  };
  
  return {
    isConnected,
    isReconnecting,
    reconnect: handleReconnect
  };
};

// Importar React para el hook
import React from 'react';

export default {
  robustOnSnapshot,
  reconnectFirestore,
  useFirestoreConnection
};