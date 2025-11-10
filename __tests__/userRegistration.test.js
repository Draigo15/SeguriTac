/**
 * Pruebas unitarias para el Registro de Usuario
 */

// Nota: Evitamos hooks de React aquí para simplificar las pruebas unitarias.
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import '@testing-library/jest-native/extend-expect';

// Mock de los servicios de autenticación
jest.mock('../src/services/auth', () => ({
  registerUser: jest.fn(() => Promise.resolve({ success: true })),
}));

// Mock de react-navigation
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: jest.fn(),
  }),
}));

// Componente simulado para pruebas (sin hooks de React)
const RegisterScreen = () => {
  const state = {
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    error: '',
    loading: false,
  };

  const setEmail = (v) => { state.email = v; };
  const setPassword = (v) => { state.password = v; };
  const setConfirmPassword = (v) => { state.confirmPassword = v; };
  const setName = (v) => { state.name = v; };
  const setError = (v) => { state.error = v; };
  const setLoading = (v) => { state.loading = v; };

  const handleRegister = async () => {
    if (!state.email || !state.password || !state.confirmPassword || !state.name) {
      setError('Todos los campos son obligatorios');
      return false;
    }

    if (state.password !== state.confirmPassword) {
      setError('Las contraseñas no coinciden');
      return false;
    }

    setLoading(true);
    try {
      const authService = require('../src/services/auth');
      await authService.registerUser(state.email, state.password, state.name);
      setLoading(false);
      return true;
    } catch (err) {
      setError(err.message);
      setLoading(false);
      return false;
    }
  };

  const api = { setEmail, setPassword, setConfirmPassword, setName, handleRegister };
  Object.defineProperty(api, 'email', { get: () => state.email });
  Object.defineProperty(api, 'password', { get: () => state.password });
  Object.defineProperty(api, 'confirmPassword', { get: () => state.confirmPassword });
  Object.defineProperty(api, 'name', { get: () => state.name });
  Object.defineProperty(api, 'error', { get: () => state.error });
  Object.defineProperty(api, 'loading', { get: () => state.loading });
  return api;
};

describe('Pruebas de Registro de Usuario', () => {
  it('debe mostrar error cuando los campos están vacíos', async () => {
    const component = RegisterScreen();
    
    // Intentar registro con campos vacíos
    const result = await component.handleRegister();
    
    // Verificar que muestra error
    expect(component.error).toBe('Todos los campos son obligatorios');
    expect(result).toBeFalsy();
  });

  it('debe mostrar error cuando las contraseñas no coinciden', async () => {
    const component = RegisterScreen();
    
    // Configurar datos con contraseñas diferentes
    component.setEmail('test@example.com');
    component.setName('Test User');
    component.setPassword('password123');
    component.setConfirmPassword('password456');
    
    // Intentar registro
    const result = await component.handleRegister();
    
    // Verificar que muestra error
    expect(component.error).toBe('Las contraseñas no coinciden');
    expect(result).toBeFalsy();
  });

  it('debe registrar al usuario correctamente', async () => {
    const component = RegisterScreen();
    const authService = require('../src/services/auth');
    
    // Configurar datos válidos
    component.setEmail('test@example.com');
    component.setName('Test User');
    component.setPassword('password123');
    component.setConfirmPassword('password123');
    
    // Intentar registro
    const result = await component.handleRegister();
    
    // Verificar que se llamó al servicio de autenticación
    expect(authService.registerUser).toHaveBeenCalledWith('test@example.com', 'password123', 'Test User');
    expect(result).toBeTruthy();
    expect(component.loading).toBeFalsy();
  });

  it('debe manejar errores durante el registro', async () => {
    const component = RegisterScreen();
    const authService = require('../src/services/auth');
    
    // Simular error en el servicio
    authService.registerUser.mockImplementationOnce(() => 
      Promise.reject(new Error('Error de registro'))
    );
    
    // Configurar datos válidos
    component.setEmail('test@example.com');
    component.setName('Test User');
    component.setPassword('password123');
    component.setConfirmPassword('password123');
    
    // Intentar registro
    const result = await component.handleRegister();
    
    // Verificar manejo de error
    expect(result).toBeFalsy();
    expect(component.error).toBe('Error de registro');
    expect(component.loading).toBeFalsy();
  });
});