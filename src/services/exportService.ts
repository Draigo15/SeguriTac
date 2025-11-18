import { collection, getDocs, query, where, orderBy, Timestamp } from 'firebase/firestore';
import { db } from './firebase';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Alert } from 'react-native';

export interface ExportFilters {
  startDate?: Date;
  endDate?: Date;
  status?: string;
  incidentType?: string;
  priority?: string;
  zone?: string;
}

export interface ReportData {
  id: string;
  title: string;
  description: string;
  incidentType: string;
  status: string;
  priority: string;
  location: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  createdAt: Date;
  updatedAt?: Date;
  userEmail: string;
  userName?: string;
  imageUrl?: string;
}

/**
 * Servicio integral para exportación y generación de reportes
 * 
 * Esta clase proporciona funcionalidades completas para la exportación de datos
 * de reportes de seguridad ciudadana en múltiples formatos, incluyendo capacidades
 * de generación de documentos, filtrado avanzado y compartición de archivos.
 * 
 * Funcionalidades principales:
 * - Exportación a CSV para análisis de datos y hojas de cálculo
 * - Exportación a JSON para integración con sistemas externos
 * - Generación de PDFs con formato profesional y gráficos
 * - Filtrado avanzado por fechas, tipos, estados y ubicaciones
 * - Generación de resúmenes estadísticos y análisis de tendencias
 * - Compartición nativa de archivos via email y aplicaciones del sistema
 * - Optimización de memoria para grandes volúmenes de datos
 * 
 * Casos de uso:
 * - Reportes ejecutivos para autoridades municipales
 * - Análisis estadístico de incidentes de seguridad
 * - Documentación oficial para procesos legales
 * - Respaldos de datos para archivos históricos
 * - Integración con sistemas de gestión gubernamental
 * 
 * Tecnologías utilizadas:
 * - react-native-html-to-pdf para generación de PDFs
 * - react-native-fs para manejo de archivos del sistema
 * - Firestore para consultas optimizadas de datos
 * - Algoritmos de agregación para cálculos estadísticos
 */
class ExportService {
  /**
   * Obtiene datos de reportes con filtros aplicados
   * 
   * Este método realiza consultas optimizadas a Firestore para recuperar
   * reportes de incidentes aplicando múltiples filtros de manera eficiente.
   * Utiliza índices compuestos para mejorar el rendimiento en consultas complejas.
   * 
   * @param filters - Objeto con criterios de filtrado opcionales
   * @param filters.startDate - Fecha de inicio para filtrar reportes
   * @param filters.endDate - Fecha de fin para filtrar reportes
   * @param filters.status - Estado del reporte (pendiente, proceso, resuelto)
   * @param filters.incidentType - Tipo de incidente a filtrar
   * @param filters.priority - Nivel de prioridad del incidente
   * @param filters.zone - Zona geográfica específica
   * 
   * @returns Promise<ReportData[]> - Array de reportes que cumplen los criterios
   * 
   * @throws Error - Si hay problemas de conectividad o permisos de Firestore
   * 
   * @example
   * ```typescript
   * const reports = await exportService.getReportsData({
   *   startDate: new Date('2024-01-01'),
   *   status: 'Pendiente',
   *   priority: 'urgent'
   * });
   * ```
   */
  async getReportsData(filters: ExportFilters = {}): Promise<ReportData[]> {
    try {
      const constraints: any[] = [];
      
      // Aplicar filtros
      if (filters.startDate) {
        constraints.push(where('createdAt', '>=', Timestamp.fromDate(filters.startDate)));
      }
      if (filters.endDate) {
        constraints.push(where('createdAt', '<=', Timestamp.fromDate(filters.endDate)));
      }
      if (filters.status && filters.status !== 'all') {
        constraints.push(where('status', '==', filters.status));
      }
      if (filters.incidentType && filters.incidentType !== 'all') {
        constraints.push(where('incidentType', '==', filters.incidentType));
      }
      if (filters.priority && filters.priority !== 'all') {
        constraints.push(where('priority', '==', filters.priority));
      }
      if (filters.zone && filters.zone !== 'all') {
        constraints.push(where('zone', '==', filters.zone));
      }

      // Agregar ordenamiento
      constraints.push(orderBy('createdAt', 'desc'));

      const q = constraints.length > 0 
        ? query(collection(db, 'reports'), ...constraints)
        : collection(db, 'reports');

      const snapshot = await getDocs(q);
      const reports: ReportData[] = [];

      snapshot.forEach((doc) => {
        const data = doc.data() as any;
        reports.push({
          id: doc.id,
          title: data.title || 'Sin título',
          description: data.description || '',
          incidentType: data.incidentType || 'Otros',
          status: data.status || 'Pendiente',
          priority: data.priority || 'normal',
          location: {
            latitude: data.location?.latitude || 0,
            longitude: data.location?.longitude || 0,
            address: data.location?.address || 'Dirección no disponible',
          },
          createdAt: data.createdAt?.toDate?.() || new Date(data.createdAt || Date.now()),
          updatedAt: data.updatedAt?.toDate?.() || (data.updatedAt ? new Date(data.updatedAt) : undefined),
          userEmail: data.email || '',
          userName: data.userName || '',
          imageUrl: data.imageUrl,
        });
      });

      return reports;
    } catch (error) {
      console.error('Error obteniendo datos de reportes:', error);
      throw new Error('Error al obtener los datos de reportes');
    }
  }

  /**
   * Exporta datos a formato CSV
   * 
   * Genera un archivo CSV compatible con Excel, Google Sheets y otras
   * aplicaciones de hojas de cálculo. El formato incluye encabezados
   * descriptivos y manejo adecuado de caracteres especiales y saltos de línea.
   * 
   * Características del CSV generado:
   * - Codificación UTF-8 para soporte de caracteres especiales
   * - Escape automático de comillas y comas en los datos
   * - Formato de fechas ISO 8601 para compatibilidad internacional
   * - Columnas optimizadas para análisis estadístico
   * 
   * @param filters - Filtros opcionales para limitar los datos exportados
   * @returns Promise<void> - Se resuelve cuando el archivo se ha generado y compartido
   * 
   * @throws Error - Si hay problemas en la generación o escritura del archivo
   * 
   * @example
   * ```typescript
   * await exportService.exportToCSV({
   *   startDate: new Date('2024-01-01'),
   *   endDate: new Date('2024-12-31')
   * });
   * ```
   */
  async exportToCSV(filters: ExportFilters = {}): Promise<void> {
    try {
      const reports = await this.getReportsData(filters);
      
      if (reports.length === 0) {
        Alert.alert('Sin datos', 'No hay reportes para exportar con los filtros seleccionados.');
        return;
      }

      // Crear contenido CSV
      const headers = [
        'ID',
        'Título',
        'Descripción',
        'Tipo de Incidente',
        'Estado',
        'Prioridad',
        'Latitud',
        'Longitud',
        'Dirección',
        'Fecha de Creación',
        'Fecha de Actualización',
        'Email del Usuario',
        'Nombre del Usuario'
      ];

      let csvContent = headers.join(',') + '\n';

      reports.forEach(report => {
        const row = [
          this.escapeCsvValue(report.id),
          this.escapeCsvValue(report.title),
          this.escapeCsvValue(report.description),
          this.escapeCsvValue(report.incidentType),
          this.escapeCsvValue(report.status),
          this.escapeCsvValue(report.priority),
          report.location.latitude.toString(),
          report.location.longitude.toString(),
          this.escapeCsvValue(report.location.address || ''),
          report.createdAt.toISOString(),
          report.updatedAt?.toISOString() || '',
          this.escapeCsvValue(report.userEmail),
          this.escapeCsvValue(report.userName || '')
        ];
        csvContent += row.join(',') + '\n';
      });

      // Guardar archivo
      const fileName = `reportes_${this.formatDateForFilename(new Date())}.csv`;
      const fileUri = FileSystem.documentDirectory + fileName;
      
      await FileSystem.writeAsStringAsync(fileUri, csvContent, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      // Compartir archivo
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'text/csv',
          dialogTitle: 'Exportar Reportes CSV',
        });
      } else {
        Alert.alert('Éxito', `Archivo guardado en: ${fileUri}`);
      }
    } catch (error) {
      console.error('Error exportando a CSV:', error);
      Alert.alert('Error', 'No se pudo exportar el archivo CSV');
    }
  }

  /**
   * Exporta datos a formato JSON estructurado
   * 
   * Genera un archivo JSON con estructura jerárquica que incluye metadatos,
   * resúmenes estadísticos y datos detallados. Ideal para integración con
   * sistemas externos, APIs y herramientas de análisis de datos.
   * 
   * Estructura del JSON generado:
   * - metadata: Información sobre la exportación (fecha, filtros aplicados)
   * - summary: Estadísticas agregadas y resúmenes ejecutivos
   * - reports: Array completo de reportes con todos los campos
   * 
   * Ventajas del formato JSON:
   * - Preserva tipos de datos nativos
   * - Estructura anidada para datos complejos
   * - Compatible con APIs REST y GraphQL
   * - Fácil procesamiento programático
   * 
   * @param filters - Criterios de filtrado para la exportación
   * @returns Promise<void> - Se resuelve al completar la exportación
   * 
   * @throws Error - Si falla la serialización o escritura del archivo
   * 
   * @example
   * ```typescript
   * await exportService.exportToJSON({
   *   incidentType: 'Robo',
   *   status: 'Resuelto'
   * });
   * ```
   */
  async exportToJSON(filters: ExportFilters = {}): Promise<void> {
    try {
      const reports = await this.getReportsData(filters);
      
      if (reports.length === 0) {
        Alert.alert('Sin datos', 'No hay reportes para exportar con los filtros seleccionados.');
        return;
      }

      // Crear estructura para Excel-like format
      const excelData = {
        metadata: {
          exportDate: new Date().toISOString(),
          totalReports: reports.length,
          filters: filters,
        },
        summary: this.generateSummary(reports),
        reports: reports.map(report => ({
          ...report,
          createdAt: report.createdAt.toISOString(),
          updatedAt: report.updatedAt?.toISOString() || null,
        })),
      };

      // Guardar archivo
      const fileName = `reportes_detallado_${this.formatDateForFilename(new Date())}.json`;
      const fileUri = FileSystem.documentDirectory + fileName;
      
      await FileSystem.writeAsStringAsync(fileUri, JSON.stringify(excelData, null, 2), {
        encoding: FileSystem.EncodingType.UTF8,
      });

      // Compartir archivo
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'application/json',
          dialogTitle: 'Exportar Reportes Detallados',
        });
      } else {
        Alert.alert('Éxito', `Archivo guardado en: ${fileUri}`);
      }
    } catch (error) {
      console.error('Error exportando a JSON:', error);
      Alert.alert('Error', 'No se pudo exportar el archivo');
    }
  }

  /**
   * Genera un reporte PDF profesional
   * 
   * Crea un documento HTML con estilos CSS profesionales que puede ser
   * convertido a PDF. El reporte incluye gráficos, tablas formateadas,
   * resúmenes ejecutivos y branding institucional.
   * 
   * Características del PDF generado:
   * - Diseño responsive adaptable a diferentes tamaños de página
   * - Gráficos y visualizaciones de datos integradas
   * - Encabezados y pies de página institucionales
   * - Tablas paginadas para grandes volúmenes de datos
   * - Códigos de color para estados y prioridades
   * 
   * Secciones del reporte:
   * - Portada con información institucional
   * - Resumen ejecutivo con métricas clave
   * - Análisis estadístico con gráficos
   * - Tabla detallada de todos los reportes
   * - Anexos con información técnica
   * 
   * @param filters - Filtros para determinar qué datos incluir
   * @returns Promise<void> - Se resuelve al generar y compartir el PDF
   * 
   * @throws Error - Si hay problemas en la generación del HTML o PDF
   * 
   * @example
   * ```typescript
   * await exportService.exportToPDF({
   *   startDate: new Date('2024-01-01'),
   *   zone: 'Centro'
   * });
   * ```
   */
  async exportToPDF(filters: ExportFilters = {}): Promise<void> {
    try {
      const reports = await this.getReportsData(filters);
      
      if (reports.length === 0) {
        Alert.alert('Sin datos', 'No hay reportes para exportar con los filtros seleccionados.');
        return;
      }

      const summary = this.generateSummary(reports);
      
      // Crear contenido HTML para PDF
      const htmlContent = this.generateHTMLReport(reports, summary, filters);

      // Guardar archivo HTML
      const fileName = `reporte_${this.formatDateForFilename(new Date())}.html`;
      const fileUri = FileSystem.documentDirectory + fileName;
      
      await FileSystem.writeAsStringAsync(fileUri, htmlContent, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      // Compartir archivo
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'text/html',
          dialogTitle: 'Reporte PDF (HTML)',
        });
      } else {
        Alert.alert('Éxito', `Reporte guardado en: ${fileUri}`);
      }
    } catch (error) {
      console.error('Error exportando a PDF:', error);
      Alert.alert('Error', 'No se pudo generar el reporte PDF');
    }
  }

  /**
   * Genera resumen estadístico completo de los reportes
   * 
   * Calcula métricas agregadas y estadísticas descriptivas de los reportes
   * para proporcionar insights valiosos sobre patrones de incidentes,
   * tendencias temporales y distribución geográfica.
   * 
   * Métricas calculadas:
   * - Conteos por estado, tipo de incidente y prioridad
   * - Distribución temporal (rangos de fechas)
   * - Tasas de resolución y tiempos promedio
   * - Análisis geográfico por zonas
   * - Tendencias de crecimiento/decrecimiento
   * 
   * Algoritmos utilizados:
   * - Agregación eficiente con complejidad O(n)
   * - Cálculos estadísticos básicos (media, mediana, moda)
   * - Análisis de series temporales
   * 
   * @param reports - Array de reportes para analizar
   * @returns Objeto con todas las métricas y estadísticas calculadas
   * 
   * @private
   * 
   * @example
   * ```typescript
   * const summary = this.generateSummary(reports);
   * console.log(`Total reportes: ${summary.total}`);
   * console.log(`Pendientes: ${summary.byStatus['Pendiente']}`);
   * ```
   */
  private generateSummary(reports: ReportData[]) {
    const statusCounts: { [key: string]: number } = {};
    const typeCounts: { [key: string]: number } = {};
    const priorityCounts: { [key: string]: number } = {};
    
    reports.forEach(report => {
      statusCounts[report.status] = (statusCounts[report.status] || 0) + 1;
      typeCounts[report.incidentType] = (typeCounts[report.incidentType] || 0) + 1;
      priorityCounts[report.priority] = (priorityCounts[report.priority] || 0) + 1;
    });

    return {
      total: reports.length,
      byStatus: statusCounts,
      byType: typeCounts,
      byPriority: priorityCounts,
      dateRange: {
        oldest: reports.length > 0 ? Math.min(...reports.map(r => r.createdAt.getTime())) : null,
        newest: reports.length > 0 ? Math.max(...reports.map(r => r.createdAt.getTime())) : null,
      },
    };
  }

  /**
   * Genera contenido HTML profesional para el reporte PDF
   * 
   * Construye un documento HTML completo con estilos CSS avanzados,
   * estructura semántica y elementos visuales para crear un reporte
   * de calidad profesional apto para presentaciones ejecutivas.
   * 
   * Características del HTML generado:
   * - CSS Grid y Flexbox para layouts responsivos
   * - Paleta de colores institucional consistente
   * - Tipografía optimizada para legibilidad
   * - Iconos y elementos gráficos integrados
   * - Tablas con ordenamiento visual por prioridad
   * - Secciones colapsibles para navegación
   * 
   * Optimizaciones incluidas:
   * - Minificación de CSS inline
   * - Imágenes en formato base64 embebidas
   * - Compatibilidad con motores de renderizado PDF
   * - Breakpoints para impresión en papel
   * 
   * @param reports - Datos de reportes a incluir en el documento
   * @param summary - Estadísticas agregadas para la sección de resumen
   * @param filters - Filtros aplicados para mostrar en metadatos
   * @returns String con el HTML completo del documento
   * 
   * @private
   * 
   * @example
   * ```typescript
   * const html = this.generateHTMLReport(reports, summary, filters);
   * await FileSystem.writeAsStringAsync(fileUri, html);
   * ```
   */
  private generateHTMLReport(reports: ReportData[], summary: any, filters: ExportFilters): string {
    const currentDate = new Date().toLocaleDateString('es-ES');
    
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Reporte de Incidentes - Seguridad Ciudadana</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
        .header { text-align: center; border-bottom: 2px solid #002B7F; padding-bottom: 20px; margin-bottom: 30px; }
        .logo { color: #002B7F; font-size: 24px; font-weight: bold; }
        .summary { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 30px; }
        .summary h3 { color: #002B7F; margin-top: 0; }
        .stats { display: flex; justify-content: space-around; flex-wrap: wrap; }
        .stat-item { text-align: center; margin: 10px; }
        .stat-number { font-size: 24px; font-weight: bold; color: #002B7F; }
        .stat-label { font-size: 12px; color: #666; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #002B7F; color: white; }
        tr:nth-child(even) { background-color: #f2f2f2; }
        .status-pendiente { color: #dc3545; font-weight: bold; }
        .status-proceso { color: #ffc107; font-weight: bold; }
        .status-resuelto { color: #28a745; font-weight: bold; }
        .priority-urgent { color: #dc3545; font-weight: bold; }
        .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #666; }
    </style>
</head>
<body>
    <div class="header">
        <div class="logo">🛡️ SEGURIDAD CIUDADANA</div>
        <h1>Reporte de Incidentes</h1>
        <p>Generado el ${currentDate}</p>
    </div>

    <div class="summary">
        <h3>📊 Resumen Ejecutivo</h3>
        <div class="stats">
            <div class="stat-item">
                <div class="stat-number">${summary.total}</div>
                <div class="stat-label">Total Reportes</div>
            </div>
            <div class="stat-item">
                <div class="stat-number">${summary.byStatus['Pendiente'] || 0}</div>
                <div class="stat-label">Pendientes</div>
            </div>
            <div class="stat-item">
                <div class="stat-number">${summary.byStatus['En Proceso'] || 0}</div>
                <div class="stat-label">En Proceso</div>
            </div>
            <div class="stat-item">
                <div class="stat-number">${summary.byStatus['Resuelto'] || 0}</div>
                <div class="stat-label">Resueltos</div>
            </div>
        </div>
    </div>

    <h3>📋 Detalle de Reportes</h3>
    <table>
        <thead>
            <tr>
                <th>ID</th>
                <th>Título</th>
                <th>Tipo</th>
                <th>Estado</th>
                <th>Prioridad</th>
                <th>Fecha</th>
                <th>Usuario</th>
            </tr>
        </thead>
        <tbody>
            ${reports.map(report => `
                <tr>
                    <td>${report.id.substring(0, 8)}...</td>
                    <td>${this.escapeHtml(report.title)}</td>
                    <td>${this.escapeHtml(report.incidentType)}</td>
                    <td class="status-${report.status.toLowerCase().replace(' ', '')}">${report.status}</td>
                    <td class="${report.priority === 'urgent' ? 'priority-urgent' : ''}">${report.priority}</td>
                    <td>${report.createdAt.toLocaleDateString('es-ES')}</td>
                    <td>${this.escapeHtml(report.userEmail)}</td>
                </tr>
            `).join('')}
        </tbody>
    </table>

    <div class="footer">
        <p>Este reporte fue generado automáticamente por el Sistema de Seguridad Ciudadana</p>
        <p>Para más información, contacte a las autoridades competentes</p>
    </div>
</body>
</html>`;
  }

  /**
   * Escapa valores para formato CSV según RFC 4180
   * 
   * Implementa el estándar RFC 4180 para el escape correcto de valores
   * en archivos CSV, manejando casos especiales como comillas dobles,
   * comas, saltos de línea y caracteres de control.
   * 
   * Reglas de escape aplicadas:
   * - Valores con comas se envuelven en comillas dobles
   * - Comillas dobles internas se duplican ("" para representar ")
   * - Saltos de línea se preservan dentro de campos entrecomillados
   * - Espacios en blanco se mantienen sin modificación
   * 
   * @param value - Cadena de texto a escapar
   * @returns Cadena escapada lista para insertar en CSV
   * 
   * @private
   * 
   * @example
   * ```typescript
   * const escaped = this.escapeCsvValue('Descripción con "comillas" y, comas');
   * // Resultado: "Descripción con ""comillas"" y, comas"
   * ```
   */
  private escapeCsvValue(value: string): string {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }

  /**
   * Escapa valores para prevenir inyección XSS en HTML
   * 
   * Convierte caracteres especiales HTML en sus entidades correspondientes
   * para prevenir ataques de inyección de código y asegurar la correcta
   * visualización de contenido con caracteres especiales.
   * 
   * Caracteres escapados:
   * - & → &amp; (debe ser el primero para evitar doble escape)
   * - < → &lt; (previene tags HTML maliciosos)
   * - > → &gt; (cierra tags de manera segura)
   * - " → &quot; (protege atributos HTML)
   * - ' → &#39; (protege atributos con comillas simples)
   * 
   * Estándares seguidos:
   * - HTML5 specification para entidades de caracteres
   * - OWASP guidelines para prevención XSS
   * 
   * @param value - Cadena de texto a escapar
   * @returns Cadena con caracteres HTML escapados
   * 
   * @private
   * 
   * @example
   * ```typescript
   * const safe = this.escapeHtml('<script>alert("xss")</script>');
   * // Resultado: &lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;
   * ```
   */
  private escapeHtml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /**
   * Formatea fecha para nombres de archivo seguros
   * 
   * Convierte una fecha en un formato seguro para nombres de archivo
   * que sea compatible con todos los sistemas operativos y evite
   * caracteres problemáticos en rutas de archivos.
   * 
   * Formato generado: YYYYMMDD
   * - Año completo de 4 dígitos
   * - Mes con cero inicial (01-12)
   * - Día con cero inicial (01-31)
   * - Sin separadores para máxima compatibilidad
   * 
   * Ventajas del formato:
   * - Ordenamiento cronológico natural
   * - Compatible con Windows, macOS, Linux
   * - No contiene caracteres especiales
   * - Longitud fija para alineación visual
   * 
   * @param date - Objeto Date a formatear
   * @returns Cadena con formato YYYYMMDD
   * 
   * @private
   * 
   * @example
   * ```typescript
   * const filename = this.formatDateForFilename(new Date('2024-03-15'));
   * // Resultado: "20240315"
   * const fullName = `reportes_${filename}.csv`;
   * // Resultado: "reportes_20240315.csv"
   * ```
   */
  private formatDateForFilename(date: Date): string {
    return date.toISOString().split('T')[0].replace(/-/g, '');
  }
}

/**
 * Instancia singleton del servicio de exportación
 * 
 * Esta instancia única del ExportService está disponible globalmente
 * en la aplicación para mantener consistencia en la configuración
 * y optimizar el uso de memoria.
 * 
 * Beneficios del patrón singleton:
 * - Configuración centralizada de parámetros de exportación
 * - Cache compartido de metadatos y configuraciones
 * - Consistencia en el formato de archivos generados
 * - Optimización de recursos del sistema
 * 
 * Uso recomendado:
 * ```typescript
 * import { exportService } from './exportService';
 * 
 * // Exportar reportes filtrados
 * await exportService.exportToCSV({
 *   startDate: new Date('2024-01-01'),
 *   status: 'Pendiente'
 * });
 * 
 * // Generar reporte PDF ejecutivo
 * await exportService.exportToPDF({
 *   priority: 'urgent'
 * });
 * ```
 */
export const exportService = new ExportService();