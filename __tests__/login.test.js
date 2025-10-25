/**
 * Pruebas unitarias para el Inicio de Sesión
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import '@testing-library/jest-native/extend-expect';

// Mock de los servicios de autenticación
jest.mock('../src/services/auth', () => ({
  loginUser: jest.fn(() => Promise.resolve({ user: { uid: '123', email: 'test@example.com' } })),
}));

// Mock de react-navigation
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: jest.fn(),
    replace: jest.fn(),
  }),
}));

// Componente simulado para pruebas
const LoginScreen = () => {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Email y contraseña son obligatorios');
      return false;
    }

    setLoading(true);
    try {
      const authService = require('../src/services/auth');
      const result = await authService.loginUser(email, password);
      setLoading(false);
      return result;
    } catch (err) {
      setError(err.message);
      setLoading(false);
      return false;
    }
  };

  return { email, setEmail, password, setPassword, error, loading, handleLogin };
};

describe('Pruebas de Inicio de Sesión', () => {
  it('debe mostrar error cuando los campos están vacíos', async () => {
    const component = LoginScreen();
    
    // Intentar login con campos vacíos
    const result = await component.handleLogin();
    
    // Verificar que muestra error
    expect(component.error).toBe('Email y contraseña son obligatorios');
    expect(result).toBeFalsy();
  });

  it('debe iniciar sesión correctamente', async () => {
    const component = LoginScreen();
    const authService = require('../src/services/auth');
    
    // Configurar datos válidos
    component.setEmail('test@example.com');
    component.setPassword('password123');
    
    // Intentar login
    const result = await component.handleLogin();
    
    // Verificar que se llamó al servicio de autenticación
    expect(authService.loginUser).toHaveBeenCalledWith('test@example.com', 'password123');
    expect(result).toEqual({ user: { uid: '123', email: 'test@example.com' } });
    expect(component.loading).toBeFalsy();
  });

  it('debe manejar errores durante el inicio de sesión', async () => {
    const component = LoginScreen();
    const authService = require('../src/services/auth');
    
    // Simular error en el servicio
    authService.loginUser.mockImplementationOnce(() => 
      Promise.reject(new Error('Credenciales inválidas'))
    );
    
    // Configurar datos
    component.setEmail('test@example.com');
    component.setPassword('password123');
    
    // Intentar login
    const result = await component.handleLogin();
    
    // Verificar manejo de error
    expect(result).toBeFalsy();
    expect(component.error).toBe('Credenciales inválidas');
    expect(component.loading).toBeFalsy();
  });
});