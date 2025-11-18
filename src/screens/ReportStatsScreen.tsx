/**
 * ReportStatsScreen - Pantalla de Visualización de Estadísticas
 * 
 * REQUISITO FUNCIONAL: RF-14 - Visualización de Estadísticas
 * 
 * DESCRIPCIÓN:
 * Esta pantalla muestra gráficos de torta y barra con estadísticas de incidentes
 * por tipo y estado, usando datos de Firestore y react-native-chart-kit.
 * 
 * FUNCIONALIDADES PRINCIPALES:
 * - Gráfico de torta mostrando distribución de reportes por estado (Pendiente, En Proceso, Resuelto)
 * - Gráfico de barras comparativo por estado
 * - Tarjetas estadísticas con métricas clave (total, urgentes, recientes, resueltos)
 * - Lista de tipos de incidentes más reportados con porcentajes
 * - Actualización en tiempo real usando onSnapshot de Firestore
 * - Pull-to-refresh para actualizar datos manualmente
 * - Animaciones fluidas para mejorar la experiencia de usuario
 * 
 * TECNOLOGÍAS UTILIZADAS:
 * - react-native-chart-kit: Para gráficos de torta y barras
 * - Firebase Firestore: Base de datos en tiempo real
 * - react-native-reanimated: Animaciones avanzadas
 * - expo-linear-gradient: Gradientes en el header
 * 
 * CONEXIONES CON OTROS RF:
 * - RF-3: Utiliza datos de reportes de incidentes registrados
 * - RF-7: Complementa la gestión de reportes con análisis estadístico
 * - RF-11: Muestra indicadores de carga y estados de la aplicación
 * 
 * AUTOR: Sistema de Seguridad Ciudadana
 * FECHA: 2024
 * VERSIÓN: 1.0
 */

// ===== IMPORTS DE REACT Y REACT NATIVE =====
import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Dimensions,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';

// ===== IMPORTS DE COMPONENTES PERSONALIZADOS =====
import AnimatedScreen from '../components/AnimatedScreen';

// ===== IMPORTS DE LIBRERÍAS DE TERCEROS =====
import Animated, { FadeInDown, FadeInUp, FadeInLeft, FadeInRight } from 'react-native-reanimated';
import { BarChart, PieChart, LineChart } from 'react-native-chart-kit'; // RF-14: Gráficos estadísticos
import { collection, query, orderBy, limit, onSnapshot, QuerySnapshot, FirestoreError } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

// ===== IMPORTS DE SERVICIOS Y CONFIGURACIÓN =====
import { db } from '../services/firebase'; // RF-14: Conexión a Firestore para datos estadísticos
import { fontSizes, spacing, colors, shadows, borderRadius } from '../theme';

// RF-14: Obtener ancho de pantalla para gráficos responsivos
const screenWidth = Dimensions.get('window').width;

/**
 * ReportStatsScreen - Componente principal de estadísticas
 * 
 * RF-14: Visualización de Estadísticas
 * Muestra gráficos de torta y barra con estadísticas de incidentes por tipo y estado
 * 
 * ESTADOS MANEJADOS:
 * - statusCounts: Contadores por estado (Pendiente, En Proceso, Resuelto)
 * - incidentTypeCounts: Contadores por tipo de incidente
 * - totalReports: Total de reportes en el sistema
 * - urgentReports: Reportes marcados como urgentes
 * - recentReports: Reportes de las últimas 24 horas
 * - loading: Estado de carga inicial
 * - refreshing: Estado de actualización manual
 */
const ReportStatsScreen = () => {
  // RF-14: Estados para contadores de reportes por estado
  const [statusCounts, setStatusCounts] = useState({
    Pendiente: 0,
    'En Proceso': 0,
    Resuelto: 0,
  });
  
  // RF-14: Contadores dinámicos por tipo de incidente
  const [incidentTypeCounts, setIncidentTypeCounts] = useState<{[key: string]: number}>({});
  
  // RF-14: Métricas estadísticas principales
  const [totalReports, setTotalReports] = useState(0);
  const [urgentReports, setUrgentReports] = useState(0);
  const [recentReports, setRecentReports] = useState(0);
  
  // RF-11: Estados de carga y retroalimentación visual
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  /**
   * loadData - Función de carga de datos estadísticos en tiempo real
   * 
   * RF-14: Visualización de Estadísticas
   * Establece un listener en tiempo real para la colección 'reports' de Firestore
   * y calcula automáticamente todas las métricas estadísticas necesarias.
   * 
   * FUNCIONALIDADES:
   * - Escucha cambios en tiempo real usando onSnapshot
   * - Calcula contadores por estado (Pendiente, En Proceso, Resuelto)
   * - Agrupa y cuenta tipos de incidentes dinámicamente
   * - Identifica reportes urgentes y recientes (últimas 24h)
   * - Maneja errores de conexión con Firestore
   * 
   * CONEXIÓN CON RF-11: Actualiza estados de carga para retroalimentación visual
   * 
   * @returns {function} Función unsubscribe para limpiar el listener
   */
  const loadData = () => {
    // RF-14: Establecer listener en tiempo real para la colección de reportes
    const unsubscribe = onSnapshot(
      collection(db, 'reports'),
      (snapshot: QuerySnapshot) => {
        // RF-14: Inicializar contadores para estadísticas
        const counts = { Pendiente: 0, 'En Proceso': 0, Resuelto: 0 };
        const incidentCounts: {[key: string]: number} = {};
        let urgent = 0;
        let recent = 0;
        
        // RF-14: Calcular fecha límite para reportes recientes (24 horas)
        const now = new Date();
        const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

        // RF-14: Procesar cada documento de reporte para generar estadísticas
        snapshot.forEach((doc) => {
          const data = doc.data();
          
          // RF-14: Contar reportes por estado
          const rawStatus = data.status;
          const status = (rawStatus ?? 'Pendiente') as keyof typeof counts;
          if (status in counts) counts[status]++;

          // RF-14: Contar tipos de incidentes dinámicamente
          const incidentType = data.incidentType || 'Otros';
          incidentCounts[incidentType] = (incidentCounts[incidentType] || 0) + 1;

          // RF-14: Identificar reportes urgentes
          if (data.priority === 'urgent' || data.urgent === true) {
            urgent++;
          }

          // RF-14: Contar reportes recientes (últimas 24 horas)
          const createdAt = data.createdAt?.toDate?.() || new Date(data.createdAt);
          if (createdAt >= oneDayAgo) {
            recent++;
          }
        });

        // RF-14: Actualizar todos los estados con las estadísticas calculadas
        setStatusCounts(counts);
        setIncidentTypeCounts(incidentCounts);
        setTotalReports(snapshot.size);
        setUrgentReports(urgent);
        setRecentReports(recent);
        
        // RF-11: Actualizar estados de carga para retroalimentación visual
        setLoading(false);
        setRefreshing(false);
      },
      (error: FirestoreError) => {
        // RF-11: Manejo de errores con retroalimentación al usuario
        console.error('❌ Error cargando estadísticas:', error);
        setLoading(false);
        setRefreshing(false);
      }
    );

    return unsubscribe;
  };

  /**
   * onRefresh - Función para actualización manual de datos
   * 
   * RF-14: Permite al usuario actualizar manualmente las estadísticas
   * RF-11: Proporciona retroalimentación visual durante la actualización
   * 
   * Nota: Los datos se actualizan automáticamente con onSnapshot,
   * esta función solo proporciona feedback visual al usuario.
   */
  const onRefresh = () => {
    setRefreshing(true);
    // RF-14: Los datos se actualizan automáticamente con onSnapshot
    // RF-11: Simular tiempo de actualización para feedback visual
    setTimeout(() => setRefreshing(false), 1000);
  };

  /**
   * useEffect - Inicialización del componente
   * 
   * RF-14: Establece el listener de datos al montar el componente
   * y limpia el listener al desmontarlo para evitar memory leaks
   */
  useEffect(() => {
    return loadData(); // RF-14: Retorna función de limpieza del listener
  }, []);

  /**
   * pieData - Configuración de datos para gráfico de torta
   * 
   * RF-14: Define la estructura de datos para el gráfico de distribución
   * por estado usando react-native-chart-kit
   * 
   * COLORES:
   * - Pendiente: Rojo (error) - Requiere atención
   * - En Proceso: Amarillo (warning) - En progreso
   * - Resuelto: Verde (success) - Completado
   */
  const pieData = [
    {
      name: 'Pendiente',
      population: statusCounts['Pendiente'], // RF-14: Datos dinámicos desde Firestore
      color: colors.error, // RF-14: Color rojo para casos pendientes
      legendFontColor: '#333',
      legendFontSize: 14,
    },
    {
      name: 'En Proceso',
      population: statusCounts['En Proceso'], // RF-14: Datos dinámicos desde Firestore
      color: colors.warning, // RF-14: Color amarillo para casos en proceso
      legendFontColor: '#333',
      legendFontSize: 14,
    },
    {
      name: 'Resuelto',
      population: statusCounts['Resuelto'], // RF-14: Datos dinámicos desde Firestore
      color: colors.success, // RF-14: Color verde para casos resueltos
      legendFontColor: '#333',
      legendFontSize: 14,
    },
  ];

  /**
   * topIncidentTypes - Cálculo de tipos de incidentes más frecuentes
   * 
   * RF-14: Procesa los datos de incidentes para mostrar los 5 tipos
   * más reportados, ordenados de mayor a menor frecuencia
   * 
   * Utiliza useMemo para optimizar el rendimiento y evitar
   * recálculos innecesarios en cada render
   */
  const topIncidentTypes = useMemo(() => {
    return Object.entries(incidentTypeCounts)
      .sort(([,a], [,b]) => b - a) // RF-14: Ordenar por frecuencia descendente
      .slice(0, 5); // RF-14: Mostrar solo los 5 más frecuentes
  }, [incidentTypeCounts]);

  /**
   * StatCard - Componente de tarjeta estadística reutilizable
   * 
   * RF-14: Muestra métricas individuales con diseño consistente
   * RF-11: Incluye animaciones para mejorar la experiencia visual
   * 
   * PROPS:
   * @param {string} title - Título de la métrica
   * @param {number} value - Valor numérico a mostrar
   * @param {string} icon - Nombre del icono de Ionicons
   * @param {string} color - Color temático de la tarjeta
   * @param {string} subtitle - Descripción opcional de la métrica
   */
  const StatCard = ({ title, value, icon, color, subtitle }: {
    title: string;
    value: number;
    icon: string;
    color: string;
    subtitle?: string;
  }) => (
    <Animated.View entering={FadeInUp.duration(600)} style={[styles.statCard, { borderLeftColor: color }]}>
      <View style={styles.statCardContent}>
        <View style={styles.statCardLeft}>
          {/* RF-14: Icono temático para identificación visual rápida */}
          <Ionicons name={icon as any} size={24} color={color} />
          <View style={styles.statCardText}>
            <Animated.Text style={styles.statCardTitle}>{title}</Animated.Text>
            {subtitle && <Animated.Text style={styles.statCardSubtitle}>{subtitle}</Animated.Text>}
          </View>
        </View>
        {/* RF-14: Valor destacado con color temático */}
        <Animated.Text style={[styles.statCardValue, { color }]}>{value}</Animated.Text>
      </View>
    </Animated.View>
  );

  /**
   * RENDER PRINCIPAL - RF-14: Visualización de Estadísticas
   * 
   * Estructura de la pantalla:
   * 1. Header con gradiente y título
   * 2. Tarjetas de métricas principales
   * 3. Gráfico de torta (distribución por estado)
   * 4. Gráfico de barras (comparativa por estado)
   * 5. Lista de tipos de incidentes más frecuentes
   */
  return (
    <AnimatedScreen animationType="slideVertical" duration={800}>
      <ScrollView 
        style={styles.container} 
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
        {/* RF-14: Header con gradiente y título del dashboard */}
        <LinearGradient
          colors={[colors.primary, colors.secondary]}
          style={styles.headerGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Animated.View entering={FadeInDown.duration(800)} style={styles.headerContent}>
            <Ionicons name="analytics-outline" size={32} color={colors.white} />
            <Animated.Text style={styles.title}>Dashboard Estadístico</Animated.Text>
            <Animated.Text style={styles.subtitle}>📊 Análisis en tiempo real</Animated.Text>
          </Animated.View>
        </LinearGradient>

        {loading ? (
          // RF-11: Indicador de carga con retroalimentación visual
          <Animated.View entering={FadeInUp.duration(800)} style={styles.loaderContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Animated.Text style={styles.loadingText}>Cargando estadísticas...</Animated.Text>
          </Animated.View>
        ) : (
          <>
            {/* RF-14: Tarjetas de estadísticas principales con métricas clave */}
            <Animated.View entering={FadeInUp.delay(100).duration(600)} style={styles.statsGrid}>
              <View style={styles.statsRow}>
                {/* RF-14: Métrica de total de reportes en el sistema */}
                <StatCard
                  title="Total Reportes"
                  value={totalReports}
                  icon="document-text-outline"
                  color={colors.primary}
                  subtitle="Todos los reportes"
                />
                {/* RF-14: Métrica de reportes urgentes que requieren atención inmediata */}
                <StatCard
                  title="Reportes Urgentes"
                  value={urgentReports}
                  icon="warning-outline"
                  color={colors.error}
                  subtitle="Requieren atención"
                />
              </View>
              <View style={styles.statsRow}>
                {/* RF-14: Métrica de actividad reciente (últimas 24 horas) */}
                <StatCard
                  title="Últimas 24h"
                  value={recentReports}
                  icon="time-outline"
                  color={colors.blue500}
                  subtitle="Reportes recientes"
                />
                {/* RF-14: Métrica de casos completados exitosamente */}
                <StatCard
                  title="Resueltos"
                  value={statusCounts.Resuelto}
                  icon="checkmark-circle-outline"
                  color={colors.success}
                  subtitle="Casos cerrados"
                />
              </View>
            </Animated.View>

            {/* RF-14: Gráfico de torta - Distribución porcentual por estado */}
            <Animated.View entering={FadeInUp.delay(200).duration(800)} style={styles.chartCard}>
              <View style={styles.chartHeader}>
                <Ionicons name="pie-chart-outline" size={24} color={colors.primary} />
                <Animated.Text style={styles.sectionTitle}>Distribución por Estado</Animated.Text>
              </View>
              {/* RF-14: Gráfico de torta usando react-native-chart-kit */}
              <PieChart
                data={pieData} // RF-14: Datos dinámicos calculados desde Firestore
                width={screenWidth - 32} // RF-14: Ancho responsivo
                height={220}
                chartConfig={chartConfig}
                accessor="population"
                backgroundColor="transparent"
                paddingLeft="16"
                absolute // RF-14: Mostrar valores absolutos en lugar de porcentajes
              />
            </Animated.View>

            {/* RF-14: Gráfico de barras - Comparativa visual por estado */}
            <Animated.View entering={FadeInUp.delay(300).duration(800)} style={styles.chartCard}>
              <View style={styles.chartHeader}>
                <Ionicons name="bar-chart-outline" size={24} color={colors.primary} />
                <Animated.Text style={styles.sectionTitle}>Comparativa por Estado</Animated.Text>
              </View>
              {/* RF-14: Gráfico de barras para comparación directa */}
              <BarChart
                data={{
                  labels: ['Pendiente', 'En Proceso', 'Resuelto'], // RF-14: Etiquetas de estados
                  datasets: [
                    {
                      data: [
                        statusCounts['Pendiente'], // RF-14: Datos dinámicos desde Firestore
                        statusCounts['En Proceso'],
                        statusCounts['Resuelto'],
                      ],
                    },
                  ],
                }}
                width={screenWidth - 32} // RF-14: Ancho responsivo
                height={220}
                chartConfig={chartConfig}
                yAxisLabel=""
                yAxisSuffix=""
                verticalLabelRotation={15} // RF-14: Rotación para mejor legibilidad
                style={{ marginVertical: 8, borderRadius: 16 }}
              />
            </Animated.View>

            {/* RF-14: Lista de tipos de incidentes más frecuentes con análisis porcentual */}
            {topIncidentTypes.length > 0 && (
              <Animated.View entering={FadeInUp.delay(400).duration(800)} style={styles.chartCard}>
                <View style={styles.chartHeader}>
                  <Ionicons name="list-outline" size={24} color={colors.primary} />
                  <Animated.Text style={styles.sectionTitle}>Tipos de Incidentes Más Reportados</Animated.Text>
                </View>
                <View style={styles.incidentList}>
                  {/* RF-14: Mapear los 5 tipos de incidentes más frecuentes */}
                  {topIncidentTypes.map(([type, count], index) => (
                    <Animated.View
                      key={type}
                      entering={FadeInLeft.delay(index * 100).duration(500)} // RF-11: Animación escalonada
                      style={styles.incidentItem}
                    >
                      <View style={styles.incidentLeft}>
                        {/* RF-14: Indicador visual con punto de color */}
                        <View style={[styles.incidentDot, { backgroundColor: colors.primary }]} />
                        <Animated.Text style={styles.incidentType}>{type}</Animated.Text>
                      </View>
                      <View style={styles.incidentRight}>
                        {/* RF-14: Mostrar cantidad absoluta */}
                        <Animated.Text style={styles.incidentCount}>{count}</Animated.Text>
                        {/* RF-14: Calcular y mostrar porcentaje del total */}
                        <Animated.Text style={styles.incidentPercentage}>
                          {totalReports > 0 ? `${Math.round((count / totalReports) * 100)}%` : '0%'}
                        </Animated.Text>
                      </View>
                    </Animated.View>
                  ))}
                </View>
              </Animated.View>
            )}
          </>
        )}
      </ScrollView>
    </AnimatedScreen>
  );
};

export default ReportStatsScreen;

const chartConfig = {
  backgroundGradientFrom: '#f4f6fa',
  backgroundGradientTo: '#f4f6fa',
  decimalPlaces: 0,
  color: (opacity = 1) => `rgba(0, 43, 127, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(51, 51, 51, ${opacity})`,
  style: {
    borderRadius: 16,
  },
  propsForDots: {
    r: '6',
    strokeWidth: '2',
    stroke: '#002B7F',
  },
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  headerGradient: {
    padding: spacing.lg,
    paddingTop: spacing.xl,
    borderBottomLeftRadius: borderRadius.xl,
    borderBottomRightRadius: borderRadius.xl,
    marginBottom: spacing.md,
    ...shadows.lg,
  },
  headerContent: {
    alignItems: 'center',
  },
  title: {
    fontSize: fontSizes.xl,
    fontWeight: 'bold',
    color: colors.white,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: fontSizes.base,
    color: colors.gray200,
    textAlign: 'center',
    marginTop: spacing.xs,
    opacity: 0.9,
  },
  statsGrid: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
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
  chartCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    ...shadows.md,
  },
  chartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSizes.md,
    fontWeight: 'bold',
    color: colors.gray800,
    marginLeft: spacing.sm,
    flex: 1,
  },
  incidentList: {
    marginTop: spacing.sm,
  },
  incidentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.gray100,
    borderRadius: borderRadius.base,
    marginBottom: spacing.xs,
  },
  incidentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  incidentDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacing.sm,
  },
  incidentType: {
    fontSize: fontSizes.base,
    fontWeight: '500',
    color: colors.gray800,
    flex: 1,
  },
  incidentRight: {
    alignItems: 'flex-end',
  },
  incidentCount: {
    fontSize: fontSizes.md,
    fontWeight: 'bold',
    color: colors.primary,
  },
  incidentPercentage: {
    fontSize: fontSizes.xs,
    color: colors.gray500,
    marginTop: 2,
  },
  loaderContainer: {
    alignItems: 'center',
    marginTop: spacing.xl,
    paddingHorizontal: spacing.md,
  },
  loadingText: {
    color: colors.gray600,
    marginTop: spacing.md,
    fontSize: fontSizes.base,
    fontWeight: '500',
  },
});
