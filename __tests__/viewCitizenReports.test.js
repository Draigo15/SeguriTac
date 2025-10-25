import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import MapScreen from '../src/screens/MapScreen';

// Mock de los servicios de reportes
jest.mock('../src/services/reports', () => ({
  getAllReports: jest.fn(() => Promise.resolve([
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

// Mock de componentes de mapa
jest.mock('react-native-maps', () => {
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: View,
    Marker: View,
    Callout: View,
  };
});

describe('Ver Reportes Ciudadanos', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('carga y muestra los reportes en el mapa', async () => {
    const { getAllByTestId } = render(
      <NavigationContainer>
        <MapScreen />
      </NavigationContainer>
    );

    // Verificar que se muestren los marcadores en el mapa
    await waitFor(() => {
      const markers = getAllByTestId('map-marker');
      expect(markers.length).toBe(2);
    });
  });

  test('muestra detalles del reporte al presionar un marcador', async () => {
    const { getAllByTestId, getByText } = render(
      <NavigationContainer>
        <MapScreen />
      </NavigationContainer>
    );

    // Esperar a que se carguen los marcadores
    await waitFor(() => {
      const markers = getAllByTestId('map-marker');
      // Simular presionar en un marcador
      fireEvent.press(markers[0]);
    });

    // Verificar que se muestren los detalles del reporte
    expect(getByText('Robo en calle principal')).toBeTruthy();
  });

  test('navega al detalle del reporte al presionar en ver más', async () => {
    const { getAllByTestId, getByText } = render(
      <NavigationContainer>
        <MapScreen />
      </NavigationContainer>
    );

    // Esperar a que se carguen los marcadores
    await waitFor(() => {
      const markers = getAllByTestId('map-marker');
      // Simular presionar en un marcador
      fireEvent.press(markers[0]);
    });

    // Presionar el botón de ver más detalles
    const viewMoreButton = getByText('Ver más');
    fireEvent.press(viewMoreButton);

    // Verificar que se navegue al detalle del reporte
    expect(mockNavigate).toHaveBeenCalledWith('ReportDetail', { reportId: '1' });
  });
});