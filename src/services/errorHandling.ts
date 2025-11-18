/**
 * errorHandling.ts - Servicio Centralizado de Manejo de Errores
 * 
 * REQUERIMIENTOS IMPLEMENTADOS:
 * - RF-11: Mensajes de Retroalimentación - Sistema centralizado de mensajes de error y éxito
 * 
 * FUNCIONALIDADES:
 * - Manejo consistente de errores en toda la aplicación
 * - Mensajes de retroalimentación amigables al usuario
 * - Toast notifications para feedback inmediato
 * - Logging centralizado para debugging
 * - Manejo específico de errores de Firebase y red
 * 
 * TECNOLOGÍAS:
 * - React Native Toast Message para notificaciones
 * - NetInfo para detección de conectividad
 * - TypeScript para tipado fuerte
 */

import Toast from 'react-native-toast-message';
import NetInfo from '@react-native-community/netinfo';

/**
 * RF-11: Tipos de errores que puede manejar la aplicación
 * Clasificación para proporcionar mensajes de retroalimentación específicos
 */
export enum ErrorType {
  NETWORK = 'NETWORK',           // RF-11: Errores de conectividad
  AUTHENTICATION = 'AUTHENTICATION', // RF-11: Errores de autenticación
  VALIDATION = 'VALIDATION',     // RF-11: Errores de validación de formularios
  PERMISSION = 'PERMISSION',     // RF-11: Errores de permisos
  UNKNOWN = 'UNKNOWN',          // RF-11: Errores no clasificados
  FIREBASE = 'FIREBASE'         // RF-11: Errores específicos de Firebase
}

/**
 * RF-11: Interface para errores personalizados de la aplicación
 * Estructura estandarizada para manejo de errores y retroalimentación
 */
export interface AppError {
  type: ErrorType;        // RF-11: Tipo de error para categorización
  message: string;        // RF-11: Mensaje amigable para el usuario
  originalError?: Error;  // RF-11: Error original para debugging
  context?: string;       // RF-11: Contexto donde ocurrió el error
  timestamp: Date;        // RF-11: Timestamp para logging
}

/**
 * RF-11: Crea un error personalizado de la aplicación
 * Factory function para crear errores estandarizados con retroalimentación consistente
 * 
 * Características:
 * - Estructura estandarizada para todos los errores
 * - Timestamp automático para tracking temporal
 * - Preservación del error original para debugging
 * - Contexto para identificar origen del error
 * 
 * @param {ErrorType} type - Tipo de error para categorización
 * @param {string} message - Mensaje amigable para el usuario
 * @param {Error} [originalError] - Error original para debugging
 * @param {string} [context] - Contexto donde ocurrió el error
 * @returns {AppError} Error estructurado de la aplicación
 */
export const createAppError = (
  type: ErrorType,
  message: string,
  originalError?: Error,
  context?: string
): AppError => {
  return {
    type,
    message,
    originalError,
    context,
    timestamp: new Date()
  };
};

/**
 * RF-11: Maneja errores de Firebase y los convierte a mensajes amigables
 * Traduce códigos de error técnicos a mensajes comprensibles para el usuario
 * 
 * Errores manejados:
 * - Autenticación: usuario no encontrado, contraseña incorrecta, email inválido
 * - Red: conexión fallida, servicio no disponible, timeout
 * - Permisos: acceso denegado a recursos
 * - Operaciones: canceladas, interrumpidas, tiempo agotado
 * 
 * Casos especiales:
 * - ERR_ABORTED: Conexiones interrumpidas con reconexión automática
 * - Network errors: Detección de problemas de conectividad
 * - Unknown errors: Fallback para errores no clasificados
 * 
 * @param {any} error - Error de Firebase con código y mensaje
 * @returns {string} Mensaje de error amigable para mostrar al usuario
 */
export const handleFirebaseError = (error: any): string => {
  const errorCode = error?.code || '';
  const errorMessage = error?.message || '';
  
  // Manejar errores específicos de ERR_ABORTED
  if (errorMessage.includes('net::ERR_ABORTED') || errorMessage.includes('ERR_ABORTED')) {
    return 'Conexión interrumpida. Reintentando automáticamente...';
  }
  
  switch (errorCode) {
    case 'auth/user-not-found':
      return 'Usuario no encontrado';
    case 'auth/wrong-password':
      return 'Contraseña incorrecta';
    case 'auth/email-already-in-use':
      return 'Este email ya está registrado';
    case 'auth/weak-password':
      return 'La contraseña es muy débil';
    case 'auth/invalid-email':
      return 'Email inválido';
    case 'auth/network-request-failed':
      return 'Error de conexión. Verifica tu internet';
    case 'permission-denied':
      return 'No tienes permisos para realizar esta acción';
    case 'unavailable':
      return 'Servicio no disponible. Intenta más tarde';
    case 'aborted':
      return 'Operación cancelada. Reintentando...';
    case 'deadline-exceeded':
      return 'Tiempo de espera agotado. Reintentando...';
    default:
      return error?.message || 'Error desconocido';
  }
};

/**
 * RF-11: Maneja errores de red con detección de conectividad
 * Analiza el estado de la conexión y proporciona mensajes específicos
 * 
 * Funcionalidades:
 * - Verificación en tiempo real del estado de conexión
 * - Detección de errores ERR_ABORTED con manejo especial
 * - Diferenciación entre sin internet y errores de red
 * - Mensajes contextuales según el tipo de problema
 * 
 * Tipos de errores detectados:
 * - Sin conexión: NetInfo detecta ausencia de internet
 * - ERR_ABORTED: Conexiones interrumpidas (reconexión automática)
 * - NETWORK_ERROR: Problemas generales de conectividad
 * - Otros: Errores de red no específicos
 * 
 * @param {any} error - Error de red con código y mensaje
 * @returns {Promise<string>} Mensaje de error amigable basado en conectividad
 */
export const handleNetworkError = async (error: any): Promise<string> => {
  const netInfo = await NetInfo.fetch();
  if (!netInfo.isConnected) {
    return 'Sin conexión a internet';
  }
  
  const errorMessage = error?.message || '';
  
  // Manejar errores específicos de ERR_ABORTED
  if (errorMessage.includes('net::ERR_ABORTED') || errorMessage.includes('ERR_ABORTED')) {
    return 'Conexión interrumpida. La aplicación se reconectará automáticamente';
  }
  
  if (error?.code === 'NETWORK_ERROR') {
    return 'Error de conexión. Verifica tu internet';
  }
  
  return 'Error de red. Intenta nuevamente';
};

/**
 * RF-11: Muestra un toast de error con el mensaje apropiado
 * Proporciona retroalimentación visual inmediata al usuario sobre errores
 * 
 * @param error - Error a mostrar
 * @param context - Contexto adicional (opcional)
 */
export const showErrorToast = (error: any, context?: string): void => {
  let message = 'Error desconocido';
  
  if (typeof error === 'string') {
    message = error;
  } else if (error?.code) {
    // Error de Firebase
    message = handleFirebaseError(error);
  } else if (error?.message) {
    message = error.message;
  }
  
  // No mostrar toast para errores de ERR_ABORTED ya que se manejan automáticamente
  const errorMessage = error?.message || '';
  if (errorMessage.includes('net::ERR_ABORTED') || errorMessage.includes('ERR_ABORTED')) {
    if (__DEV__) {
      console.warn('⚠️ ERR_ABORTED detectado - manejado automáticamente');
    }
    return;
  }
  
  // RF-11: Mostrar toast de error para retroalimentación inmediata
  Toast.show({
    type: 'error',
    text1: 'Error',
    text2: message,
    visibilityTime: 4000 // RF-11: Tiempo suficiente para leer el mensaje
  });
  
  // Log del error para debugging
  logError(createAppError(ErrorType.UNKNOWN, message, error, context));
};

/**
 * RF-11: Muestra un toast de éxito
 * Proporciona retroalimentación positiva al usuario sobre acciones exitosas
 * 
 * @param message - Mensaje de éxito
 */
export const showSuccessToast = (message: string): void => {
  // RF-11: Toast de éxito para confirmar acciones completadas
  Toast.show({
    type: 'success',
    text1: 'Éxito',
    text2: message,
    visibilityTime: 3000 // RF-11: Duración optimizada para mensajes positivos
  });
};

/**
 * RF-11: Muestra un toast de información
 * Proporciona retroalimentación informativa al usuario sobre el estado del sistema
 * 
 * @param message - Mensaje informativo
 */
export const showInfoToast = (message: string): void => {
  // RF-11: Toast informativo para comunicar estados del sistema
  Toast.show({
    type: 'info',
    text1: 'Información',
    text2: message,
    visibilityTime: 3000 // RF-11: Duración estándar para mensajes informativos
  });
};

/**
 * RF-11: Registra errores para debugging y analytics
 * Sistema centralizado de logging con diferentes comportamientos por entorno
 * 
 * Comportamiento por entorno:
 * - Desarrollo: Console logging detallado con toda la información
 * - Producción: Preparado para integración con servicios de analytics
 * 
 * Información registrada:
 * - Tipo de error para categorización
 * - Mensaje amigable al usuario
 * - Contexto de origen del error
 * - Timestamp para análisis temporal
 * - Error original para debugging técnico
 * 
 * Integraciones futuras:
 * - Crashlytics para crash reporting
 * - Sentry para error tracking
 * - Analytics personalizados
 * 
 * @param {AppError} appError - Error estructurado de la aplicación
 * @returns {void}
 */
export const logError = (appError: AppError): void => {
  if (__DEV__) {
    console.error('App Error:', {
      type: appError.type,
      message: appError.message,
      context: appError.context,
      timestamp: appError.timestamp,
      originalError: appError.originalError
    });
  } else {
    // En producción, aquí se podría enviar a un servicio de analytics
    // como Crashlytics, Sentry, etc.
  }
};

/**
 * RF-11: Wrapper para funciones async con manejo automático de errores
 * Higher-order function que proporciona manejo consistente de errores y reintentos
 * 
 * Características principales:
 * - Manejo automático de errores con try-catch
 * - Reintento automático para errores ERR_ABORTED
 * - Logging centralizado de errores
 * - Toast opcional para feedback al usuario
 * - Retorno seguro (null en caso de error)
 * 
 * Flujo de ejecución:
 * 1. Ejecuta la función async proporcionada
 * 2. Si hay ERR_ABORTED, espera 1 segundo y reintenta
 * 3. Si persiste el error, crea AppError estructurado
 * 4. Registra el error en el sistema de logging
 * 5. Muestra toast si está habilitado
 * 6. Retorna resultado o null
 * 
 * Casos de uso:
 * - Llamadas a APIs que pueden fallar
 * - Operaciones de Firebase con reconexión
 * - Funciones críticas que requieren manejo robusto
 * 
 * @param {() => Promise<T>} asyncFn - Función async a ejecutar
 * @param {string} context - Contexto para identificar origen
 * @param {boolean} [showToast=true] - Si mostrar toast de error
 * @returns {Promise<T | null>} Resultado de la función o null si hay error
 */
export const withErrorHandling = async <T>(
  asyncFn: () => Promise<T>,
  context: string,
  showToast: boolean = true
): Promise<T | null> => {
  try {
    return await asyncFn();
  } catch (error: any) {
    const errorMessage = error?.message || '';
    
    // Para errores ERR_ABORTED, reintentar automáticamente
    if (errorMessage.includes('net::ERR_ABORTED') || errorMessage.includes('ERR_ABORTED')) {
      console.warn(`⚠️ ERR_ABORTED en ${context} - reintentando en 1 segundo...`);
      
      // Reintentar después de un breve delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      try {
        return await asyncFn();
      } catch (retryError: any) {
        console.error(`❌ Reintento fallido en ${context}:`, retryError);
      }
    }
    
    const appError = createAppError(
      ErrorType.UNKNOWN,
      error instanceof Error ? error.message : 'Error desconocido',
      error instanceof Error ? error : undefined,
      context
    );
    
    logError(appError);
    
    if (showToast) {
      showErrorToast(error, context);
    }
    
    return null;
  }
};

/**
 * RF-11: Valida el estado de conexión a internet en tiempo real
 * Utiliza NetInfo para verificar la conectividad actual del dispositivo
 * 
 * Funcionalidades:
 * - Detección en tiempo real de conectividad
 * - Compatibilidad con WiFi, datos móviles y ethernet
 * - Manejo seguro de valores null/undefined
 * - Respuesta inmediata para validaciones
 * 
 * Casos de uso:
 * - Validación antes de operaciones de red
 * - Mostrar indicadores de estado de conexión
 * - Condicionar funcionalidades según conectividad
 * - Prevenir errores de red innecesarios
 * 
 * @returns {Promise<boolean>} true si hay conexión activa, false en caso contrario
 */
export const checkNetworkConnection = async (): Promise<boolean> => {
  const netInfo = await NetInfo.fetch();
  return netInfo.isConnected ?? false;
};

/**
 * RF-11: Maneja errores de validación con retroalimentación específica
 * Procesa arrays de errores de validación y los presenta de forma amigable
 * 
 * Características:
 * - Manejo de errores únicos y múltiples
 * - Formato optimizado para legibilidad
 * - Toast con duración extendida para errores complejos
 * - Prevención de toasts vacíos
 * 
 * Formatos de mensaje:
 * - Error único: Muestra el mensaje directamente
 * - Múltiples errores: Lista numerada con resumen
 * - Sin errores: No muestra ningún toast
 * 
 * Casos de uso:
 * - Validación de formularios de reporte
 * - Validación de datos de usuario
 * - Verificación de campos obligatorios
 * - Validación de formatos de entrada
 * 
 * @param {string[]} errors - Array de mensajes de error de validación
 * @returns {void}
 */
export const handleValidationErrors = (errors: string[]): void => {
  if (errors.length === 0) return;
  
  const message = errors.length === 1 
    ? errors[0] 
    : `Se encontraron ${errors.length} errores:\n${errors.join('\n')}`;
  
  Toast.show({
    type: 'error',
    text1: 'Error de validación',
    text2: message,
    visibilityTime: 5000
  });
};