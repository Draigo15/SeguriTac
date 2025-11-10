import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import ReportDetailScreen from '../src/screens/ReportDetailScreen';

// Ya no necesitamos esta línea porque importamos directamente el componente

// Mock de los servicios de reportes
jest.mock('../src/services/reports', () => ({
  getReportById: jest.fn(() => Promise.resolve({
    id: '1',
    title: 'Robo en calle principal',
    description: 'Se reporta robo de celular',
    status: 'pendiente',
    date: new Date().toISOString(),
    location: { latitude: -33.45, longitude: -70.67 },
    type: 'robo',
    userId: 'user123'
  })),
  updateReportStatus: jest.fn(() => Promise.resolve({ success: true }))
}));

// Mock de autenticación
jest.mock('../src/services/auth', () => ({
  getCurrentUser: jest.fn(() => ({ 
    uid: 'auth123', 
    email: 'authority@example.com',
    role: 'authority' 
  }))
}));

// Mock de navegación
const mockGoBack = jest.fn();
jest.mock('@react-navigation/native', () => {
  const actualNav = jest.requireActual('@react-navigation/native');
  return {
    ...actualNav,
    useNavigation: () => ({
      goBack: mockGoBack,
    }),
    useRoute: () => ({
      params: { reportId: '1' }
    }),
  };
});

describe('Cambiar Estado del Reporte', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('muestra los detalles del reporte correctamente', async () => {
    const { getByText } = render(
      <NavigationContainer>
        <ReportDetailScreen />
      </NavigationContainer>
    );

    // Verificar que se muestren los detalles del reporte
    await waitFor(() => {
      expect(getByText('Robo en calle principal')).toBeTruthy();
      expect(getByText('Se reporta robo de celular')).toBeTruthy();
      expect(getByText('Estado: pendiente')).toBeTruthy();
    });
  });

  test('permite a la autoridad cambiar el estado del reporte', async () => {
    const { getByText, getByTestId } = render(
      <NavigationContainer>
        <ReportDetailScreen />
      </NavigationContainer>
    );

    // Esperar a que se carguen los detalles del reporte
    await waitFor(() => {
      expect(getByText('Robo en calle principal')).toBeTruthy();
    });

    // Verificar que exista el selector de estado para autoridades
    const statusPicker = await waitFor(() => getByTestId('status-picker'));
    expect(statusPicker).toBeTruthy();

    // Simular cambio de estado
    fireEvent(statusPicker, 'onValueChange', 'en proceso');
    
    // Presionar el botón de actualizar
    const updateButton = getByTestId('update-status-button');
    fireEvent.press(updateButton);

    // Verificar que se haya llamado al servicio de actualización
    await waitFor(() => {
      expect(require('../src/services/reports').updateReportStatus).toHaveBeenCalledWith(
        '1', 
        'en proceso'
      );
    });

    // Verificar mensaje de éxito
    expect(getByText('Estado actualizado correctamente')).toBeTruthy();
  });

  test('no muestra opciones de cambio de estado para usuarios normales', async () => {
    // Cambiar el mock para simular un usuario normal
    require('../src/services/auth').getCurrentUser.mockImplementationOnce(() => ({ 
      uid: 'user123', 
      email: 'user@example.com',
      role: 'citizen' 
    }));

    const { getByText, queryByTestId } = render(
      <NavigationContainer>
        <ReportDetailScreen />
      </NavigationContainer>
    );

    // Esperar a que se carguen los detalles del reporte
    await waitFor(() => {
      expect(getByText('Robo en calle principal')).toBeTruthy();
    });

    // Verificar que NO exista el selector de estado para usuarios normales
    const statusPicker = queryByTestId('status-picker');
    expect(statusPicker).toBeNull();
  });

  test('muestra error si la actualización de estado falla', async () => {
    // Sobrescribir el mock para simular un error
    require('../src/services/reports').updateReportStatus.mockImplementationOnce(() => 
      Promise.reject(new Error('Error al actualizar'))
    );

    const { getByText, getByTestId } = render(
      <NavigationContainer>
        <ReportDetailScreen />
      </NavigationContainer>
    );

    // Esperar a que se carguen los detalles del reporte
    await waitFor(() => {
      expect(getByText('Robo en calle principal')).toBeTruthy();
    });

    // Simular cambio de estado
    const statusPicker = await waitFor(() => getByTestId('status-picker'));
    fireEvent(statusPicker, 'onValueChange', 'resuelto');
    
    // Presionar el botón de actualizar
    const updateButton = getByTestId('update-status-button');
    fireEvent.press(updateButton);

    // Verificar mensaje de error
    await waitFor(() => {
      expect(getByText('Error al actualizar el estado')).toBeTruthy();
    });
  });
});