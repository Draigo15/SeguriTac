/**
 * Pruebas unitarias para funciones de geolocalización
 * 
 * Este archivo contiene pruebas para las funciones de geolocalización
 * utilizadas en la aplicación de Seguridad Ciudadana.
 */

import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import * as Location from 'expo-location';

// Mock de expo-location
jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn(),
  getCurrentPositionAsync: jest.fn(),
  Accuracy: {
    High: 'high',
  },
}));

// Mock de react-native
jest.mock('react-native', () => ({
  Platform: {
    OS: 'android',
  },
  Alert: {
    alert: jest.fn(),
  },
}));
const { Alert, Platform } = require('react-native');
let alertSpy;

// Función handleLocateMe extraída para pruebas
const createHandleLocateMe = (setUserLocation, mapRef) => async () => {
  try {
    // Solicitar permisos de ubicación
    const { status } = await Location.requestForegroundPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permiso denegado', 'No se puede acceder a tu ubicación.');
      return;
    }

    // Obtener ubicación actual
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });
    const { latitude, longitude } = location.coords;

    setUserLocation({ latitude, longitude });

    // Animar el mapa hacia la ubicación del usuario (solo en móvil)
    if (Platform.OS !== 'web' && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude,
        longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      });
    }
  } catch (error) {
    Alert.alert('Error', 'No se pudo obtener tu ubicación.');
  }
};

describe('Funciones de geolocalización', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    alertSpy = jest.spyOn(Alert, 'alert');
  });

  test('handleLocateMe debería solicitar permisos y obtener ubicación', async () => {
    // Mock de funciones
    const setUserLocation = jest.fn();
    const mapRef = { current: { animateToRegion: jest.fn() } };
    
    // Configurar mocks
    Location.requestForegroundPermissionsAsync.mockResolvedValue({ status: 'granted' });
    Location.getCurrentPositionAsync.mockResolvedValue({
      coords: {
        latitude: 10.123,
        longitude: -84.456,
      }
    });
    
    // Crear y ejecutar la función
    const handleLocateMe = createHandleLocateMe(setUserLocation, mapRef);
    await handleLocateMe();
    
    // Verificar que se solicitaron permisos
    expect(Location.requestForegroundPermissionsAsync).toHaveBeenCalled();
    
    // Verificar que se obtuvo la ubicación
    expect(Location.getCurrentPositionAsync).toHaveBeenCalledWith({
      accuracy: Location.Accuracy.High,
    });
    
    // Verificar que se actualizó el estado
    expect(setUserLocation).toHaveBeenCalledWith({
      latitude: 10.123,
      longitude: -84.456,
    });
    
    // Verificar que se animó el mapa
    expect(mapRef.current.animateToRegion).toHaveBeenCalledWith({
      latitude: 10.123,
      longitude: -84.456,
      latitudeDelta: 0.005,
      longitudeDelta: 0.005,
    });
  });

  test('handleLocateMe debería manejar permisos denegados', async () => {
    // Mock de funciones
    const setUserLocation = jest.fn();
    const mapRef = { current: { animateToRegion: jest.fn() } };
    
    // Configurar mocks para permisos denegados
    Location.requestForegroundPermissionsAsync.mockResolvedValue({ status: 'denied' });
    
    // Crear y ejecutar la función
    const handleLocateMe = createHandleLocateMe(setUserLocation, mapRef);
    await handleLocateMe();
    
    // Verificar que se solicitaron permisos
    expect(Location.requestForegroundPermissionsAsync).toHaveBeenCalled();
    
    // Verificar que no se obtuvo la ubicación
    expect(Location.getCurrentPositionAsync).not.toHaveBeenCalled();
    
    // Verificar que se mostró una alerta
    expect(alertSpy).toHaveBeenCalledWith('Permiso denegado', 'No se puede acceder a tu ubicación.');
    
    // Verificar que no se actualizó el estado
    expect(setUserLocation).not.toHaveBeenCalled();
  });

  test('handleLocateMe debería manejar errores al obtener ubicación', async () => {
    // Mock de funciones
    const setUserLocation = jest.fn();
    const mapRef = { current: { animateToRegion: jest.fn() } };
    
    // Configurar mocks para error al obtener ubicación
    Location.requestForegroundPermissionsAsync.mockResolvedValue({ status: 'granted' });
    Location.getCurrentPositionAsync.mockRejectedValue(new Error('Error de ubicación'));
    
    // Crear y ejecutar la función
    const handleLocateMe = createHandleLocateMe(setUserLocation, mapRef);
    await handleLocateMe();
    
    // Verificar que se solicitaron permisos
    expect(Location.requestForegroundPermissionsAsync).toHaveBeenCalled();
    
    // Verificar que se intentó obtener la ubicación
    expect(Location.getCurrentPositionAsync).toHaveBeenCalled();
    
    // Verificar que se mostró una alerta de error
    expect(alertSpy).toHaveBeenCalledWith('Error', 'No se pudo obtener tu ubicación.');
    
    // Verificar que no se actualizó el estado
    expect(setUserLocation).not.toHaveBeenCalled();
  });
});