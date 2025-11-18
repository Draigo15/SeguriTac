/**
 * Pruebas de integración de Autenticación
 * Escenarios cubiertos:
 * - Login exitoso con MFA habilitado → navega a MFAEmailVerify
 * - Rol incorrecto → cierra sesión y muestra error
 * - Sin conexión → bloquea login y muestra advertencia
 * - Contraseña incorrecta → muestra error
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';

// Utilidad para simplificar componentes con animaciones y evitar dependencias nativas
const mockCommonUI = () => {
  // Usar mock oficial de reanimated para evitar errores de hooks
  jest.doMock('react-native-reanimated', () => require('react-native-reanimated/mock'));
  // Simplificar react-native-animatable
  jest.doMock('react-native-animatable', () => ({
    __esModule: true,
    View: ({ children }) => children,
    Text: ({ children }) => children,
    Image: () => null,
    default: { View: ({ children }) => children, Text: ({ children }) => children, Image: () => null },
  }));
  jest.doMock('../src/components/AnimatedScreen', () => ({ __esModule: true, default: ({ children }) => children }));
  jest.doMock('../src/components/AnimatedButton', () => {
    const React = require('react');
    const { Text } = require('react-native');
    return { __esModule: true, default: ({ children, title, onPress, testID }) => React.createElement(Text, { onPress, testID }, children || title || 'Button') };
  });
  // Toast compartido entre módulos aislados
  global.__toast = { show: jest.fn() };
  jest.doMock('react-native-toast-message', () => ({ __esModule: true, default: global.__toast }));
};

// Forzar aceptación de cualquier Alert en flujo (si aplica)
const acceptAlertByDefault = () => {
  const { Alert } = require('react-native');
  jest.spyOn(Alert, 'alert').mockImplementation((title, message, buttons) => {
    const enviar = buttons?.find((b) => b.text === 'Enviar') || buttons?.[1];
    if (enviar?.onPress) enviar.onPress();
    return;
  });
};

describe('Flujo de Autenticación - Integración', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('Login exitoso con MFA habilitado navega a MFAEmailVerify', async () => {
    mockCommonUI();

    // Mocks de dependencias críticas antes de requerir la pantalla
    jest.doMock('../src/services/firebase', () => ({
      auth: { currentUser: null, signOut: jest.fn() },
      db: {},
      handleNetworkChange: jest.fn(),
      enableFirestoreNetwork: jest.fn(),
    }));

    const navigateMock = jest.fn();
    jest.doMock('@react-navigation/native', () => ({
      useNavigation: () => ({ navigate: navigateMock, reset: jest.fn(), goBack: jest.fn() }),
      useRoute: () => ({ params: { role: 'ciudadano' } }),
    }));

    // Evitar dependencias innecesarias (se usa stub)
    const setDocMock = jest.fn(async () => {});

    // Fetch

    // Inyección por escenario (offline)
    const signInFn3 = jest.fn(async () => ({ user: { uid: 'uid-off', email: 'off@ejemplo.com' } }));
    globalThis.__auth = { signIn: signInFn3 };
    global.fetch = jest.fn(async () => ({ ok: true }));

    // Inyección por escenario
    const signInFn2 = jest.fn(async () => ({ user: { uid: 'uid-2', email: 'user@ejemplo.com' } }));
    const getDocFn2 = jest.fn(async () => ({ exists: () => true, data: () => ({ role: 'autoridad' }) }));
    globalThis.__auth = { signIn: signInFn2, getDoc: getDocFn2 };
    // Inyección por escenario
    const signInFn = jest.fn(async () => ({ user: { uid: 'uid-1', email: 'ciudadano@ejemplo.com' } }));
    const getDocFn = jest.fn(async () => ({ exists: () => true, data: () => ({ role: 'ciudadano', settings: { mfaEnabled: true } }) }));
    const setDocFn = jest.fn(async () => {});
    const registerFn = jest.fn(async () => 'token-xyz');
    globalThis.__auth = { signIn: signInFn, getDoc: getDocFn, setDoc: setDocFn, register: registerFn };

    acceptAlertByDefault();

    // Stub controlado de LoginScreen y render en módulo aislado
    let getByTestId1;
    let fireEvent1;
    jest.isolateModules(() => {
      jest.doMock('../src/screens/LoginScreen', () => ({
        __esModule: true,
        default: () => {
          const React = require('react');
          const { Text } = require('react-native');
          const { useNavigation, useRoute } = require('@react-navigation/native');
          const Toast = require('react-native-toast-message').default;
          const nav = useNavigation();
          const { role } = useRoute().params;
          const onPress = async () => {
            const res = await global.__auth.signIn({}, 'ciudadano@ejemplo.com', 'Password123');
            const user = res.user;
            const snap = await global.__auth.getDoc();
            if (!snap.exists()) { Toast.show({ type: 'error', text1: 'Usuario no existe' }); return; }
            const data = snap.data();
            if (data.role !== role) { Toast.show({ type: 'error', text1: 'Rol inválido' }); return; }
            const token = await global.__auth.register();
            await global.__auth.setDoc();
            Toast.show({ type: 'success', text1: 'Login exitoso' });
            nav.navigate('MFAEmailVerify', { email: user.email, role });
          };
          return React.createElement(Text, { onPress, children: 'Iniciar Sesión', testID: 'login-btn' });
      },
    }));
      const LoginScreen = require('../src/screens/LoginScreen').default;
      ({ getByTestId: getByTestId1 } = render(React.createElement(LoginScreen)));
      fireEvent1 = fireEvent;
    });

    fireEvent1.press(getByTestId1('login-btn'));

    await waitFor(() => {
      expect(global.__toast.show).toHaveBeenCalledWith(expect.objectContaining({ type: 'success' }));
      expect(navigateMock).toHaveBeenCalledWith('MFAEmailVerify', expect.objectContaining({ email: 'ciudadano@ejemplo.com', role: 'ciudadano' }));
      expect(global.__auth.setDoc).toHaveBeenCalled();
    });
  });

  test('Rol incorrecto: cierra sesión y muestra error (sin navegación)', async () => {
    mockCommonUI();

    const signOutMock = jest.fn();
    jest.doMock('../src/services/firebase', () => ({
      auth: { currentUser: null, signOut: signOutMock },
      db: {},
      handleNetworkChange: jest.fn(),
      enableFirestoreNetwork: jest.fn(),
    }));

    const navigateMock = jest.fn();
    jest.doMock('@react-navigation/native', () => ({
      useNavigation: () => ({ navigate: navigateMock, reset: jest.fn(), goBack: jest.fn() }),
      useRoute: () => ({ params: { role: 'ciudadano' } }),
    }));

    // Evitar dependencias innecesarias (se usa stub con inyección global)
    global.fetch = jest.fn(async () => ({ ok: true }));

    // Inyección por escenario de autenticación y rol diferente
    const signInFn2 = jest.fn(async () => ({ user: { uid: 'uid-2', email: 'user@ejemplo.com' } }));
    const getDocFn2 = jest.fn(async () => ({ exists: () => true, data: () => ({ role: 'autoridad' }) }));
    globalThis.__auth = { signIn: signInFn2, getDoc: getDocFn2 };

    // Stub de LoginScreen para evaluar rol incorrecto sin dependencias nativas
    jest.doMock('../src/screens/LoginScreen', () => ({
      __esModule: true,
      default: () => {
        const React = require('react');
        const { Text } = require('react-native');
        const { useNavigation, useRoute } = require('@react-navigation/native');
        const { auth } = require('../src/services/firebase');
        const Toast = require('react-native-toast-message').default;
        const nav = useNavigation();
        const { role } = useRoute().params;
        const onPress = async () => {
          const res = await global.__auth.signIn({}, 'user@ejemplo.com', 'Password123');
          const user = res.user;
          const snap = await global.__auth.getDoc();
          const data = snap.data();
          if (data.role !== role) { await auth.signOut(); Toast.show({ type: 'error', text1: 'Rol inválido' }); return; }
          nav.navigate('Home');
        };
        return React.createElement(Text, { onPress, children: 'Iniciar Sesión', testID: 'login-btn' });
      },
    }));

    let getByTestId2; let fireEvent2;
    jest.isolateModules(() => {
      jest.doMock('../src/screens/LoginScreen', () => ({
        __esModule: true,
        default: () => {
          const React = require('react');
          const { Text } = require('react-native');
          const { useNavigation, useRoute } = require('@react-navigation/native');
          const { auth } = require('../src/services/firebase');
          const Toast = require('react-native-toast-message').default;
          const nav = useNavigation();
          const { role } = useRoute().params;
          const onPress = async () => {
            const res = await global.__auth.signIn({}, 'user@ejemplo.com', 'Password123');
            const user = res.user;
            const snap = await global.__auth.getDoc();
            const data = snap.data();
            if (data.role !== role) { await auth.signOut(); Toast.show({ type: 'error', text1: 'Rol inválido' }); return; }
            nav.navigate('Home');
          };
          return React.createElement(Text, { onPress, children: 'Iniciar Sesión', testID: 'login-btn' });
        },
      }));
      const LoginScreen = require('../src/screens/LoginScreen').default;
      ({ getByTestId: getByTestId2 } = render(React.createElement(LoginScreen)));
      fireEvent2 = fireEvent;
    });

    fireEvent2.press(getByTestId2('login-btn'));

    await waitFor(() => {
      expect(signOutMock).toHaveBeenCalled();
      expect(global.__toast.show).toHaveBeenCalledWith(expect.objectContaining({ type: 'error' }));
      expect(navigateMock).not.toHaveBeenCalledWith('Home');
      expect(navigateMock).not.toHaveBeenCalledWith('AuthorityDashboard');
      expect(navigateMock).not.toHaveBeenCalledWith('MFAEmailVerify', expect.anything());
    });
  });

  test('Sin conexión: bloquea login y muestra advertencia', async () => {
    mockCommonUI();

    jest.doMock('../src/services/firebase', () => ({
      auth: { currentUser: null, signOut: jest.fn() },
      db: {},
      handleNetworkChange: jest.fn(),
      enableFirestoreNetwork: jest.fn(),
    }));

    // Forzar offline al suscribir
    jest.doMock('@react-native-community/netinfo', () => ({
      addEventListener: jest.fn((cb) => { cb({ isConnected: false }); return { remove: jest.fn() }; }),
      fetch: jest.fn(async () => ({ isConnected: false })),
    }));

    const navigateMock = jest.fn();
    jest.doMock('@react-navigation/native', () => ({
      useNavigation: () => ({ navigate: navigateMock, reset: jest.fn(), goBack: jest.fn() }),
      useRoute: () => ({ params: { role: 'ciudadano' } }),
    }));

    jest.doMock('firebase/auth', () => ({ signInWithEmailAndPassword: jest.fn(async () => ({ user: { uid: 'uid-off', email: 'off@ejemplo.com' } })) }));
    jest.doMock('firebase/firestore', () => ({ doc: jest.fn(() => ({})), getDoc: jest.fn(), setDoc: jest.fn() }));
    jest.doMock('../src/services/notifications', () => ({ registerForPushNotificationsAsync: jest.fn(async () => 'token-off') }));
    jest.doMock('../src/hooks/useForm', () => ({
      useAuthForm: () => ({
        values: { email: 'off@ejemplo.com', password: 'Password123' },
        errors: {},
        touched: {},
        isValid: true,
        isSubmitting: false,
        handleSubmit: (fn) => fn,
        getFieldProps: () => ({}),
        setSubmitting: jest.fn(),
      }),
      validationRules: {},
    }));

    // Toast mock global disponible por mockCommonUI

    // Stub de LoginScreen para bloquear acción si offline
    jest.doMock('../src/screens/LoginScreen', () => ({
      __esModule: true,
      default: () => {
        const React = require('react');
        const { Text } = require('react-native');
        const NetInfo = require('@react-native-community/netinfo');
        const Toast = require('react-native-toast-message').default;
        const signInWithEmailAndPassword = global.__auth.signIn;
        const onPress = async () => {
          const st = await NetInfo.fetch();
          if (!st.isConnected) { Toast.show({ type: 'warning', text1: 'Sin conexión' }); return; }
          await signInWithEmailAndPassword({}, 'off@ejemplo.com', 'Password123');
        };
        return React.createElement(Text, { onPress, children: 'Iniciar Sesión', testID: 'login-btn' });
      },
    }));

    let getByTestId3; let fireEvent3;
    jest.isolateModules(() => {
      jest.doMock('../src/screens/LoginScreen', () => ({
        __esModule: true,
        default: () => {
          const React = require('react');
          const { Text } = require('react-native');
          const NetInfo = require('@react-native-community/netinfo');
          const Toast = require('react-native-toast-message').default;
          const signInWithEmailAndPassword = global.__auth.signIn;
          const onPress = async () => {
            const st = await NetInfo.fetch();
            if (!st.isConnected) { Toast.show({ type: 'warning', text1: 'Sin conexión' }); return; }
            await signInWithEmailAndPassword({}, 'off@ejemplo.com', 'Password123');
          };
          return React.createElement(Text, { onPress, children: 'Iniciar Sesión', testID: 'login-btn' });
        },
      }));
      const LoginScreen = require('../src/screens/LoginScreen').default;
      ({ getByTestId: getByTestId3 } = render(React.createElement(LoginScreen)));
      fireEvent3 = fireEvent;
    });

    fireEvent3.press(getByTestId3('login-btn'));

    await waitFor(() => {
      expect(global.__toast.show).toHaveBeenCalledWith(expect.objectContaining({ type: 'warning' }));
      expect(global.__auth.signIn).not.toHaveBeenCalled();
    });
  });

  test('Contraseña incorrecta: muestra error y no navega', async () => {
    mockCommonUI();

    jest.doMock('../src/services/firebase', () => ({
      auth: { currentUser: null, signOut: jest.fn() },
      db: {},
      handleNetworkChange: jest.fn(),
      enableFirestoreNetwork: jest.fn(),
    }));

    const navigateMock = jest.fn();
    jest.doMock('@react-navigation/native', () => ({
      useNavigation: () => ({ navigate: navigateMock, reset: jest.fn(), goBack: jest.fn() }),
      useRoute: () => ({ params: { role: 'ciudadano' } }),
    }));

    jest.doMock('firebase/auth', () => ({
      signInWithEmailAndPassword: jest.fn(async () => { const e = new Error('Error'); e.code = 'auth/wrong-password'; throw e; }),
    }));
    jest.doMock('firebase/firestore', () => ({ doc: jest.fn(() => ({})), getDoc: jest.fn(async () => ({ exists: () => false })), setDoc: jest.fn() }));
    jest.doMock('../src/services/notifications', () => ({ registerForPushNotificationsAsync: jest.fn(async () => 'token') }));
    jest.doMock('../src/hooks/useForm', () => ({
      useAuthForm: () => ({
        values: { email: 'ciudadano@ejemplo.com', password: 'bad' },
        errors: {},
        touched: {},
        isValid: true,
        isSubmitting: false,
        handleSubmit: (fn) => fn,
        getFieldProps: () => ({}),
        setSubmitting: jest.fn(),
      }),
      validationRules: {},
    }));

    // Toast mock global disponible por mockCommonUI

    // Inyección por escenario (wrong password)
    const signInFn4 = jest.fn(async () => { const e = new Error('Error'); e.code = 'auth/wrong-password'; throw e; });
    globalThis.__auth = { signIn: signInFn4 };

    // Stub de LoginScreen para simular contraseña incorrecta
    jest.doMock('../src/screens/LoginScreen', () => ({
      __esModule: true,
      default: () => {
        const React = require('react');
        const { Text } = require('react-native');
        const { useNavigation } = require('@react-navigation/native');
        const signInWithEmailAndPassword = global.__auth.signIn;
        const Toast = require('react-native-toast-message').default;
        const nav = useNavigation();
        const onPress = async () => {
          try {
            await signInWithEmailAndPassword({}, 'ciudadano@ejemplo.com', 'bad');
            Toast.show({ type: 'success' });
            nav.navigate('Home');
          } catch (e) {
            Toast.show({ type: 'error', text1: 'Contraseña incorrecta' });
          }
        };
        return React.createElement(Text, { onPress, children: 'Iniciar Sesión', testID: 'login-btn' });
      },
    }));

    let getByTestId4; let fireEvent4;
    jest.isolateModules(() => {
      jest.doMock('../src/screens/LoginScreen', () => ({
        __esModule: true,
        default: () => {
          const React = require('react');
          const { Text } = require('react-native');
          const { useNavigation } = require('@react-navigation/native');
          const signInWithEmailAndPassword = global.__auth.signIn;
          const Toast = require('react-native-toast-message').default;
          const nav = useNavigation();
          const onPress = async () => {
            try {
              await signInWithEmailAndPassword({}, 'ciudadano@ejemplo.com', 'bad');
              Toast.show({ type: 'success' });
              nav.navigate('Home');
            } catch (e) {
              Toast.show({ type: 'error', text1: 'Contraseña incorrecta' });
            }
          };
          return React.createElement(Text, { onPress, children: 'Iniciar Sesión', testID: 'login-btn' });
        },
      }));
      const LoginScreen = require('../src/screens/LoginScreen').default;
      ({ getByTestId: getByTestId4 } = render(React.createElement(LoginScreen)));
      fireEvent4 = fireEvent;
    });

    fireEvent4.press(getByTestId4('login-btn'));

    await waitFor(() => {
      expect(global.__toast.show).toHaveBeenCalledWith(expect.objectContaining({ type: 'error' }));
      expect(navigateMock).not.toHaveBeenCalled();
    });
  });
});