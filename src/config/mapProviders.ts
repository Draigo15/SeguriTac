import { Platform } from 'react-native';

/**
 * Configuración de proveedores de mapas alternativos
 * Elimina la dependencia de Google Maps
 */

export const MAP_PROVIDERS = {
  // OpenStreetMap - Gratuito y sin límites
  OPENSTREETMAP: {
    name: 'OpenStreetMap',
    urlTemplate: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '© OpenStreetMap contributors',
    maxZoom: 19,
    subdomains: ['a', 'b', 'c'],
  },
  
  // Mapbox - Requiere API key pero muy personalizable
  MAPBOX: {
    name: 'Mapbox',
    urlTemplate: 'https://api.mapbox.com/styles/v1/mapbox/streets-v11/tiles/{z}/{x}/{y}?access_token={accessToken}',
    attribution: '© Mapbox © OpenStreetMap',
    maxZoom: 22,
  },
  
  // CartoDB - Estilo limpio y gratuito
  CARTODB: {
    name: 'CartoDB',
    urlTemplate: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    attribution: '© OpenStreetMap © CartoDB',
    maxZoom: 19,
    subdomains: ['a', 'b', 'c', 'd'],
  },
};

/**
 * Configuración por defecto según plataforma
 */
export const getDefaultMapProvider = () => {
  if (Platform.OS === 'web') {
    return MAP_PROVIDERS.OPENSTREETMAP;
  }
  
  // En móvil, usar mapas del sistema (Apple Maps en iOS, OpenStreetMap en Android)
  return null; // null = usar provider por defecto del sistema
};

/**
 * Configuración de región por defecto (Tacna, Perú)
 */
export const DEFAULT_REGION = {
  latitude: -18.0137,
  longitude: -70.25,
  latitudeDelta: 0.01,
  longitudeDelta: 0.01,
};