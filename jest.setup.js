// Mock para expo-location
jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  getForegroundPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
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

// Mock para expo-device
jest.mock('expo-device', () => ({
  isDevice: false,
  osInternalBuildId: 'mock',
  osVersion: '1.0.0',
}));

// Mock para @react-native-community/netinfo
jest.mock('@react-native-community/netinfo', () => ({
  addEventListener: jest.fn(),
  fetch: jest.fn().mockResolvedValue({
    type: 'wifi',
    isConnected: true,
    isInternetReachable: true,
    details: {},
  }),
}));

// Mock para expo-notifications
jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  addNotificationReceivedListener: jest.fn().mockReturnValue({ remove: jest.fn() }),
  addNotificationResponseReceivedListener: jest.fn().mockReturnValue({ remove: jest.fn() }),
  getPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted', canAskAgain: true, granted: true }),
  requestPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted', canAskAgain: true, granted: true }),
  getExpoPushTokenAsync: jest.fn().mockResolvedValue({ data: 'ExponentPushToken[MOCK]' }),
  getDevicePushTokenAsync: jest.fn().mockResolvedValue({ data: 'MOCK_DEVICE_PUSH_TOKEN' }),
  scheduleNotificationAsync: jest.fn().mockResolvedValue('MOCK_NOTIFICATION_ID'),
  cancelScheduledNotificationAsync: jest.fn().mockResolvedValue(undefined),
  cancelAllScheduledNotificationsAsync: jest.fn().mockResolvedValue(undefined),
  getAllScheduledNotificationsAsync: jest.fn().mockResolvedValue([]),
  setBadgeCountAsync: jest.fn().mockResolvedValue(undefined),
  setNotificationCategoryAsync: jest.fn().mockResolvedValue(undefined),
  setNotificationChannelAsync: jest.fn().mockResolvedValue(undefined),
  AndroidImportance: { NONE: 0, MIN: 1, LOW: 2, DEFAULT: 3, HIGH: 4, MAX: 5 },
  AndroidNotificationPriority: { MIN: -2, LOW: -1, DEFAULT: 0, HIGH: 1, MAX: 2 },
  SchedulableTriggerInputTypes: { DATE: 'date', TIME_INTERVAL: 'timeInterval' },
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

// Mock para react-native-reanimated (evita dependencias nativas en animaciones)
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  // Stubs encadenables para transiciones usadas en la app
  const mkTransition = () => {
    const api = {
      duration: jest.fn(() => api),
      delay: jest.fn(() => api),
      springify: jest.fn(() => api),
      withCallback: jest.fn(() => api),
    };
    return api;
  };
  return {
    ...Reanimated,
    FadeInDown: mkTransition(),
    FadeInUp: mkTransition(),
    ZoomIn: mkTransition(),
  };
});
const Reanimated = require('react-native-reanimated');
Reanimated.default.addWhitelistedUIProps({});

// Mock para @react-navigation/native
jest.mock('@react-navigation/native', () => {
  const navigationSingleton = {
    navigate: jest.fn(),
    goBack: jest.fn(),
    reset: jest.fn(),
  };
  return {
    useNavigation: jest.fn().mockImplementation(() => navigationSingleton),
    useRoute: jest.fn().mockReturnValue({ params: {} }),
  };
});

// Mock para expo-constants (evita dependencias nativas y alinea con uso de expoConfig)
jest.mock('expo-constants', () => ({
  __esModule: true,
  default: {
    expoConfig: {
      extra: {
        apiUrl: 'https://mock-api-url.com',
      },
    },
  },
  expoConfig: {
    extra: {
      apiUrl: 'https://mock-api-url.com',
    },
  },
}));

// Mock para AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

// Mock para expo-secure-store (evita requireNativeModule en entorno de pruebas)
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async () => null),
  setItemAsync: jest.fn(async () => {}),
  deleteItemAsync: jest.fn(async () => {}),
}));

// Mock para react-native-view-shot (captura de vistas)
jest.mock('react-native-view-shot', () => {
  const React = require('react');
  const View = ({ children }) => children || null;
  const forwardRef = (component) => component;
  const ViewShot = forwardRef(View);
  ViewShot.capture = async () => '';
  return {
    __esModule: true,
    default: ViewShot,
  };
});

// Mock para expo-sharing
jest.mock('expo-sharing', () => ({
  __esModule: true,
  isAvailableAsync: async () => true,
  shareAsync: async () => {},
}));

// Mock para expo-file-system
jest.mock('expo-file-system', () => ({
  __esModule: true,
  cacheDirectory: '/tmp/',
  EncodingType: { Base64: 'base64' },
  writeAsStringAsync: async () => {},
}));

// Configuración global para suprimir advertencias de console.error y console.warn durante las pruebas
// Permitir logs reales durante pruebas para facilitar diagnóstico
global.console = {
  ...console,
  error: console.error,
  warn: console.warn,
  log: console.log,
};

// Mock para @expo/vector-icons (evita dependencia de expo-font y EventEmitter)
jest.mock('@expo/vector-icons', () => ({
  Ionicons: () => null,
}));

// Mock para react-native-webview (evita renderizado real de WebView)
jest.mock('react-native-webview', () => ({
  WebView: () => null,
}));

// Mock para @react-native-picker/picker
jest.mock('@react-native-picker/picker', () => {
  const React = require('react');
  const { View, Text } = require('react-native');
  const Picker = ({ children, testID, onValueChange, selectedValue }) => (
    React.createElement(View, { testID, onValueChange, selectedValue }, children)
  );
  Picker.Item = ({ label, value }) => (
    React.createElement(Text, { accessibilityLabel: label, value }, label)
  );
  return { Picker };
});

// Mock básico para react-native-paper ActivityIndicator
jest.mock('react-native-paper', () => {
  const ActivityIndicator = () => null;
  return { ActivityIndicator };
});

// Mock para expo-modules-core (evita referencias a EventEmitter y módulos nativos)
jest.mock('expo-modules-core', () => ({
  __esModule: true,
  EventEmitter: class {},
  NativeModulesProxy: {},
  requireOptionalNativeModule: () => ({}),
}));