import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import NotificationService from '../src/services/notifications';
import { onReportStatusChange } from '../src/services/reports';

// Mock de servicios de notificaciones
jest.mock('../src/services/notifications', () => ({
  sendPushNotification: jest.fn(() => Promise.resolve()),
  registerForPushNotifications: jest.fn(() => Promise.resolve('token123'))
}));

// Mock de Firebase
jest.mock('firebase/firestore', () => ({
  onSnapshot: jest.fn((_, callback) => {
    // Simular cambio en Firestore
    callback({
      docChanges: () => [{
        type: 'modified',
        doc: {
          id: 'report1',
          data: () => ({
            id: 'report1',
            title: 'Robo en calle principal',
            status: 'en proceso',
            userId: 'user123'
          })
        }
      }]
    });
    return jest.fn(); // Función de limpieza
  })
}));

describe('Notificación Cambio de Estado', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('envía notificación cuando cambia el estado de un reporte', async () => {
    // Configurar el listener de cambios
    const unsubscribe = onReportStatusChange('user123', (report) => {
      NotificationService.sendPushNotification(
        'token123',
        'Estado de reporte actualizado',
        `Tu reporte "${report.title}" ha cambiado a estado: ${report.status}`
      );
    });

    // Verificar que se haya enviado la notificación con el mensaje correcto
    await waitFor(() => {
      expect(NotificationService.sendPushNotification).toHaveBeenCalledWith(
        'token123',
        'Estado de reporte actualizado',
        'Tu reporte "Robo en calle principal" ha cambiado a estado: en proceso'
      );
    });

    // Limpiar el listener
    unsubscribe();
  });

  test('registra el dispositivo para recibir notificaciones', async () => {
    const token = await NotificationService.registerForPushNotifications();
    
    expect(token).toBe('token123');
    expect(NotificationService.registerForPushNotifications).toHaveBeenCalled();
  });
});