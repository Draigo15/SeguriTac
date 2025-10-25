import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import ReportFiltersScreen from '../src/screens/ReportFiltersScreen';

// Mock de los servicios de reportes
jest.mock('../src/services/reports', () => ({
  getReportsByFilters: jest.fn((filters) => {
    if (filters.type === 'robo') {
      return Promise.resolve([
        { 
          id: '1', 
          title: 'Robo en calle principal', 
          description: 'Se reporta robo de celular', 
          status: 'pendiente',
          date: '2023-05-15T10:30:00Z',
          location: { latitude: -33.45, longitude: -70.67 },
          type: 'robo'
        }
      ]);
    } else if (filters.startDate && filters.endDate) {
      return Promise.resolve([
        { 
          id: '2', 
          title: 'Accidente de tránsito', 
          description: 'Colisión entre dos vehículos', 
          status: 'en proceso',
          date: '2023-05-20T15:45:00Z',
          location: { latitude: -33.44, longitude: -70.65 },
          type: 'accidente'
        }
      ]);
    } else {
      return Promise.resolve([]);
    }
  })
}));

describe('Acceso a Reportes por Fecha y Tipo', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('filtra reportes por tipo correctamente', async () => {
    const { getByTestId, getByText, getAllByTestId } = render(<ReportFiltersScreen />);
    
    // Seleccionar tipo de reporte
    const typePicker = getByTestId('type-picker');
    fireEvent(typePicker, 'onValueChange', 'robo');
    
    // Presionar botón de buscar
    const searchButton = getByTestId('search-button');
    fireEvent.press(searchButton);
    
    // Verificar que se llame al servicio con los filtros correctos
    expect(require('../src/services/reports').getReportsByFilters).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'robo' })
    );
    
    // Verificar que se muestren los resultados
    await waitFor(() => {
      const reportItems = getAllByTestId('report-item');
      expect(reportItems.length).toBe(1);
      expect(getByText('Robo en calle principal')).toBeTruthy();
    });
  });
  
  test('filtra reportes por rango de fechas correctamente', async () => {
    const { getByTestId, getByText, getAllByTestId } = render(<ReportFiltersScreen />);
    
    // Seleccionar fechas
    const startDatePicker = getByTestId('start-date-picker');
    fireEvent(startDatePicker, 'onChange', { nativeEvent: { timestamp: new Date('2023-05-01').getTime() } });
    
    const endDatePicker = getByTestId('end-date-picker');
    fireEvent(endDatePicker, 'onChange', { nativeEvent: { timestamp: new Date('2023-05-31').getTime() } });
    
    // Presionar botón de buscar
    const searchButton = getByTestId('search-button');
    fireEvent.press(searchButton);
    
    // Verificar que se llame al servicio con los filtros correctos
    expect(require('../src/services/reports').getReportsByFilters).toHaveBeenCalledWith(
      expect.objectContaining({ 
        startDate: expect.any(String),
        endDate: expect.any(String)
      })
    );
    
    // Verificar que se muestren los resultados
    await waitFor(() => {
      const reportItems = getAllByTestId('report-item');
      expect(reportItems.length).toBe(1);
      expect(getByText('Accidente de tránsito')).toBeTruthy();
    });
  });
  
  test('muestra mensaje cuando no hay resultados', async () => {
    // Sobrescribir el mock para devolver un array vacío
    require('../src/services/reports').getReportsByFilters.mockImplementationOnce(() => 
      Promise.resolve([])
    );
    
    const { getByTestId, getByText } = render(<ReportFiltersScreen />);
    
    // Presionar botón de buscar sin filtros
    const searchButton = getByTestId('search-button');
    fireEvent.press(searchButton);
    
    // Verificar que se muestre el mensaje de no hay resultados
    await waitFor(() => {
      expect(getByText('No se encontraron reportes con los filtros seleccionados')).toBeTruthy();
    });
  });
});