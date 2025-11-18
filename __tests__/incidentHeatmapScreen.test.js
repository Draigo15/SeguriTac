import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';

import IncidentHeatmapScreen from '../src/screens/IncidentHeatmapScreen';

// Mock de Firebase Firestore para evitar errores al construir referencias
jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(() => ({ /* db mock */ })),
  collection: jest.fn(() => ({ /* collection ref mock */ })),
  query: jest.fn((ref) => ref),
  orderBy: jest.fn(() => ({ /* orderBy mock */ })),
  onSnapshot: jest.fn(),
}));

// Mock servicios del heatmap
jest.mock('../src/services/heatmapService', () => ({
  heatmapService: {
    getHeatmapPoints: jest.fn(async () => [
      { latitude: 4.711, longitude: -74.072, weight: 0.6 },
      { latitude: 4.65, longitude: -74.1, weight: 0.9 },
    ]),
    getZoneRisks: jest.fn(async () => [
      {
        zone: 'Zona Norte',
        riskLevel: 'high',
        incidentCount: 12,
        radius: 1500,
        coordinates: { latitude: 4.75, longitude: -74.05 },
        topIncidentTypes: [ { type: 'robo', count: 6 }, { type: 'vandalismo', count: 4 } ],
      },
      {
        zone: 'Zona Centro',
        riskLevel: 'critical',
        incidentCount: 20,
        radius: 2000,
        coordinates: { latitude: 4.68, longitude: -74.08 },
        topIncidentTypes: [ { type: 'violencia', count: 8 }, { type: 'accidente', count: 5 } ],
      },
    ]),
  },
}));

// Mock de Firestore wrapper para suscripción de reportes
jest.mock('../src/services/firestoreWrapper', () => ({
  robustOnSnapshot: jest.fn((ref, nextCb) => {
    const snapshot = {
      forEach: (fn) => {
        const docs = [
          { id: 'rep1', data: () => ({ latitude: 4.7, longitude: -74.06, incidentType: 'robo', status: 'Pendiente' }) },
        ];
        docs.forEach(fn);
      },
    };
    nextCb(snapshot);
    return jest.fn(); // unsubscribe
  }),
}));

// Mock del componente WebView para inspeccionar el HTML generado
jest.mock('../src/components/HeatmapWebView', () => {
  const React = require('react');
  const { View, Text } = require('react-native');
  return ({ html }) => (
    <View testID="heatmap-webview">
      <Text>{html.includes('leaflet') ? 'hasLeaflet' : 'noLeaflet'}</Text>
    </View>
  );
});

// Mock de expo-linear-gradient si es usado
jest.mock('expo-linear-gradient', () => ({
  LinearGradient: 'LinearGradient',
}));

describe('IncidentHeatmapScreen (RF-6)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renderiza HeatmapWebView con HTML del heatmap y muestra zonas', async () => {
    const { getByTestId, getByText } = render(<IncidentHeatmapScreen />);

    // Espera a que el WebView esté presente y verifique que se genera HTML con Leaflet
    const webview = await waitFor(() => getByTestId('heatmap-webview'));
    expect(webview).toBeTruthy();
    expect(getByText('hasLeaflet')).toBeTruthy();

    // Zonas de riesgo renderizadas
    expect(getByText('Zona Norte')).toBeTruthy();
    expect(getByText('Zona Centro')).toBeTruthy();
  });

  test('abre el modal de detalles al tocar una zona', async () => {
    const { getByText } = render(<IncidentHeatmapScreen />);

    // Esperar a que se rendericen las tarjetas de zona
    await waitFor(() => {
      expect(getByText('Zona Norte')).toBeTruthy();
    });

    // Presionar una tarjeta de zona
    fireEvent.press(getByText('Zona Norte'));

    // Verificar contenido del modal (detalles de la zona)
    await waitFor(() => {
      expect(getByText('Incidentes Totales')).toBeTruthy();
    });
  });
});