/**
 * RNF-9 Seguridad de Sesiones - Aceptación (foco en almacenamiento seguro)
 *
 * Coberturas:
 * - secureStorage.removeItem elimina claves sensibles usando SecureStore y AsyncStorage (fallback)
 * - Claves sensibles incluyen 'user' y token de sesión configurable
 */

// Sin mocks globales: se aplican por prueba con jest.doMock para aislar mejor

describe('RNF-9 Seguridad de Sesiones - Aceptación (almacenamiento)', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  test('secureStorage.removeItem borra datos sensibles en SecureStore y AsyncStorage', async () => {
    const deleteItemAsyncMock = jest.fn(async () => {});
    const asyncRemoveItemMock = jest.fn(async () => {});
    // Mock por prueba como en RNF-2
    const secureStoreMock = {
      setItemAsync: jest.fn(async () => {}),
      getItemAsync: jest.fn(async () => null),
      deleteItemAsync: deleteItemAsyncMock,
    };
    jest.doMock('expo-secure-store', () => secureStoreMock);

    const asyncStorageMock = {
      setItem: jest.fn(async () => {}),
      getItem: jest.fn(async () => null),
      removeItem: asyncRemoveItemMock,
    };
    jest.doMock('@react-native-async-storage/async-storage', () => asyncStorageMock);

    const secureStorage = require('../src/services/secureStorage').default;

    await secureStorage.removeItem('user');

    expect(secureStoreMock.deleteItemAsync).toHaveBeenCalledTimes(1);
    expect(asyncStorageMock.removeItem).toHaveBeenCalledWith('user');
  });

  test('Claves sensibles definidas incluyen token de sesión en appConfig', () => {
    // Forzar entorno prod y mockear expo-constants como en RNF-2
    global.__DEV__ = false;
    jest.resetModules();
    jest.doMock('expo-constants', () => ({ expoConfig: { extra: {} } }), { virtual: true });

    const cfg = require('../src/config/appConfig').default;
    expect(cfg.app?.storage?.keys?.userToken).toBeTruthy();

    // Restaurar __DEV__
    global.__DEV__ = true;
  });
});