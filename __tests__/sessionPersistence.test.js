/**
 * Escenario 2: Gestión de sesión
 * Persistencia de sesión al iniciar la app usando AuthLoadingScreen.
 * Debe navegar automáticamente a Home/AuthorityDashboard según el rol guardado.
 */

import React from 'react';
import { render, waitFor } from '@testing-library/react-native';

describe('AuthLoadingScreen - persistencia de sesión', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('navega a Home cuando el usuario autenticado tiene rol ciudadano (coincidente con almacenamiento)', async () => {
    const resetMock = jest.fn();

    // Usar mock global de navegación (singleton) y apuntar reset al espía
    const { useNavigation } = require('@react-navigation/native');
    const nav = useNavigation();
    nav.reset = resetMock;

    // Evitar dependencias de animación y hooks nativos con transiciones encadenables
    jest.doMock('react-native-reanimated', () => {
      const Reanimated = require('react-native-reanimated/mock');
      const chainable = () => {
        const api = {
          duration: jest.fn(() => api),
          delay: jest.fn(() => api),
          springify: jest.fn(() => api),
          withCallback: jest.fn(() => api),
        };
        return api;
      };
      Reanimated.default.call = () => {};
      return { __esModule: true, ...Reanimated, FadeIn: chainable(), ZoomIn: chainable() };
    });
    jest.doMock('../src/components/AnimatedScreen', () => ({ __esModule: true, default: ({ children }) => children }));

    // Mock de secureStorage: rol almacenado ciudadano
    jest.doMock('../src/services/secureStorage', () => ({
      __esModule: true,
      secureStorage: {
        getItem: jest.fn(async () => JSON.stringify({ role: 'ciudadano' })),
        removeItem: jest.fn(async () => {}),
        setItem: jest.fn(async () => {}),
      },
      default: {
        getItem: jest.fn(async () => JSON.stringify({ role: 'ciudadano' })),
        removeItem: jest.fn(async () => {}),
        setItem: jest.fn(async () => {}),
      },
    }));

    // Mock de Firebase auth y Firestore
    jest.doMock('../src/services/firebase', () => ({
      auth: {
        onAuthStateChanged: (cb) => { cb({ uid: 'u1', email: 't@e' }); return jest.fn(); },
      },
      db: {},
    }));
    jest.doMock('firebase/firestore', () => ({
      doc: jest.fn(() => ({})),
      getDoc: jest.fn(async () => ({ exists: () => true, data: () => ({ role: 'ciudadano' }) })),
    }));

    const AuthLoadingScreen = require('../src/screens/AuthLoadingScreen').default;

    render(<AuthLoadingScreen />);

    await waitFor(() => {
      expect(resetMock).toHaveBeenCalledWith({ index: 0, routes: [{ name: 'Home' }] });
    });
  });

  test('navega a AuthorityDashboard cuando el rol es autoridad (coincide con almacenamiento)', async () => {
    const resetMock = jest.fn();

    const { useNavigation: useNavigation2 } = require('@react-navigation/native');
    const nav2 = useNavigation2();
    nav2.reset = resetMock;
    // Ajustar implementaciones de mocks ya cargados en el primer test
    const storage = require('../src/services/secureStorage');
    if (storage.secureStorage?.getItem?.mockResolvedValue) {
      storage.secureStorage.getItem.mockResolvedValue(JSON.stringify({ role: 'autoridad' }));
    }
    if (storage.default?.getItem?.mockResolvedValue) {
      storage.default.getItem.mockResolvedValue(JSON.stringify({ role: 'autoridad' }));
    }
    const services = require('../src/services/firebase');
    services.auth.onAuthStateChanged = (cb) => { cb({ uid: 'u2', email: 'a@e' }); return jest.fn(); };
    const firestore = require('firebase/firestore');
    if (firestore.getDoc?.mockResolvedValue) {
      firestore.getDoc.mockResolvedValue({ exists: () => true, data: () => ({ role: 'autoridad' }) });
    }
    const AuthLoadingScreen = require('../src/screens/AuthLoadingScreen').default;
    render(<AuthLoadingScreen />);

    await waitFor(() => {
      expect(resetMock).toHaveBeenCalledWith({ index: 0, routes: [{ name: 'AuthorityDashboard' }] });
    });
  });
});