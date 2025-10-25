/**
 * Pruebas unitarias para el Registro de Usuario
 */

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

// Componente simulado para pruebas
const RegisterScreen = () => {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [name, setName] = React.useState('');
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  const handleRegister = async () => {
    if (!email || !password || !confirmPassword || !name) {
      setError('Todos los campos son obligatorios');
      return;
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setLoading(true);
    try {
      const authService = require('../src/services/auth');
      await authService.registerUser(email, password, name);
      setLoading(false);
      return true;
    } catch (err) {
      setError(err.message);
      setLoading(false);
      return false;
    }
  };

  return { email, setEmail, password, setPassword, confirmPassword, setConfirmPassword, name, setName, error, loading, handleRegister };
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