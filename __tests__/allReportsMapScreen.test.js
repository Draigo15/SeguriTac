import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';

// Cargaremos la pantalla dinámicamente tras ajustar el entorno de test
let AllReportsMapScreen;

// Mock de Firebase Firestore para evitar errores al construir referencias
jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(() => ({ /* db mock */ })),
  collection: jest.fn(() => ({ /* collection ref mock */ })),
  query: jest.fn((ref) => ref),
  orderBy: jest.fn(() => ({ /* orderBy mock */ })),
  onSnapshot: jest.fn(),
}));

// Mock de Firestore wrapper: entrega reportes con location válida
jest.mock('../src/services/firestoreWrapper', () => ({
  robustOnSnapshot: jest.fn((ref, nextCb) => {
    const snapshot = {
      forEach: (fn) => {
        const docs = [
          { id: 'rep1', data: () => ({
            location: { latitude: 4.62, longitude: -74.07 },
            incidentType: 'Robo',
            status: 'Pendiente',
            description: 'Robo de celular',
            email: 'citizen@example.com'
          }) },
          { id: 'rep2', data: () => ({
            location: { latitude: 4.64, longitude: -74.06 },
            incidentType: 'Accidente',
            status: 'Resuelto',
            description: 'Colisión menor',
            email: 'citizen@example.com'
          }) },
        ];
        docs.forEach(fn);
      },
    };
    nextCb(snapshot);
    return jest.fn(); // unsubscribe
  }),
}));

// Mock de expo-location para centrar ubicación
jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn(async () => ({ status: 'granted' })),
  getCurrentPositionAsync: jest.fn(async () => ({
    coords: { latitude: 4.63, longitude: -74.06 }
  })),
}));

// Mock del componente de mapa móvil con ref y método animateToRegion
jest.mock('../src/components/MapViewMobile', () => {
  const React = require('react');
  const { forwardRef } = React;
  const { View } = require('react-native');
  return forwardRef((props, ref) => {
    if (ref) {
      // Proveer método esperado por la pantalla
      ref.current = { animateToRegion: jest.fn() };
    }
    return <View testID="map-view-mobile" />;
  });
});

// Mock WebMapList por si corre en entorno web
jest.mock('../src/components/WebMapList', () => {
  const React = require('react');
  const { View } = require('react-native');
  return () => <View testID="web-map-list" />;
});

// Evitar toasts reales en test
jest.mock('react-native-toast-message', () => {
  const React = require('react');
  const { View } = require('react-native');
  const MockToast = () => <View testID="toast" />;
  MockToast.show = jest.fn();
  return MockToast;
});

describe('AllReportsMapScreen (RF-6)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Forzar entorno para que la pantalla no use el modo IS_TEST
    delete process.env.JEST_WORKER_ID;
    AllReportsMapScreen = require('../src/screens/AllReportsMapScreen').default;
  });

  test('renderiza controles y permite alternar heatmap', async () => {
    const { getByTestId, getByText, queryByText } = render(<AllReportsMapScreen />);

    // Esperar a que aparezca el botón de alternar heatmap
    const toggleBtn = await waitFor(() => getByTestId('toggle-heatmap'));
    expect(toggleBtn).toBeTruthy();

    // Estado inicial: heatmap visible (icono fuego)
    expect(getByText('🔥')).toBeTruthy();
    expect(queryByText('🌡️')).toBeNull();

    // Alternar heatmap
    fireEvent.press(toggleBtn);

    // Verificar cambio de icono (termostato)
    await waitFor(() => expect(getByText('🌡️')).toBeTruthy());
  });
});