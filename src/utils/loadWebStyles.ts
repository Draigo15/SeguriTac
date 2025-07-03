// src/loadWebStyles.ts
import { Platform } from 'react-native';

export const loadWebStyles = () => {
  if (Platform.OS === 'web') {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.3/dist/leaflet.css';
    document.head.appendChild(link);
  }
};