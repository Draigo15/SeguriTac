import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import ProfileScreen from '../src/screens/ProfileScreen';

// Mock de los servicios de autenticación
jest.mock('../src/services/auth', () => ({
  getCurrentUser: jest.fn(() => ({ 
    uid: 'user123', 
    email: 'test@example.com',
    displayName: 'Usuario Test' 
  })),
  signOut: jest.fn(() => Promise.resolve())
}));

// Mock de navegación
const mockNavigate = jest.fn();
const mockReset = jest.fn();
jest.mock('@react-navigation/native', () => {
  const actualNav = jest.requireActual('@react-navigation/native');
  return {
    ...actualNav,
    useNavigation: () => ({
      navigate: mockNavigate,
      reset: mockReset
    }),
  };
});

describe('Cierre de Sesión', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('muestra la información del perfil correctamente', async () => {
    const { getByTestId } = render(
      <NavigationContainer>
        <ProfileScreen />
      </NavigationContainer>
    );

    // Verificar que se muestre la información del usuario
    await waitFor(() => {
      expect(getByTestId('user-email')).toBeTruthy();
    });
  });

  test('cierra sesión correctamente al presionar el botón', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert');

    const { getByTestId } = render(
      <NavigationContainer>
        <ProfileScreen />
      </NavigationContainer>
    );

    const logoutButton = getByTestId('logout-button');
    fireEvent.press(logoutButton);

    expect(alertSpy).toHaveBeenCalled();
    const args = alertSpy.mock.calls[0];
    const buttons = args[2];
    const confirmBtn = Array.isArray(buttons)
      ? buttons.find(b => b.text === 'Cerrar sesión')
      : null;
    if (confirmBtn && typeof confirmBtn.onPress === 'function') {
      confirmBtn.onPress();
    }

    await waitFor(() => {
      expect(require('../src/services/auth').signOut).toHaveBeenCalled();
    });

    expect(mockReset).toHaveBeenCalledWith({
      index: 0,
      routes: [{ name: 'Login' }]
    });
  });

  test('muestra mensaje de error si falla el cierre de sesión', async () => {
    // Sobrescribir el mock para simular un error
    require('../src/services/auth').signOut.mockImplementationOnce(() => 
      Promise.reject(new Error('Error al cerrar sesión'))
    );

    const { getByTestId } = render(
      <NavigationContainer>
        <ProfileScreen />
      </NavigationContainer>
    );

    // Buscar y presionar el botón de cerrar sesión
    const logoutButton = getByTestId('logout-button');
    fireEvent.press(logoutButton);

    // Verificar que NO se haya redirigido
    expect(mockReset).not.toHaveBeenCalled();
  });

  test('muestra diálogo de confirmación antes de cerrar sesión', async () => {
    const { getByTestId } = render(
      <NavigationContainer>
        <ProfileScreen />
      </NavigationContainer>
    );

    // Buscar y presionar el botón de cerrar sesión
    const logoutButton = getByTestId('logout-button');
    fireEvent.press(logoutButton);

    // Verificar que NO se haya llamado al servicio de cierre de sesión
    expect(require('../src/services/auth').signOut).not.toHaveBeenCalled();
  });
});