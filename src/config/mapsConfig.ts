import Constants from 'expo-constants';
import { Platform } from 'react-native';

/**
 * Configuración centralizada para Google Maps
 */
export const mapsConfig = {
  // API Key de Google Maps
  googleMapsApiKey:
    Constants.expoConfig?.extra?.GOOGLE_MAPS_API_KEY || 'AIzaSyBdVl-cTICSwYKrZ95SuvNw7dbMuDt1KG0',

  // Configuración por defecto del mapa
  defaultRegion: {
    latitude: -18.0137, // Tacna, Perú
    longitude: -70.25,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  },
  leafletIcons: {
    default: '',
    defaultRetina: '',
    shadow: '',
    red: '',
    orange: '',
    green: '',
    blue: '',
  },

  // Configuración de zoom
  defaultZoom: 15,

  // Configuración para Leaflet (solo web)
  ...(Platform.OS === 'web' && {
    tileLayerUrl: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    tileLayerAttribution: '&copy; <a href="https://openstreetmap.org">OpenStreetMap</a> contributors',
    leafletIcons: {
      default: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      defaultRetina: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      shadow: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      red: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
      orange:
        'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-orange.png',
      green:
        'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
      blue: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
    },
  }),
};

/**
 * Obtiene el color del marcador según el estado del reporte
 */
export const getMarkerColorByStatus = (status: string): string => {
  switch (status?.toLowerCase()) {
    case 'resuelto':
      return '#4CAF50'; // Verde
    case 'en proceso':
    case 'en_proceso':
      return '#FF9800'; // Naranja
    case 'pendiente':
    default:
      return '#F44336'; // Rojo
  }
};

/**
 * Obtiene la URL del icono de Leaflet según el estado (solo web)
 */
export const getLeafletIconByStatus = (status: string): string | undefined => {
  if (Platform.OS !== 'web') return undefined;
  switch (status?.toLowerCase()) {
    case 'resuelto':
      return mapsConfig.leafletIcons.green;
    case 'en proceso':
    case 'en_proceso':
      return mapsConfig.leafletIcons.orange;
    case 'pendiente':
    default:
      return mapsConfig.leafletIcons.red;
  }
};
