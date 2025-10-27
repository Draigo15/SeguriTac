/**
 * RNF-1 Aceptación: Verifica que acciones clave respondan <= 3000ms
 * - Envío de reporte (ReportScreen)
 * - Carga de notificaciones (NotificationsScreen)
 * - Carga inicial del mapa de reportes (AllReportsMapScreen)
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';

import ReportScreen from '../src/screens/ReportScreen';
import NotificationsScreen from '../src/screens/NotificationsScreen';
import AllReportsMapScreen from '../src/screens/AllReportsMapScreen';
import { clearMetrics, getMetrics } from '../src/utils/metrics';

const THRESHOLD_MS = 3000;

// Mocks comunes
jest.mock('../src/services/firebase', () => ({
  auth: { currentUser: { email: 'test@example.com' } },
  db: {},
}));

jest.mock('react-native-toast-message', () => ({
  __esModule: true,
  default: { show: jest.fn() },
}));

// Mock de navegación para evitar dependencias del contenedor real
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: jest.fn() }),
  useRoute: () => ({ params: {} }),
}));

// Mocks de Firestore usados por distintas pantallas
jest.mock('firebase/firestore', () => ({
  // ReportScreen
  collection: jest.fn(() => ({})),
  addDoc: jest.fn(async () => ({ id: 'new-report-id' })),
  serverTimestamp: jest.fn(() => new Date()),
  // NotificationsScreen
  doc: jest.fn(() => ({})),
  getDoc: jest.fn(async () => ({
    exists: () => true,
    data: () => ({ notifications: [
      { id: 'n1', title: 'Alerta', body: 'Prueba', timestamp: { toDate: () => new Date() } },
    ] })
  })),
  updateDoc: jest.fn(async () => {}),
}));

// robustOnSnapshot para AllReportsMapScreen
jest.mock('../src/services/firestoreWrapper', () => ({
  robustOnSnapshot: (queryRef, onNext, onError) => {
    // Snapshot falso con datos mínimos
    const fakeSnapshot = {
      forEach: (cb) => {
        for (let i = 0; i < 5; i++) {
          cb({
            id: `r${i}`,
            data: () => ({
              incidentType: 'robo',
              status: 'pendiente',
              location: { latitude: -12.0 + i * 0.01, longitude: -77.0 - i * 0.01 },
              description: 'Reporte de prueba',
              email: 'test@example.com',
            }),
          });
        }
      },
    };
    // Ejecutar success de forma síncrona para el test
    try {
      onNext(fakeSnapshot);
    } catch (e) {
      onError && onError(e);
    }
    return () => {};
  },
}));

// Hooks usados en ReportScreen que deben estar satisfechos
jest.mock('../src/hooks/useForm', () => ({
  useReportForm: () => ({
    values: {
      incidentType: 'robo',
      description: 'Descripción de prueba',
    },
    errors: {},
    isValid: true,
    isSubmitting: false,
    handleSubmit: (fn) => fn, // handleSubmit(performSubmit) => performSubmit directamente
    setFieldValue: jest.fn(),
    resetForm: jest.fn(),
  }),
}));

jest.mock('../src/hooks/useLocation', () => ({
  useLocation: () => ({
    location: { latitude: -12.0464, longitude: -77.0428 },
    loading: false,
    error: null,
  }),
}));

jest.mock('../src/hooks/useCamera', () => ({
  useReportCamera: () => ({
    image: null,
    pickImageFromGallery: jest.fn(),
    captureImageWithCamera: jest.fn(),
    clearImage: jest.fn(),
  }),
}));

jest.mock('../src/services/imageUploadService', () => ({
  uploadImageToStorage: jest.fn(async () => ({ url: 'https://example.com/img.jpg' })),
}));

describe('RNF-1 Aceptación (<= 3000ms)', () => {
  beforeEach(() => {
    clearMetrics();
    jest.clearAllMocks();
  });

  test('Envío de reporte (ReportScreen) registra métrica y cumple umbral', async () => {
    // Interceptar Alert y disparar el handler "Enviar" inmediatamente
    jest.spyOn(Alert, 'alert').mockImplementation((title, message, buttons) => {
      const enviar = buttons?.find((b) => b.text === 'Enviar');
      enviar?.onPress && enviar.onPress();
      return;
    });

    const { getByText } = render(<ReportScreen />);

    // Disparar el flujo: validar y confirmar -> Alert -> performSubmit
    fireEvent.press(getByText('Enviar Reporte'));

    await waitFor(() => {
      const metrics = getMetrics().filter((m) => m.name === 'report_submit_ms');
      expect(metrics.length).toBeGreaterThan(0);
    });

    const values = getMetrics().filter((m) => m.name === 'report_submit_ms').map((m) => m.value);
    const max = Math.max(...values);
    expect(max).toBeLessThanOrEqual(THRESHOLD_MS);
  });

  test('Carga de notificaciones (NotificationsScreen) registra métrica y cumple umbral', async () => {
    render(<NotificationsScreen />);

    await waitFor(() => {
      const metrics = getMetrics().filter((m) => m.name === 'notifications_load_ms');
      expect(metrics.length).toBeGreaterThan(0);
    });

    const values = getMetrics().filter((m) => m.name === 'notifications_load_ms').map((m) => m.value);
    const max = Math.max(...values);
    expect(max).toBeLessThanOrEqual(THRESHOLD_MS);
  });

  test('Carga inicial del mapa (AllReportsMapScreen) registra métrica y cumple umbral', async () => {
    render(<AllReportsMapScreen />);

    await waitFor(() => {
      const metrics = getMetrics().filter((m) => m.name === 'map_load_ms');
      expect(metrics.length).toBeGreaterThan(0);
    });

    const values = getMetrics().filter((m) => m.name === 'map_load_ms').map((m) => m.value);
    const max = Math.max(...values);
    expect(max).toBeLessThanOrEqual(THRESHOLD_MS);
  });
});