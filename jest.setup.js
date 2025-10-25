// Mock para expo-location
jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  getCurrentPositionAsync: jest.fn().mockResolvedValue({
    coords: {
      latitude: 37.78825,
      longitude: -122.4324,
      altitude: 0,
      accuracy: 0,
      altitudeAccuracy: 0,
      heading: 0,
      speed: 0,
    },
    timestamp: 1234567890,
  }),
  watchPositionAsync: jest.fn().mockReturnValue({
    remove: jest.fn(),
  }),
  hasServicesEnabledAsync: jest.fn().mockResolvedValue(true),
}));

// Mock para react-native
jest.mock('react-native', () => {
  const rn = jest.requireActual('react-native');
  rn.Animated = {
    ...rn.Animated,
    timing: jest.fn().mockReturnValue({
      start: jest.fn(callback => callback && callback()),
    }),
    loop: jest.fn().mockReturnValue({
      start: jest.fn(),
      stop: jest.fn(),
    }),
    Value: jest.fn().mockReturnValue({
      interpolate: jest.fn().mockReturnValue({}),
      setValue: jest.fn(),
    }),
  };
  rn.Alert = {
    alert: jest.fn(),
  };
  return rn;
});

// Mock para @react-navigation/native
jest.mock('@react-navigation/native', () => {
  return {
    useNavigation: jest.fn().mockReturnValue({
      navigate: jest.fn(),
      goBack: jest.fn(),
    }),
    useRoute: jest.fn().mockReturnValue({
      params: {},
    }),
  };
});

// Mock para expo-constants
jest.mock('expo-constants', () => ({
  default: {
    manifest: {
      extra: {
        apiUrl: 'https://mock-api-url.com',
      },
    },
  },
}));

// Mock para AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

// Configuración global para suprimir advertencias de console.error y console.warn durante las pruebas
global.console = {
  ...console,
  error: jest.fn(),
  warn: jest.fn(),
  log: jest.fn(),
};