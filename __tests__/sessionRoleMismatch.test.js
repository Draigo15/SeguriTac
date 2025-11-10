/**
 * Escenario 2: Gestión de sesión
 * Rol inconsistente entre Firestore y almacenamiento local.
 * Debe forzar signOut, limpiar almacenamiento y navegar a RoleSelector.
 */

import React from 'react';
import { render, waitFor } from '@testing-library/react-native';

describe('AuthLoadingScreen - rol inconsistente', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('signOut y reset a RoleSelector cuando el rol almacenado no coincide con Firestore', async () => {
    const resetMock = jest.fn();
    const removeItemMock = jest.fn(async () => {});
    const signOutMock = jest.fn(async () => {});

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

    jest.doMock('@react-navigation/native', () => ({
      useNavigation: () => ({ reset: resetMock, navigate: jest.fn(), goBack: jest.fn() }),
      useRoute: () => ({ params: {} }),
    }));

    // Mock consistente con named export y default export
    jest.doMock('../src/services/secureStorage', () => ({
      __esModule: true,
      secureStorage: {
        getItem: jest.fn(async () => JSON.stringify({ role: 'autoridad' })), // almacenado autoridad
        removeItem: removeItemMock,
        setItem: jest.fn(async () => {}),
      },
      default: {
        getItem: jest.fn(async () => JSON.stringify({ role: 'autoridad' })),
        removeItem: removeItemMock,
        setItem: jest.fn(async () => {}),
      },
    }));

    jest.doMock('../src/services/firebase', () => ({
      auth: {
        onAuthStateChanged: (cb) => { cb({ uid: 'u1', email: 't@e' }); return jest.fn(); },
        signOut: signOutMock,
      },
      db: {},
    }));
    jest.doMock('firebase/firestore', () => ({
      doc: jest.fn(() => ({})),
      getDoc: jest.fn(async () => ({ exists: () => true, data: () => ({ role: 'ciudadano' }) })), // Firestore: ciudadano
    }));

    const AuthLoadingScreen = require('../src/screens/AuthLoadingScreen').default;
    render(<AuthLoadingScreen />);

    await waitFor(() => {
      expect(signOutMock).toHaveBeenCalledTimes(1);
      expect(removeItemMock).toHaveBeenCalledWith('user');
      expect(resetMock).toHaveBeenCalledWith({ index: 0, routes: [{ name: 'RoleSelector' }] });
    });
  });
});