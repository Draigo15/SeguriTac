import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import MyReportsScreen from '../src/screens/MyReportsScreen';

// Mock de los servicios de reportes
jest.mock('../src/services/reports', () => ({
  getUserReports: jest.fn(() => Promise.resolve([
    { 
      id: '1', 
      title: 'Robo en calle principal', 
      description: 'Se reporta robo de celular', 
      status: 'pendiente',
      date: new Date().toISOString(),
      location: { latitude: -33.45, longitude: -70.67 },
      type: 'robo'
    },
    { 
      id: '2', 
      title: 'Accidente de tránsito', 
      description: 'Colisión entre dos vehículos', 
      status: 'en proceso',
      date: new Date().toISOString(),
      location: { latitude: -33.44, longitude: -70.65 },
      type: 'accidente'
    }
  ]))
}));

// Mock de autenticación
jest.mock('../src/services/auth', () => ({
  getCurrentUser: jest.fn(() => ({ uid: 'user123', email: 'test@example.com' }))
}));

// Mock de navegación
const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => {
  const actualNav = jest.requireActual('@react-navigation/native');
  return {
    ...actualNav,
    useNavigation: () => ({
      navigate: mockNavigate,
    }),
  };
});

describe('Ver Mis Reportes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('muestra la lista de reportes del usuario correctamente', async () => {
    const { getByText, getAllByTestId } = render(
      <NavigationContainer>
        <MyReportsScreen />
      </NavigationContainer>
    );

    // Verificar que se muestre el título de la pantalla
    expect(getByText('Mis Reportes')).toBeTruthy();

    // Esperar a que se carguen los reportes
    await waitFor(() => {
      const reportItems = getAllByTestId('report-item');
      expect(reportItems.length).toBe(2);
      expect(getByText('Robo en calle principal')).toBeTruthy();
      expect(getByText('Accidente de tránsito')).toBeTruthy();
    });
  });

  test('navega al detalle del reporte al hacer clic en un reporte', async () => {
    const { getAllByTestId } = render(
      <NavigationContainer>
        <MyReportsScreen />
      </NavigationContainer>
    );

    // Esperar a que se carguen los reportes
    await waitFor(() => {
      const reportItems = getAllByTestId('report-item');
      fireEvent.press(reportItems[0]);
    });

    // Verificar que se navegue al detalle del reporte con el ID correcto
    expect(mockNavigate).toHaveBeenCalledWith('ReportDetail', { reportId: '1' });
  });

  test('muestra mensaje cuando no hay reportes', async () => {
    // Sobrescribir el mock para devolver un array vacío
    require('../src/services/reports').getUserReports.mockImplementationOnce(() => 
      Promise.resolve([])
    );

    const { getByText } = render(
      <NavigationContainer>
        <MyReportsScreen />
      </NavigationContainer>
    );

    // Verificar que se muestre el mensaje de no hay reportes
    await waitFor(() => {
      expect(getByText('No tienes reportes registrados')).toBeTruthy();
    });
  });

  test('muestra indicador de carga mientras se obtienen los reportes', () => {
    const { getByTestId } = render(
      <NavigationContainer>
        <MyReportsScreen />
      </NavigationContainer>
    );

    // Verificar que se muestre el indicador de carga
    expect(getByTestId('loading-indicator')).toBeTruthy();
  });
});