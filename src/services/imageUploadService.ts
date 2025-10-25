/**
 * Servicio para manejar la subida de imágenes a Firebase Storage
 */

import { storage } from './firebase';
import { ref, uploadBytes, getDownloadURL, listAll } from 'firebase/storage';
import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';

/**
 * Convierte una imagen a base64 para móvil (sin Firebase Storage)
 * @param imageUri - URI local de la imagen
 * @returns Promise<string> - Imagen en formato base64
 */
export const convertImageToBase64 = async (imageUri: string): Promise<string> => {
  try {
    console.log('🔄 Convirtiendo imagen a base64:', imageUri);
    
    if (Platform.OS === 'web') {
      // En web, usar fetch para convertir a base64
      const response = await fetch(imageUri);
      const blob = await response.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } else {
      // En móvil, usar FileSystem de Expo
      const base64 = await FileSystem.readAsStringAsync(imageUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      return `data:image/jpeg;base64,${base64}`;
    }
  } catch (error: any) {
    console.error('❌ Error al convertir imagen a base64:', error);
    throw new Error(`Error al procesar imagen: ${error.message}`);
  }
};

/**
 * Función de diagnóstico para verificar la conectividad con Firebase Storage
 * @returns Promise<boolean> - true si Storage está funcionando correctamente
 */
export const testStorageConnection = async (): Promise<{ isWorking: boolean; error?: string }> => {
  try {
    console.log('🔍 Probando conexión con Firebase Storage...');
    
    // Intentar crear una referencia simple (no requiere permisos de lectura)
    const testRef = ref(storage, 'test-connection');
    console.log('✅ Referencia de Storage creada exitosamente:', testRef.toString());
    
    return { isWorking: true };
  } catch (error: any) {
    console.error('❌ Error en conexión con Storage:', error);
    return { 
      isWorking: false, 
      error: error?.message || 'Error desconocido en Storage' 
    };
  }
};

/**
 * Función alternativa de subida usando un enfoque más simple
 * @param imageUri - URI de la imagen
 * @param folder - Carpeta de destino
 * @returns Promise<string> - URL de descarga
 */
export const uploadImageAlternative = async (
  imageUri: string,
  folder: string = 'reports'
): Promise<string> => {
  try {
    console.log('🔄 Intentando método alternativo de subida...');
    
    // Crear un blob más simple
    const response = await fetch(imageUri);
    if (!response.ok) {
      throw new Error(`Error al obtener imagen: ${response.status}`);
    }
    
    const arrayBuffer = await response.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    
    // Crear referencia con nombre más simple
    const fileName = `img_${Date.now()}.jpg`;
    const storageRef = ref(storage, `${folder}/${fileName}`);
    
    console.log('📤 Subiendo con método alternativo...');
    const snapshot = await uploadBytes(storageRef, uint8Array, {
      contentType: 'image/jpeg'
    });
    
    const downloadURL = await getDownloadURL(snapshot.ref);
    console.log('✅ Subida alternativa exitosa:', downloadURL);
    
    return downloadURL;
  } catch (error: any) {
    console.error('❌ Error en método alternativo:', error);
    throw error;
  }
};

/**
 * Sube una imagen para móvil sin Firebase Storage (usando base64)
 * @param imageUri - URI local de la imagen
 * @returns Promise<string> - Imagen en formato base64
 */
export const uploadImageMobile = async (imageUri: string): Promise<string> => {
  try {
    console.log('📱 Procesando imagen para móvil (sin Firebase Storage):', imageUri);
    
    // Convertir imagen a base64
    const base64Image = await convertImageToBase64(imageUri);
    
    // Validar tamaño de la imagen base64 (máximo ~1MB en base64)
    const sizeInBytes = base64Image.length * 0.75; // Aproximación del tamaño real
    const maxSizeInMB = 1;
    
    if (sizeInBytes > maxSizeInMB * 1024 * 1024) {
      throw new Error(`La imagen es demasiado grande (${(sizeInBytes / (1024 * 1024)).toFixed(2)}MB). Máximo permitido: ${maxSizeInMB}MB`);
    }
    
    console.log('✅ Imagen procesada exitosamente para móvil');
    return base64Image;
  } catch (error: any) {
    console.error('❌ Error al procesar imagen para móvil:', error);
    throw error;
  }
};

/**
 * Sube una imagen a Firebase Storage y retorna la URL de descarga
 * @param imageUri - URI local de la imagen
 * @param folder - Carpeta donde guardar la imagen (por defecto 'reports')
 * @returns Promise<string> - URL de descarga de la imagen
 */
export const uploadImageToStorage = async (
  imageUri: string, 
  folder: string = 'reports'
): Promise<string> => {
  try {
    console.log('🔍 Iniciando subida de imagen:', { imageUri, folder, platform: Platform.OS });
    
    // Validar URI de entrada
    if (!imageUri || typeof imageUri !== 'string') {
      throw new Error('URI de imagen inválida o vacía');
    }

    // Verificar autenticación del usuario
    const { auth } = await import('./firebase');
    if (!auth.currentUser) {
      throw new Error('Usuario no autenticado. Inicia sesión para subir imágenes.');
    }

    // Diagnóstico inicial de Storage
    console.log('🔍 Verificando conectividad con Firebase Storage...');
    const storageTest = await testStorageConnection();
    if (!storageTest.isWorking) {
      console.error('❌ Firebase Storage no está disponible:', storageTest.error);
      throw new Error(`Firebase Storage no disponible: ${storageTest.error}`);
    }
    console.log('✅ Firebase Storage está funcionando correctamente');

    // Generar nombre único para la imagen
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 15);
    const fileName = `${folder}_${timestamp}_${randomId}.jpg`;
    const storageRef = ref(storage, `${folder}/${fileName}`);

    let blob: Blob;

    try {
      if (Platform.OS === 'web') {
        // En web, manejar diferentes tipos de URI
        if (imageUri.startsWith('data:')) {
          // URI de datos base64
          const response = await fetch(imageUri);
          blob = await response.blob();
        } else if (imageUri.startsWith('blob:')) {
          // URI de blob
          const response = await fetch(imageUri);
          blob = await response.blob();
        } else {
          // Otras URIs
          const response = await fetch(imageUri);
          if (!response.ok) {
            throw new Error(`Error al obtener imagen: ${response.status} ${response.statusText}`);
          }
          blob = await response.blob();
        }
      } else {
        // En móvil, convertir la URI a blob
        const response = await fetch(imageUri);
        if (!response.ok) {
          throw new Error(`Error al obtener imagen: ${response.status} ${response.statusText}`);
        }
        blob = await response.blob();
      }
    } catch (fetchError) {
      console.error('❌ Error al convertir URI a blob:', fetchError);
      throw new Error(`No se pudo procesar la imagen: ${fetchError instanceof Error ? fetchError.message : 'Error desconocido'}`);
    }

    // Validar que el blob sea válido
    if (!blob || blob.size === 0) {
      throw new Error('La imagen está vacía o corrupta');
    }

    // Validar tamaño de imagen (máximo 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (blob.size > maxSize) {
      throw new Error('La imagen es demasiado grande. Máximo permitido: 10MB');
    }

    console.log('📊 Información del blob:', { size: blob.size, type: blob.type });

    // Subir la imagen con reintentos
    console.log('📤 Subiendo imagen a Firebase Storage...');
    let uploadAttempts = 0;
    const maxAttempts = 3;
    
    while (uploadAttempts < maxAttempts) {
      try {
        const snapshot = await uploadBytes(storageRef, blob);
        
        // Obtener URL de descarga
        const downloadURL = await getDownloadURL(snapshot.ref);
        console.log('✅ Imagen subida exitosamente:', downloadURL);
        
        return downloadURL;
      } catch (uploadError: any) {
          uploadAttempts++;
          console.error(`❌ Intento ${uploadAttempts} fallido:`, {
            error: uploadError,
            code: uploadError?.code,
            message: uploadError?.message,
            serverResponse: uploadError?.serverResponse,
            customData: uploadError?.customData,
            stack: uploadError?.stack
          });
          
          // Para el error storage/unknown, intentar obtener más información
          if (uploadError?.code === 'storage/unknown') {
            console.error('🔍 Diagnóstico detallado del error storage/unknown:', {
              storageRef: storageRef.toString(),
              blobSize: blob.size,
              blobType: blob.type,
              userEmail: auth.currentUser?.email,
              projectId: storage.app.options.projectId,
              storageBucket: storage.app.options.storageBucket
            });
          }
          
          // Si es el último intento o un error no recuperable, lanzar el error
          if (uploadAttempts >= maxAttempts || isNonRetryableError(uploadError)) {
            throw uploadError;
          }
          
          // Esperar antes del siguiente intento
          await new Promise(resolve => setTimeout(resolve, 1000 * uploadAttempts));
        }
    }
    
    throw new Error('No se pudo subir la imagen después de varios intentos');
  } catch (error: any) {
    console.error('❌ Error al subir imagen:', error);
    
    // Si es un error storage/unknown, intentar método alternativo
    if (error?.code === 'storage/unknown') {
      console.log('🔄 Intentando método alternativo debido a error storage/unknown...');
      try {
        const alternativeResult = await uploadImageAlternative(imageUri, folder);
        console.log('✅ Método alternativo exitoso');
        return alternativeResult;
      } catch (alternativeError: any) {
        console.error('❌ Método alternativo también falló:', alternativeError);
        // Continuar con el manejo de error original
      }
    }
    
    // Manejar errores específicos de Firebase Storage
    const errorMessage = getStorageErrorMessage(error);
    throw new Error(errorMessage);
  }
};

/**
 * Determina si un error de Firebase Storage no es recuperable
 * @param error - Error de Firebase Storage
 * @returns boolean - true si no es recuperable
 */
const isNonRetryableError = (error: any): boolean => {
  const nonRetryableCodes = [
    'storage/unauthorized',
    'storage/invalid-format',
    'storage/invalid-argument',
    'storage/object-not-found',
    'storage/bucket-not-found',
    'storage/project-not-found',
    'storage/quota-exceeded',
    'storage/unauthenticated'
  ];
  
  return nonRetryableCodes.includes(error?.code);
};

/**
 * Convierte errores de Firebase Storage en mensajes amigables
 * @param error - Error de Firebase Storage
 * @returns string - Mensaje de error amigable
 */
const getStorageErrorMessage = (error: any): string => {
  const errorCode = error?.code;
  
  switch (errorCode) {
    case 'storage/unauthorized':
      return 'No tienes permisos para subir imágenes. Verifica tu cuenta.';
    case 'storage/unauthenticated':
      return 'Debes iniciar sesión para subir imágenes.';
    case 'storage/quota-exceeded':
      return 'Se ha excedido el límite de almacenamiento. Intenta más tarde.';
    case 'storage/invalid-format':
      return 'Formato de imagen no válido. Usa JPG, PNG o GIF.';
    case 'storage/object-not-found':
      return 'No se encontró el archivo en el servidor.';
    case 'storage/bucket-not-found':
      return 'Error de configuración del almacenamiento.';
    case 'storage/project-not-found':
      return 'Error de configuración del proyecto.';
    case 'storage/retry-limit-exceeded':
      return 'Se agotaron los intentos de subida. Verifica tu conexión.';
    case 'storage/invalid-argument':
      return 'Datos de imagen inválidos.';
    case 'storage/no-default-bucket':
      return 'Error de configuración del almacenamiento.';
    case 'storage/cannot-slice-blob':
      return 'Error al procesar la imagen. Intenta con otra imagen.';
    case 'storage/server-file-wrong-size':
      return 'Error de tamaño de archivo en el servidor.';
    case 'storage/unknown':
    default:
      const baseMessage = 'Error al subir la imagen';
      const errorMessage = error?.message || error?.toString() || 'Error desconocido';
      
      // Si hay información adicional del error, incluirla
      if (errorMessage && errorMessage !== 'Error desconocido') {
        return `${baseMessage}: ${errorMessage}`;
      }
      
      return `${baseMessage}. Verifica tu conexión e intenta nuevamente.`;
  }
};

/**
 * Valida si una URI de imagen es válida
 * @param imageUri - URI de la imagen a validar
 * @returns boolean - true si es válida, false en caso contrario
 */
export const isValidImageUri = (imageUri: string | null | undefined): boolean => {
  if (!imageUri) return false;
  
  // Verificar si es una URL de Firebase Storage o una URI local válida
  return (
    imageUri.startsWith('https://firebasestorage.googleapis.com') ||
    imageUri.startsWith('file://') ||
    imageUri.startsWith('content://') ||
    imageUri.startsWith('data:image/') ||
    imageUri.startsWith('http://') ||
    imageUri.startsWith('https://')
  );
};

/**
 * Convierte una URI local a una URL accesible para web
 * @param imageUri - URI de la imagen
 * @returns string - URL procesada
 */
export const processImageUri = (imageUri: string): string => {
  // Si ya es una URL de Firebase Storage, devolverla tal como está
  if (imageUri.startsWith('https://firebasestorage.googleapis.com')) {
    return imageUri;
  }
  
  // Si es una URI local en web, intentar procesarla
  if (Platform.OS === 'web' && imageUri.startsWith('file://')) {
    console.warn('⚠️ URI local detectada en web:', imageUri);
    return imageUri; // En web, las URIs locales no funcionarán
  }
  
  return imageUri;
};