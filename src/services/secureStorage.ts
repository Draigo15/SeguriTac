import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Claves que deben almacenarse cifradas (en reposo)
const SENSITIVE_KEYS = new Set<string>([
  'user',
  '@user_token',
  '@user_profile',
]);

async function setItem(key: string, value: string): Promise<void> {
  if (SENSITIVE_KEYS.has(key)) {
    try {
      await SecureStore.setItemAsync(key, value, {
        keychainService: 'seguridad-ciudadana',
      });
      return;
    } catch (e) {
      // Fallback a AsyncStorage sólo si SecureStore falla (p.ej., web)
    }
  }
  await AsyncStorage.setItem(key, value);
}

async function getItem(key: string): Promise<string | null> {
  if (SENSITIVE_KEYS.has(key)) {
    try {
      const v = await SecureStore.getItemAsync(key, {
        keychainService: 'seguridad-ciudadana',
      });
      if (v !== null) return v;
    } catch (e) {
      // Fallback a AsyncStorage si no disponible
    }
  }
  return AsyncStorage.getItem(key);
}

async function removeItem(key: string): Promise<void> {
  if (SENSITIVE_KEYS.has(key)) {
    try {
      await SecureStore.deleteItemAsync(key, {
        keychainService: 'seguridad-ciudadana',
      });
      // También eliminar de AsyncStorage por si existiera
      await AsyncStorage.removeItem(key);
      return;
    } catch (e) {
      // Fallback a AsyncStorage
    }
  }
  await AsyncStorage.removeItem(key);
}

// Helpers JSON
async function setJSON<T>(key: string, value: T): Promise<void> {
  return setItem(key, JSON.stringify(value));
}

async function getJSON<T>(key: string): Promise<T | null> {
  const raw = await getItem(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export const secureStorage = {
  setItem,
  getItem,
  removeItem,
  setJSON,
  getJSON,
};

export default secureStorage;