/**
 * RNF-2 Aceptación: Seguridad (almacenamiento seguro y HTTPS en producción)
 */

describe('RNF-2 Seguridad - Aceptación', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  test('Usa SecureStore para claves sensibles (user) y no AsyncStorage', async () => {
    // Mock de expo-secure-store disponible
    const secureStoreMock = {
      setItemAsync: jest.fn(async () => {}),
      getItemAsync: jest.fn(async () => '{"ok":true}'),
      deleteItemAsync: jest.fn(async () => {}),
    };
    jest.doMock('expo-secure-store', () => secureStoreMock);

    // Mock de AsyncStorage (no debe usarse para claves sensibles)
    const asyncStorageMock = {
      setItem: jest.fn(async () => {}),
      getItem: jest.fn(async () => null),
      removeItem: jest.fn(async () => {}),
    };
    jest.doMock('@react-native-async-storage/async-storage', () => asyncStorageMock);

    const secureStorage = require('../src/services/secureStorage').default;

    // Act: almacenar/leer/borrar clave sensible 'user'
    await secureStorage.setItem('user', JSON.stringify({ id: 'u1', role: 'ciudadano' }));
    await secureStorage.getItem('user');
    await secureStorage.removeItem('user');

    // Assert: SecureStore usado, AsyncStorage no llamado para clave sensible
    expect(secureStoreMock.setItemAsync).toHaveBeenCalledTimes(1);
    expect(secureStoreMock.getItemAsync).toHaveBeenCalledTimes(1);
    expect(secureStoreMock.deleteItemAsync).toHaveBeenCalledTimes(1);

    expect(asyncStorageMock.setItem).not.toHaveBeenCalled();
    expect(asyncStorageMock.getItem).toHaveBeenCalledTimes(0);
    // removeItem de AsyncStorage puede llamarse como limpieza adicional; permitimos 0..1
    expect(asyncStorageMock.removeItem.mock.calls.length).toBeLessThanOrEqual(1);
  });

  test('Configuración de producción usa HTTPS y lo exige', async () => {
    // Forzar entorno de producción
    // Nota: __DEV__ es global en RN; lo redefinimos antes de importar el módulo
    global.__DEV__ = false;

    // Borrar cache del módulo para recalcular baseUrl según __DEV__
    jest.resetModules();

    // Mock ligero de expo-constants para evitar dependencias nativas
    jest.doMock('expo-constants', () => ({ expoConfig: { extra: {} } }), { virtual: true });

    const { apiConfig } = require('../src/config/appConfig');
    expect(apiConfig.isHttpsRequired).toBe(true);
    expect(apiConfig.baseUrl.startsWith('https://')).toBe(true);
    expect(apiConfig.isHttpsConfigured).toBe(true);

    // Restaurar valor por defecto de __DEV__ para otros tests
    global.__DEV__ = true;
  });
});