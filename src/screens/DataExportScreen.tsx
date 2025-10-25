/**
 * DataExportScreen.tsx
 * 
 * Pantalla especializada para exportación de datos de reportes de seguridad ciudadana.
 * Diseñada para autoridades y administradores que necesitan generar informes
 * y análisis de los incidentes reportados por los ciudadanos.
 * 
 * Funcionalidades principales:
 * - Filtrado avanzado de reportes por múltiples criterios
 * - Exportación en múltiples formatos (CSV, JSON, PDF)
 * - Estadísticas en tiempo real de los datos filtrados
 * - Vista previa de datos antes de exportar
 * - Análisis de distribución por categorías
 * - Interfaz optimizada para tablets y móviles
 * 
 * Casos de uso:
 * - Autoridades: Generar informes oficiales para análisis
 * - Administradores: Exportar datos para sistemas externos
 * - Analistas: Obtener datos estructurados para estudios
 * - Reportes periódicos: Automatización de informes regulares
 * 
 * Tecnologías integradas:
 * - Firebase Firestore para consultas en tiempo real
 * - ExportService para procesamiento de datos
 * - Expo FileSystem para manejo de archivos
 * - React Native Reanimated para animaciones fluidas
 * 
 * @author Equipo de Desarrollo
 * @version 1.0.0
 * @date 2024
 */

// Imports de React y React Native core
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
  Share,
  RefreshControl,
} from 'react-native';

// Componentes de navegación y layout
import { SafeAreaView } from 'react-native-safe-area-context';
import AnimatedScreen from '../components/AnimatedScreen';
import Animated, { FadeInDown, FadeInUp, FadeInLeft, FadeInRight } from 'react-native-reanimated';

// Firebase y servicios de datos
import { collection, query, where, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '../services/firebase';
import { robustOnSnapshot } from '../services/firestoreWrapper';

// Tema y estilos
import { fontSizes, spacing, colors, shadows, borderRadius } from '../theme';

// Componentes de terceros
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

// Servicios especializados
import { exportService } from '../services/exportService';
import DatePickerFallback from '../components/DatePickerFallback';
import { Picker } from '@react-native-picker/picker';

// Manejo de archivos y compartir
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

/**
 * Interface para los filtros de exportación de datos
 * 
 * Define los criterios de filtrado disponibles para personalizar
 * qué datos se incluirán en la exportación.
 * 
 * @interface ExportFilters
 */
interface ExportFilters {
  /** Fecha de inicio del rango de filtrado */
  startDate: Date;
  /** Fecha de fin del rango de filtrado */
  endDate: Date;
  /** Estado del reporte (pendiente, en proceso, resuelto, etc.) */
  status: string;
  /** Tipo de incidente (robo, accidente, vandalismo, etc.) */
  incidentType: string;
  /** Prioridad del reporte (baja, normal, alta, crítica) */
  priority: string;
  /** Zona geográfica o dirección del incidente */
  zone: string;
}

/**
 * Interface para las estadísticas de exportación
 * 
 * Contiene métricas calculadas en tiempo real sobre los datos
 * disponibles y filtrados para exportación.
 * 
 * @interface ExportStats
 */
interface ExportStats {
  /** Número total de reportes en la base de datos */
  totalReports: number;
  /** Número de reportes que cumplen los filtros actuales */
  filteredReports: number;
  /** Distribución de reportes por estado */
  statusBreakdown: { [key: string]: number };
  /** Distribución de reportes por tipo de incidente */
  typeBreakdown: { [key: string]: number };
  /** Distribución de reportes por prioridad */
  priorityBreakdown: { [key: string]: number };
}

/**
 * Componente principal de la pantalla de exportación de datos
 * 
 * Proporciona una interfaz completa para filtrar, visualizar y exportar
 * datos de reportes de seguridad ciudadana en múltiples formatos.
 * 
 * Funcionalidades integradas:
 * - Sistema de filtros avanzado con múltiples criterios
 * - Estadísticas en tiempo real de datos filtrados
 * - Exportación a CSV, JSON y PDF
 * - Vista previa de datos antes de exportar
 * - Análisis de distribución por categorías
 * - Interfaz responsiva con animaciones fluidas
 * 
 * Estados manejados:
 * - Filtros de exportación personalizables
 * - Estadísticas calculadas dinámicamente
 * - Estados de carga y exportación
 * - Opciones disponibles basadas en datos reales
 * 
 * @returns {JSX.Element} Componente de pantalla de exportación
 */
const DataExportScreen = () => {
  const [filters, setFilters] = useState<ExportFilters>({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 días atrás
    endDate: new Date(),
    status: 'all',
    incidentType: 'all',
    priority: 'all',
    zone: 'all',
  });
  const [stats, setStats] = useState<ExportStats>({
    totalReports: 0,
    filteredReports: 0,
    statusBreakdown: {},
    typeBreakdown: {},
    priorityBreakdown: {},
  });
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [availableOptions, setAvailableOptions] = useState({
    statuses: [] as string[],
    incidentTypes: [] as string[],
    priorities: [] as string[],
    zones: [] as string[],
  });

  /**
   * Función principal para cargar y procesar datos de reportes desde Firebase
   * 
   * Características principales:
   * - Establece listener en tiempo real para la colección 'reports'
   * - Procesa y filtra datos según criterios establecidos
   * - Genera estadísticas dinámicas y opciones de filtrado
   * - Maneja estados de carga y actualización
   * 
   * Funcionalidades de procesamiento:
   * - Extrae opciones únicas para filtros (estados, tipos, prioridades, zonas)
   * - Calcula conteos por categoría para estadísticas
   * - Aplica filtros de fecha, estado, tipo, prioridad y zona
   * - Actualiza estadísticas en tiempo real
   * 
   * Casos de uso:
   * - Carga inicial de datos al montar el componente
   * - Actualización automática cuando cambian los reportes
   * - Recálculo de estadísticas al cambiar filtros
   * - Sincronización en tiempo real con Firebase
   * 
   * @returns {Function} Función de limpieza para desuscribir el listener
   * @throws {Error} Si hay problemas de conexión con Firebase
   */
  const loadReportsData = () => {
    const unsubscribe = robustOnSnapshot(
      collection(db, 'reports'),
      (snapshot) => {
      const statusSet = new Set<string>();
      const typeSet = new Set<string>();
      const prioritySet = new Set<string>();
      const zoneSet = new Set<string>();
      
      const statusCounts: { [key: string]: number } = {};
      const typeCounts: { [key: string]: number } = {};
      const priorityCounts: { [key: string]: number } = {};
      
      let filteredCount = 0;
      
      // Type guard to ensure we have a QuerySnapshot
      if (!('forEach' in snapshot)) return;
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        const createdAt = data.createdAt?.toDate?.() || new Date(data.createdAt);
        
        // Recopilar opciones disponibles
        if (data.status) statusSet.add(data.status);
        if (data.incidentType) typeSet.add(data.incidentType);
        if (data.priority) prioritySet.add(data.priority);
        if (data.zone || data.address) zoneSet.add(data.zone || data.address || 'Sin zona');
        
        // Contar totales
        const status = data.status || 'Pendiente';
        const type = data.incidentType || 'Otros';
        const priority = data.priority || 'normal';
        
        statusCounts[status] = (statusCounts[status] || 0) + 1;
        typeCounts[type] = (typeCounts[type] || 0) + 1;
        priorityCounts[priority] = (priorityCounts[priority] || 0) + 1;
        
        // Aplicar filtros
        const matchesDateRange = createdAt >= filters.startDate && createdAt <= filters.endDate;
        const matchesStatus = filters.status === 'all' || data.status === filters.status;
        const matchesType = filters.incidentType === 'all' || data.incidentType === filters.incidentType;
        const matchesPriority = filters.priority === 'all' || data.priority === filters.priority;
        const matchesZone = filters.zone === 'all' || 
          (data.zone && data.zone.includes(filters.zone)) ||
          (data.address && data.address.includes(filters.zone));
        
        if (matchesDateRange && matchesStatus && matchesType && matchesPriority && matchesZone) {
          filteredCount++;
        }
      });
      
      setAvailableOptions({
        statuses: Array.from(statusSet).sort(),
        incidentTypes: Array.from(typeSet).sort(),
        priorities: Array.from(prioritySet).sort(),
        zones: Array.from(zoneSet).sort(),
      });
      
      setStats({
        totalReports: 'size' in snapshot ? snapshot.size : 0,
        filteredReports: filteredCount,
        statusBreakdown: statusCounts,
        typeBreakdown: typeCounts,
        priorityBreakdown: priorityCounts,
      });
      
      setLoading(false);
      setRefreshing(false);
      },
      (error) => {
        console.error('❌ Error cargando datos para exportar:', error);
        setLoading(false);
        setRefreshing(false);
      },
      { maxRetries: 3, retryDelay: 1000, enableLogging: true }
    );

    return unsubscribe;
  };

  /**
   * Función para manejar el gesto de pull-to-refresh
   * 
   * Características:
   * - Activa el indicador de actualización
   * - Permite al usuario refrescar manualmente los datos
   * - Se integra con el componente RefreshControl
   * 
   * Flujo de ejecución:
   * 1. Usuario hace pull-to-refresh en la lista
   * 2. Se activa el estado refreshing
   * 3. loadReportsData se ejecuta automáticamente por useEffect
   * 4. Al completarse, refreshing se desactiva en el callback
   * 
   * @returns {void}
   */
  const onRefresh = () => {
    setRefreshing(true);
  };

  /**
   * Función principal para manejar la exportación de datos en diferentes formatos
   * 
   * Características principales:
   * - Soporte para múltiples formatos: CSV, JSON y PDF
   * - Validación de datos antes de exportar
   * - Manejo de estados de carga durante el proceso
   * - Gestión de errores con feedback al usuario
   * 
   * Proceso de exportación:
   * 1. Valida que existan reportes filtrados
   * 2. Activa indicador de exportación
   * 3. Llama al servicio correspondiente según formato
   * 4. Muestra confirmación o error al usuario
   * 5. Desactiva indicador de exportación
   * 
   * Formatos soportados:
   * - CSV: Compatible con Excel, ideal para análisis
   * - JSON: Datos estructurados para integración
   * - PDF: Reporte visual para presentaciones
   * 
   * @param {('csv'|'json'|'pdf')} format - Formato de exportación deseado
   * @returns {Promise<void>} Promesa que resuelve al completar la exportación
   * @throws {Error} Si falla el proceso de exportación
   */
  const handleExport = async (format: 'csv' | 'json' | 'pdf') => {
    if (stats.filteredReports === 0) {
      Alert.alert('Sin datos', 'No hay reportes que coincidan con los filtros seleccionados.');
      return;
    }

    setExporting(true);
    
    try {
      switch (format) {
        case 'csv':
          await exportService.exportToCSV(filters);
          break;
        case 'json':
          await exportService.exportToJSON(filters);
          break;
        case 'pdf':
          await exportService.exportToPDF(filters);
          break;
      }
      
      Alert.alert(
        'Exportación Exitosa',
        `Se han exportado ${stats.filteredReports} reportes en formato ${format.toUpperCase()}.`
      );
    } catch (error) {
      console.error('Error en exportación:', error);
      Alert.alert('Error', 'No se pudo completar la exportación. Inténtelo de nuevo.');
    } finally {
      setExporting(false);
    }
  };



  /**
   * Función para restablecer todos los filtros a sus valores por defecto
   * 
   * Valores por defecto:
   * - Rango de fechas: Últimos 30 días hasta hoy
   * - Estado: Todos los estados
   * - Tipo de incidente: Todos los tipos
   * - Prioridad: Todas las prioridades
   * - Zona: Todas las zonas
   * 
   * Casos de uso:
   * - Usuario quiere ver todos los datos disponibles
   * - Limpiar filtros después de una búsqueda específica
   * - Restablecer vista inicial de la pantalla
   * 
   * Efectos secundarios:
   * - Activa useEffect que recarga los datos
   * - Actualiza estadísticas automáticamente
   * - Refresca opciones de filtrado disponibles
   * 
   * @returns {void}
   */
  const resetFilters = () => {
    setFilters({
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      endDate: new Date(),
      status: 'all',
      incidentType: 'all',
      priority: 'all',
      zone: 'all',
    });
  };

  /**
   * Función para generar y mostrar una vista previa de los datos a exportar
   * 
   * Características:
   * - Muestra resumen de reportes que serán exportados
   * - Detalla el rango de fechas seleccionado
   * - Lista todos los filtros aplicados actualmente
   * - Proporciona confirmación visual antes de exportar
   * 
   * Información mostrada:
   * - Número total de reportes filtrados
   * - Rango de fechas en formato local
   * - Estado de cada filtro (específico o "Todos")
   * - Resumen completo de criterios de selección
   * 
   * Casos de uso:
   * - Verificar datos antes de exportación
   * - Confirmar que los filtros son correctos
   * - Revisar el alcance de la exportación
   * - Validar criterios de selección
   * 
   * @returns {void}
   */
  const generatePreview = () => {
    Alert.alert(
      'Vista Previa de Datos',
      `Reportes a exportar: ${stats.filteredReports}\n\n` +
      `Período: ${filters.startDate.toLocaleDateString()} - ${filters.endDate.toLocaleDateString()}\n\n` +
      `Filtros aplicados:\n` +
      `• Estado: ${filters.status === 'all' ? 'Todos' : filters.status}\n` +
      `• Tipo: ${filters.incidentType === 'all' ? 'Todos' : filters.incidentType}\n` +
      `• Prioridad: ${filters.priority === 'all' ? 'Todas' : filters.priority}\n` +
      `• Zona: ${filters.zone === 'all' ? 'Todas' : filters.zone}`,
      [{ text: 'OK' }]
    );
  };

  useEffect(() => {
    const unsubscribe = loadReportsData();
    return unsubscribe;
  }, [filters]);

  /**
   * Componente reutilizable para tarjetas de filtros
   * 
   * Características visuales:
   * - Animación de entrada desde la izquierda
   * - Diseño consistente con sombras y bordes redondeados
   * - Título destacado y contenido flexible
   * - Integración con el sistema de tema
   * 
   * Funcionalidades:
   * - Contenedor genérico para cualquier tipo de filtro
   * - Animación suave al renderizar
   * - Estilo unificado para toda la interfaz
   * 
   * @param {string} title - Título del filtro a mostrar
   * @param {React.ReactNode} children - Contenido del filtro (pickers, botones, etc.)
   * @returns {JSX.Element} Tarjeta animada con el filtro
   */
  const FilterCard = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <Animated.View entering={FadeInLeft.duration(600)} style={styles.filterCard}>
      <Animated.Text style={styles.filterTitle}>{title}</Animated.Text>
      {children}
    </Animated.View>
  );

  /**
   * Componente para mostrar estadísticas en formato de tarjeta
   * 
   * Características visuales:
   * - Animación de entrada desde arriba
   * - Borde izquierdo colorido para categorización
   * - Icono representativo del tipo de estadística
   * - Layout responsivo con texto y valor
   * 
   * Elementos mostrados:
   * - Icono temático con color personalizado
   * - Título principal de la estadística
   * - Subtítulo opcional para contexto adicional
   * - Valor numérico destacado
   * 
   * @param {string} title - Título de la estadística
   * @param {number|string} value - Valor a mostrar
   * @param {string} icon - Nombre del icono de Ionicons
   * @param {string} color - Color del tema para icono y borde
   * @param {string} [subtitle] - Subtítulo opcional
   * @returns {JSX.Element} Tarjeta de estadística animada
   */
  const StatCard = ({ title, value, icon, color, subtitle }: {
    title: string;
    value: number | string;
    icon: string;
    color: string;
    subtitle?: string;
  }) => (
    <Animated.View entering={FadeInUp.duration(600)} style={[styles.statCard, { borderLeftColor: color }]}>
      <View style={styles.statCardContent}>
        <View style={styles.statCardLeft}>
          <Ionicons name={icon as any} size={24} color={color} />
          <View style={styles.statCardText}>
            <Animated.Text style={styles.statCardTitle}>{title}</Animated.Text>
            {subtitle && <Animated.Text style={styles.statCardSubtitle}>{subtitle}</Animated.Text>}
          </View>
        </View>
        <Animated.Text style={[styles.statCardValue, { color }]}>{value}</Animated.Text>
      </View>
    </Animated.View>
  );

  /**
   * Componente de botón para exportación en diferentes formatos
   * 
   * Características interactivas:
   * - Respuesta táctil con opacidad reducida
   * - Deshabilitación automática durante exportación
   * - Validación de datos antes de permitir exportación
   * - Feedback visual del estado del botón
   * 
   * Elementos visuales:
   * - Icono grande representativo del formato
   * - Título del formato de exportación
   * - Descripción del tipo de archivo
   * - Borde colorido según el formato
   * 
   * Estados manejados:
   * - Normal: Botón activo y disponible
   * - Deshabilitado: Durante exportación o sin datos
   * - Presionado: Feedback visual al tocar
   * 
   * @param {('csv'|'json'|'pdf')} format - Formato de exportación
   * @param {string} icon - Icono representativo del formato
   * @param {string} color - Color del tema para el formato
   * @param {string} title - Título del botón
   * @param {string} description - Descripción del formato
   * @returns {JSX.Element} Botón de exportación interactivo
   */
  const ExportButton = ({ format, icon, color, title, description }: {
    format: 'csv' | 'json' | 'pdf';
    icon: string;
    color: string;
    title: string;
    description: string;
  }) => (
    <TouchableOpacity
      style={[styles.exportButton, { borderColor: color }]}
      onPress={() => handleExport(format)}
      disabled={exporting || stats.filteredReports === 0}
      activeOpacity={0.7}
    >
      <Ionicons name={icon as any} size={32} color={color} />
      <Animated.Text style={[styles.exportButtonTitle, { color }]}>{title}</Animated.Text>
      <Animated.Text style={styles.exportButtonDescription}>{description}</Animated.Text>
    </TouchableOpacity>
  );

  return (
    <AnimatedScreen animationType="slideVertical" duration={800}>
      <View style={styles.container}>
        {/* Header con gradiente */}
        <LinearGradient
          colors={[colors.primary, colors.secondary]}
          style={styles.headerGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Animated.View entering={FadeInDown.duration(800)} style={styles.headerContent}>
            <View style={styles.headerTop}>
              <View>
                <Ionicons name="download-outline" size={32} color={colors.white} />
                <Animated.Text style={styles.title}>Exportación de Datos</Animated.Text>
                <Animated.Text style={styles.subtitle}>📊 Reportes para Autoridades</Animated.Text>
              </View>
              <TouchableOpacity style={styles.previewButton} onPress={generatePreview}>
                <Ionicons name="eye-outline" size={20} color={colors.white} />
                <Animated.Text style={styles.previewText}>Vista Previa</Animated.Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </LinearGradient>

        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={{ paddingBottom: spacing.xl }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
        >
          {loading ? (
            <Animated.View entering={FadeInUp.duration(800)} style={styles.loaderContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Animated.Text style={styles.loadingText}>Cargando datos...</Animated.Text>
            </Animated.View>
          ) : (
            <>
              {/* Estadísticas */}
              <Animated.View entering={FadeInUp.delay(100).duration(600)} style={styles.statsSection}>
                <Animated.Text style={styles.sectionTitle}>📈 Resumen de Datos</Animated.Text>
                <View style={styles.statsGrid}>
                  <StatCard
                    title="Total Reportes"
                    value={stats.totalReports}
                    icon="document-text-outline"
                    color={colors.primary}
                    subtitle="En la base de datos"
                  />
                  <StatCard
                    title="Reportes Filtrados"
                    value={stats.filteredReports}
                    icon="filter-outline"
                    color={colors.success}
                    subtitle="Listos para exportar"
                  />
                </View>
              </Animated.View>

              {/* Filtros */}
              <Animated.View entering={FadeInUp.delay(200).duration(600)} style={styles.filtersSection}>
                <View style={styles.sectionHeader}>
                  <Animated.Text style={styles.sectionTitle}>🔍 Filtros de Exportación</Animated.Text>
                  <TouchableOpacity style={styles.resetButton} onPress={resetFilters}>
                    <Ionicons name="refresh-outline" size={16} color={colors.primary} />
                    <Animated.Text style={styles.resetText}>Limpiar</Animated.Text>
                  </TouchableOpacity>
                </View>

                {/* Filtro de fechas */}
                <FilterCard title="📅 Rango de Fechas">
                  <View style={styles.dateRow}>
                    <TouchableOpacity
                      style={styles.dateButton}
                      onPress={() => setShowStartDatePicker(true)}
                    >
                      <Ionicons name="calendar-outline" size={16} color={colors.primary} />
                      <Animated.Text style={styles.dateButtonText}>
                        Desde: {filters.startDate.toLocaleDateString()}
                      </Animated.Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.dateButton}
                      onPress={() => setShowEndDatePicker(true)}
                    >
                      <Ionicons name="calendar-outline" size={16} color={colors.primary} />
                      <Animated.Text style={styles.dateButtonText}>
                        Hasta: {filters.endDate.toLocaleDateString()}
                      </Animated.Text>
                    </TouchableOpacity>
                  </View>
                </FilterCard>

                {/* Filtro de estado */}
                <FilterCard title="📋 Estado del Reporte">
                  <View style={styles.pickerContainer}>
                    <Picker
                      selectedValue={filters.status}
                      onValueChange={(value) => setFilters({ ...filters, status: value })}
                      style={styles.picker}
                    >
                      <Picker.Item label="Todos los estados" value="all" />
                      {availableOptions.statuses.map((status) => (
                        <Picker.Item key={status} label={status} value={status} />
                      ))}
                    </Picker>
                  </View>
                </FilterCard>

                {/* Filtro de tipo de incidente */}
                <FilterCard title="🚨 Tipo de Incidente">
                  <View style={styles.pickerContainer}>
                    <Picker
                      selectedValue={filters.incidentType}
                      onValueChange={(value) => setFilters({ ...filters, incidentType: value })}
                      style={styles.picker}
                    >
                      <Picker.Item label="Todos los tipos" value="all" />
                      {availableOptions.incidentTypes.map((type) => (
                        <Picker.Item key={type} label={type} value={type} />
                      ))}
                    </Picker>
                  </View>
                </FilterCard>

                {/* Filtro de prioridad */}
                <FilterCard title="⚡ Prioridad">
                  <View style={styles.pickerContainer}>
                    <Picker
                      selectedValue={filters.priority}
                      onValueChange={(value) => setFilters({ ...filters, priority: value })}
                      style={styles.picker}
                    >
                      <Picker.Item label="Todas las prioridades" value="all" />
                      {availableOptions.priorities.map((priority) => (
                        <Picker.Item key={priority} label={priority} value={priority} />
                      ))}
                    </Picker>
                  </View>
                </FilterCard>
              </Animated.View>

              {/* Botones de exportación */}
              <Animated.View entering={FadeInUp.delay(300).duration(600)} style={styles.exportSection}>
                <Animated.Text style={styles.sectionTitle}>💾 Formatos de Exportación</Animated.Text>
                
                {exporting && (
                  <Animated.View entering={FadeInUp.duration(400)} style={styles.exportingIndicator}>
                    <ActivityIndicator size="small" color={colors.primary} />
                    <Animated.Text style={styles.exportingText}>Generando archivo...</Animated.Text>
                  </Animated.View>
                )}
                
                <View style={styles.exportButtonsGrid}>
                  <ExportButton
                    format="csv"
                    icon="document-text-outline"
                    color={colors.success}
                    title="CSV"
                    description="Excel compatible"
                  />
                  <ExportButton
                    format="json"
                    icon="code-outline"
                    color={colors.blue500}
                    title="JSON"
                    description="Datos estructurados"
                  />
                  <ExportButton
                    format="pdf"
                    icon="document-outline"
                    color={colors.error}
                    title="PDF"
                    description="Reporte visual"
                  />
                </View>
              </Animated.View>

              {/* Breakdown de datos */}
              {Object.keys(stats.statusBreakdown).length > 0 && (
                <Animated.View entering={FadeInUp.delay(400).duration(600)} style={styles.breakdownSection}>
                  <Animated.Text style={styles.sectionTitle}>📊 Distribución de Datos</Animated.Text>
                  
                  <View style={styles.breakdownCard}>
                    <Animated.Text style={styles.breakdownTitle}>Por Estado</Animated.Text>
                    {Object.entries(stats.statusBreakdown).map(([status, count]) => (
                      <View key={status} style={styles.breakdownItem}>
                        <Animated.Text style={styles.breakdownLabel}>{status}</Animated.Text>
                        <Animated.Text style={styles.breakdownValue}>{count}</Animated.Text>
                      </View>
                    ))}
                  </View>
                  
                  <View style={styles.breakdownCard}>
                    <Animated.Text style={styles.breakdownTitle}>Por Tipo de Incidente</Animated.Text>
                    {Object.entries(stats.typeBreakdown).slice(0, 5).map(([type, count]) => (
                      <View key={type} style={styles.breakdownItem}>
                        <Animated.Text style={styles.breakdownLabel}>{type}</Animated.Text>
                        <Animated.Text style={styles.breakdownValue}>{count}</Animated.Text>
                      </View>
                    ))}
                  </View>
                </Animated.View>
              )}
            </>
          )}
        </ScrollView>

        {/* Date Pickers */}
        {showStartDatePicker && (
          <DatePickerFallback
            value={filters.startDate}
            mode="date"
            display="default"
            onChange={(event, selectedDate) => {
              setShowStartDatePicker(false);
              if (selectedDate) {
                setFilters({ ...filters, startDate: selectedDate });
              }
            }}
          />
        )}
        
        {showEndDatePicker && (
          <DatePickerFallback
            value={filters.endDate}
            mode="date"
            display="default"
            onChange={(event, selectedDate) => {
              setShowEndDatePicker(false);
              if (selectedDate) {
                setFilters({ ...filters, endDate: selectedDate });
              }
            }}
          />
        )}
      </View>
    </AnimatedScreen>
  );
};

export default DataExportScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray100,
  },
  headerGradient: {
    padding: spacing.lg,
    paddingTop: spacing.xl,
    borderBottomLeftRadius: borderRadius.xl,
    borderBottomRightRadius: borderRadius.xl,
    ...shadows.lg,
  },
  headerContent: {
    alignItems: 'center',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  title: {
    fontSize: fontSizes.xl,
    fontWeight: 'bold',
    color: colors.white,
    marginTop: spacing.sm,
  },
  subtitle: {
    fontSize: fontSizes.base,
    color: colors.gray200,
    marginTop: spacing.xs,
    opacity: 0.9,
  },
  previewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.base,
  },
  previewText: {
    color: colors.white,
    marginLeft: spacing.xs,
    fontSize: fontSizes.sm,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  statsSection: {
    padding: spacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginHorizontal: spacing.xs,
    borderLeftWidth: 4,
    ...shadows.md,
  },
  statCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statCardText: {
    marginLeft: spacing.sm,
    flex: 1,
  },
  statCardTitle: {
    fontSize: fontSizes.sm,
    fontWeight: '600',
    color: colors.gray800,
  },
  statCardSubtitle: {
    fontSize: fontSizes.xs,
    color: colors.gray500,
    marginTop: 2,
  },
  statCardValue: {
    fontSize: fontSizes.lg,
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: fontSizes.lg,
    fontWeight: 'bold',
    color: colors.gray800,
    marginBottom: spacing.md,
  },
  filtersSection: {
    padding: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    ...shadows.sm,
  },
  resetText: {
    color: colors.primary,
    marginLeft: spacing.xs,
    fontSize: fontSizes.sm,
    fontWeight: '500',
  },
  filterCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  filterTitle: {
    fontSize: fontSizes.md,
    fontWeight: '600',
    color: colors.gray800,
    marginBottom: spacing.sm,
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dateButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray100,
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    marginHorizontal: spacing.xs,
  },
  dateButtonText: {
    marginLeft: spacing.xs,
    fontSize: fontSizes.sm,
    color: colors.gray800,
  },
  pickerContainer: {
    backgroundColor: colors.gray100,
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  exportSection: {
    padding: spacing.md,
  },
  exportingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.blue100,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  exportingText: {
    marginLeft: spacing.sm,
    color: colors.primary,
    fontSize: fontSizes.sm,
    fontWeight: '500',
  },
  exportButtonsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  exportButton: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    marginHorizontal: spacing.xs,
    borderWidth: 2,
    ...shadows.md,
  },
  exportButtonTitle: {
    fontSize: fontSizes.md,
    fontWeight: 'bold',
    marginTop: spacing.sm,
  },
  exportButtonDescription: {
    fontSize: fontSizes.xs,
    color: colors.gray500,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  breakdownSection: {
    padding: spacing.md,
  },
  breakdownCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  breakdownTitle: {
    fontSize: fontSizes.md,
    fontWeight: '600',
    color: colors.gray800,
    marginBottom: spacing.sm,
  },
  breakdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  breakdownLabel: {
    fontSize: fontSizes.sm,
    color: colors.gray800,
    flex: 1,
  },
  breakdownValue: {
    fontSize: fontSizes.sm,
    fontWeight: 'bold',
    color: colors.primary,
    backgroundColor: colors.gray100,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  loaderContainer: {
    alignItems: 'center',
    marginTop: spacing.xl,
    paddingHorizontal: spacing.md,
  },
  loadingText: {
    color: colors.gray500,
    marginTop: spacing.md,
    fontSize: fontSizes.base,
    fontWeight: '500',
  },
});