// Servicio para gestión de reportes
import { firestore } from '../config/firebase';

/**
 * Función para escuchar cambios en el estado de reportes de un usuario
 * @param {string} userId - ID del usuario
 * @param {Function} callback - Función a ejecutar cuando cambia un reporte
 * @returns {Function} - Función para cancelar la suscripción
 */
export const onReportStatusChange = (userId, callback) => {
  // En una implementación real, esto se conectaría a Firestore
  // Simulamos la funcionalidad para las pruebas
  const mockUnsubscribe = () => {};
  
  // Simulamos un cambio de estado para las pruebas
  setTimeout(() => {
    const mockReport = {
      id: 'report1',
      title: 'Robo en calle principal',
      status: 'en proceso',
      userId: userId
    };
    callback(mockReport);
  }, 100);
  
  return mockUnsubscribe;
};

/**
 * Función para filtrar reportes por tipo
 * @param {Array} reports - Lista de reportes
 * @param {string} type - Tipo de reporte a filtrar
 * @returns {Array} - Reportes filtrados
 */
export const filterReportsByType = (reports, type) => {
  if (!type || type === 'todos') return reports;
  return reports.filter(report => report.type === type);
};

/**
 * Función para filtrar reportes por rango de fechas
 * @param {Array} reports - Lista de reportes
 * @param {Date} startDate - Fecha inicial
 * @param {Date} endDate - Fecha final
 * @returns {Array} - Reportes filtrados
 */
export const filterReportsByDateRange = (reports, startDate, endDate) => {
  if (!startDate && !endDate) return reports;
  
  return reports.filter(report => {
    const reportDate = new Date(report.date);
    
    if (startDate && endDate) {
      return reportDate >= startDate && reportDate <= endDate;
    } else if (startDate) {
      return reportDate >= startDate;
    } else if (endDate) {
      return reportDate <= endDate;
    }
    
    return true;
  });
};

export default {
  onReportStatusChange,
  filterReportsByType,
  filterReportsByDateRange
};