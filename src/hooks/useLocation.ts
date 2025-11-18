import { useState, useEffect, useCallback } from 'react';
import * as Location from 'expo-location';
import { Alert, Platform } from 'react-native';
import { appConfig } from '../config/appConfig';

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp?: number;
}

export interface LocationRegion extends LocationData {
  latitudeDelta: number;
  longitudeDelta: number;
}

export interface UseLocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
  watchPosition?: boolean;
  requestPermissionOnMount?: boolean;
}

export interface UseLocationReturn {
  location: LocationData | null;
  region: LocationRegion | null;
  loading: boolean;
  error: string | null;
  hasPermission: boolean;
  requestPermission: () => Promise<boolean>;
  getCurrentLocation: () => Promise<LocationData | null>;
  watchLocation: () => void;
  stopWatching: () => void;
  clearError: () => void;
}

const DEFAULT_OPTIONS: UseLocationOptions = {
  enableHighAccuracy: true,
  timeout: appConfig.timeouts.location,
  maximumAge: 60000, // 1 minuto
  watchPosition: false,
  requestPermissionOnMount: true,
};

const DEFAULT_REGION_DELTA = {
  latitudeDelta: 0.01,
  longitudeDelta: 0.01,
};

/**
 * Hook personalizado para gestión optimizada de ubicación en móvil
 * 
 * Características:
 * - Gestión automática de permisos
 * - Caché de ubicación para mejorar rendimiento
 * - Configuración de precisión optimizada para móvil
 * - Manejo de errores robusto
 * - Soporte para seguimiento de ubicación en tiempo real
 * 
 * @param options Opciones de configuración para el hook
 * @returns Objeto con estado y funciones de ubicación
 */
export const useLocation = (options: UseLocationOptions = {}): UseLocationReturn => {
  const config = { ...DEFAULT_OPTIONS, ...options };
  
  const [location, setLocation] = useState<LocationData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState(false);
  const [watchSubscription, setWatchSubscription] = useState<Location.LocationSubscription | null>(null);

  // Región calculada basada en la ubicación actual
  const region: LocationRegion | null = location ? {
    ...location,
    ...DEFAULT_REGION_DELTA,
  } : null;

  /**
   * Solicita permisos de ubicación al usuario
   */
  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      setError(null);
      
      // Verificar si ya tenemos permisos
      const { status: existingStatus } = await Location.getForegroundPermissionsAsync();
      
      if (existingStatus === 'granted') {
        setHasPermission(true);
        return true;
      }

      // Solicitar permisos
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status === 'granted') {
        setHasPermission(true);
        return true;
      } else {
        setHasPermission(false);
        setError('Permisos de ubicación denegados');
        
        if (Platform.OS !== 'web') {
          Alert.alert(
            'Permisos requeridos',
            'Esta aplicación necesita acceso a tu ubicación para funcionar correctamente. Por favor, habilita los permisos en la configuración.',
            [
              { text: 'Cancelar', style: 'cancel' },
              { text: 'Configuración', onPress: () => Location.requestForegroundPermissionsAsync() }
            ]
          );
        }
        return false;
      }
    } catch (err) {
      console.warn('Error requesting location permission:', err);
      setError('Error al solicitar permisos de ubicación');
      setHasPermission(false);
      return false;
    }
  }, []);

  /**
   * Obtiene la ubicación actual del usuario
   */
  const getCurrentLocation = useCallback(async (): Promise<LocationData | null> => {
    if (!hasPermission) {
      const granted = await requestPermission();
      if (!granted) return null;
    }

    setLoading(true);
    setError(null);

    try {
      const locationOptions: Location.LocationOptions = {
        accuracy: config.enableHighAccuracy 
          ? Location.Accuracy.High 
          : Location.Accuracy.Balanced,
      };

      // Agregar maximumAge solo si está definido
      if (config.maximumAge) {
        // Skip maximumAge as it's not supported in LocationOptions type
        // Consider using timeInterval instead if timing control is needed
      }

      const locationResult = await Location.getCurrentPositionAsync(locationOptions);
      
      const locationData: LocationData = {
        latitude: locationResult.coords.latitude,
        longitude: locationResult.coords.longitude,
        accuracy: locationResult.coords.accuracy || undefined,
        timestamp: locationResult.timestamp,
      };

      setLocation(locationData);
      return locationData;
    } catch (err) {
      console.warn('Error getting current location:', err);
      setError('No se pudo obtener la ubicación actual');
      // Mantener comportamiento seguro: devolver última ubicación conocida si existe
      return location;
    } finally {
      setLoading(false);
    }
  }, [hasPermission, requestPermission, config.enableHighAccuracy, config.maximumAge]);

  /**
   * Inicia el seguimiento de ubicación en tiempo real
   */
  const watchLocation = useCallback(async () => {
    if (!hasPermission) {
      const granted = await requestPermission();
      if (!granted) return;
    }

    // Detener seguimiento anterior si existe
    if (watchSubscription) {
      watchSubscription.remove();
    }

    try {
      const subscription = await Location.watchPositionAsync(
        {
          accuracy: config.enableHighAccuracy 
            ? Location.Accuracy.High 
            : Location.Accuracy.Balanced,
          timeInterval: 5000, // Actualizar cada 5 segundos
          distanceInterval: 10, // Actualizar cada 10 metros
        },
        (locationResult) => {
          const locationData: LocationData = {
            latitude: locationResult.coords.latitude,
            longitude: locationResult.coords.longitude,
            accuracy: locationResult.coords.accuracy || undefined,
            timestamp: locationResult.timestamp,
          };
          setLocation(locationData);
        }
      );

      setWatchSubscription(subscription);
    } catch (err) {
      console.warn('Error watching location:', err);
      setError('No se pudo iniciar el seguimiento de ubicación');
    }
  }, [hasPermission, requestPermission, config.enableHighAccuracy, watchSubscription]);

  /**
   * Detiene el seguimiento de ubicación
   */
  const stopWatching = useCallback(() => {
    if (watchSubscription) {
      watchSubscription.remove();
      setWatchSubscription(null);
    }
  }, [watchSubscription]);

  /**
   * Limpia el estado de error
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Efecto para solicitar permisos al montar el componente
  useEffect(() => {
    if (config.requestPermissionOnMount) {
      requestPermission().then((granted) => {
        if (granted) {
          // Obtener ubicación inicial automáticamente después de obtener permisos
          getCurrentLocation();
        }
      });
    }
  }, [config.requestPermissionOnMount, requestPermission, getCurrentLocation]);

  // Efecto para obtener ubicación inicial si se solicita seguimiento
  useEffect(() => {
    if (config.watchPosition && hasPermission) {
      watchLocation();
    }

    return () => {
      if (watchSubscription) {
        watchSubscription.remove();
      }
    };
  }, [config.watchPosition, hasPermission, watchLocation]);

  // Cleanup al desmontar
  useEffect(() => {
    return () => {
      if (watchSubscription) {
        watchSubscription.remove();
      }
    };
  }, []);

  return {
    location,
    region,
    loading,
    error,
    hasPermission,
    requestPermission,
    getCurrentLocation,
    watchLocation,
    stopWatching,
    clearError,
  };
};

export default useLocation;