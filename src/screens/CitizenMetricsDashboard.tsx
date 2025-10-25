import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Dimensions,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import AnimatedScreen from '../components/AnimatedScreen';
import Animated, { FadeInDown, FadeInUp, FadeInLeft, FadeInRight } from 'react-native-reanimated';
import { BarChart, LineChart, PieChart } from 'react-native-chart-kit';
import { collection, query, where, Timestamp, QuerySnapshot, DocumentData } from 'firebase/firestore';
import { db } from '../services/firebase';
import { robustOnSnapshot } from '../services/firestoreWrapper';
import { fontSizes, spacing, colors, shadows, borderRadius } from '../theme';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { heatmapService, ZoneRisk, TrendData } from '../services/heatmapService';
import { exportService } from '../services/exportService';

const screenWidth = Dimensions.get('window').width;

interface MetricsData {
  totalReports: number;
  urgentReports: number;
  recentReports: number;
  resolvedReports: number;
  statusCounts: { [key: string]: number };
  incidentTypeCounts: { [key: string]: number };
  weeklyTrends: { date: string; count: number }[];
}

const CitizenMetricsDashboard = () => {
  const [metricsData, setMetricsData] = useState<MetricsData>({
    totalReports: 0,
    urgentReports: 0,
    recentReports: 0,
    resolvedReports: 0,
    statusCounts: {},
    incidentTypeCounts: {},
    weeklyTrends: [],
  });
  const [zoneRisks, setZoneRisks] = useState<ZoneRisk[]>([]);
  const [zoneTrends, setZoneTrends] = useState<TrendData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTimeRange, setSelectedTimeRange] = useState<'7d' | '30d' | '90d'>('30d');

  const loadMetricsData = () => {
    const unsubscribe = robustOnSnapshot(
      collection(db, 'reports'),
      (snapshot) => {
        // Type guard to ensure we have a QuerySnapshot
        if (!('forEach' in snapshot)) return;
        
        const statusCounts: { [key: string]: number } = {};
      const incidentCounts: { [key: string]: number } = {};
      let urgent = 0;
      let recent = 0;
      let resolved = 0;
      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      
      const weeklyData: { [date: string]: number } = {};
      
      // Inicializar datos semanales
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const dateStr = date.toISOString().split('T')[0];
        weeklyData[dateStr] = 0;
      }

      snapshot.forEach((doc) => {
        const data = doc.data();
        const rawStatus = data.status || 'Pendiente';
        statusCounts[rawStatus] = (statusCounts[rawStatus] || 0) + 1;

        // Contar tipos de incidentes
        const incidentType = data.incidentType || 'Otros';
        incidentCounts[incidentType] = (incidentCounts[incidentType] || 0) + 1;

        // Contar reportes urgentes
        if (data.priority === 'urgent' || data.urgent === true) {
          urgent++;
        }

        // Contar reportes resueltos
        if (rawStatus === 'Resuelto') {
          resolved++;
        }

        // Contar reportes recientes (últimas 24 horas)
        const createdAt = data.createdAt?.toDate?.() || new Date(data.createdAt);
        if (createdAt >= oneDayAgo) {
          recent++;
        }

        // Datos de tendencia semanal
        if (createdAt >= oneWeekAgo) {
          const dateStr = createdAt.toISOString().split('T')[0];
          if (weeklyData[dateStr] !== undefined) {
            weeklyData[dateStr]++;
          }
        }
      });

      const weeklyTrends = Object.entries(weeklyData)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, count]) => ({ date, count }));

      setMetricsData({
        totalReports: snapshot.size,
        urgentReports: urgent,
        recentReports: recent,
        resolvedReports: resolved,
        statusCounts,
        incidentTypeCounts: incidentCounts,
        weeklyTrends,
      });
      
      setLoading(false);
      setRefreshing(false);
      },
      (error) => {
        console.error('❌ Error cargando métricas ciudadanas:', error);
        setLoading(false);
        setRefreshing(false);
      },
      { maxRetries: 3, retryDelay: 1000, enableLogging: true }
    );

    return unsubscribe;
  };

  const loadZoneData = async () => {
    try {
      const zones = await heatmapService.getZoneRisks(1000);
      setZoneRisks(zones);
      
      if (zones.length > 0) {
        const days = selectedTimeRange === '7d' ? 7 : selectedTimeRange === '30d' ? 30 : 90;
        const trends = await heatmapService.getTrendsByZone(zones.slice(0, 5), days);
        setZoneTrends(trends);
      }
    } catch (error) {
      console.error('Error cargando datos de zonas:', error);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadZoneData();
  };

  const handleExport = () => {
    Alert.alert(
      'Exportar Datos',
      'Seleccione el formato de exportación:',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'CSV', onPress: () => exportService.exportToCSV() },
        { text: 'JSON', onPress: () => exportService.exportToJSON() },
        { text: 'PDF', onPress: () => exportService.exportToPDF() },
      ]
    );
  };

  useEffect(() => {
    const unsubscribe = loadMetricsData();
    loadZoneData();
    return unsubscribe;
  }, [selectedTimeRange]);

  const pieData = useMemo(() => {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'];
    return Object.entries(metricsData.statusCounts).map(([status, count], index) => ({
      name: status,
      population: count,
      color: colors[index % colors.length],
      legendFontColor: '#333',
      legendFontSize: 12,
    }));
  }, [metricsData.statusCounts]);

  const weeklyChartData = useMemo(() => ({
    labels: metricsData.weeklyTrends.map(item => {
      const date = new Date(item.date);
      return date.toLocaleDateString('es-ES', { weekday: 'short' });
    }),
    datasets: [{
      data: metricsData.weeklyTrends.map(item => item.count),
      color: (opacity = 1) => `rgba(0, 43, 127, ${opacity})`,
      strokeWidth: 3,
    }],
  }), [metricsData.weeklyTrends]);

  const topZonesChartData = useMemo(() => {
    const topZones = zoneRisks.slice(0, 5);
    return {
      labels: topZones.map(zone => zone.zone),
      datasets: [{
        data: topZones.map(zone => zone.incidentCount),
      }],
    };
  }, [zoneRisks]);

  const StatCard = ({ title, value, icon, color, subtitle, onPress }: {
    title: string;
    value: number;
    icon: string;
    color: string;
    subtitle?: string;
    onPress?: () => void;
  }) => (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.statCard, { borderLeftColor: color }]}
      activeOpacity={onPress ? 0.7 : 1}
    >
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
    </TouchableOpacity>
  );

  const ZoneRiskCard = ({ zone }: { zone: ZoneRisk }) => {
    const getRiskColor = (level: string) => {
      switch (level) {
        case 'critical': return '#DC3545';
        case 'high': return '#FD7E14';
        case 'medium': return '#FFC107';
        case 'low': return '#28A745';
        default: return '#6C757D';
      }
    };

    const getRiskIcon = (level: string) => {
      switch (level) {
        case 'critical': return 'warning';
        case 'high': return 'alert-circle';
        case 'medium': return 'information-circle';
        case 'low': return 'checkmark-circle';
        default: return 'help-circle';
      }
    };

    return (
      <Animated.View entering={FadeInLeft.duration(500)} style={styles.zoneCard}>
        <View style={styles.zoneHeader}>
          <View style={styles.zoneTitle}>
            <Ionicons name="location" size={20} color={colors.primary} />
            <Animated.Text style={styles.zoneName}>{zone.zone}</Animated.Text>
          </View>
          <View style={[styles.riskBadge, { backgroundColor: getRiskColor(zone.riskLevel) }]}>
            <Ionicons name={getRiskIcon(zone.riskLevel) as any} size={16} color="white" />
            <Animated.Text style={styles.riskText}>{zone.riskLevel.toUpperCase()}</Animated.Text>
          </View>
        </View>
        <View style={styles.zoneStats}>
          <View style={styles.zoneStat}>
            <Animated.Text style={styles.zoneStatNumber}>{zone.incidentCount}</Animated.Text>
            <Animated.Text style={styles.zoneStatLabel}>Incidentes</Animated.Text>
          </View>
          <View style={styles.zoneStat}>
            <Animated.Text style={styles.zoneStatNumber}>{Math.round(zone.radius / 1000)}km</Animated.Text>
            <Animated.Text style={styles.zoneStatLabel}>Radio</Animated.Text>
          </View>
        </View>
        {zone.topIncidentTypes.length > 0 && (
          <View style={styles.topIncidents}>
            <Animated.Text style={styles.topIncidentsTitle}>Principales tipos:</Animated.Text>
            {zone.topIncidentTypes.slice(0, 2).map((incident, index) => (
              <Animated.Text key={index} style={styles.incidentType}>
                • {incident.type} ({incident.count})
              </Animated.Text>
            ))}
          </View>
        )}
      </Animated.View>
    );
  };

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
                <Ionicons name="analytics-outline" size={32} color={colors.white} />
                <Animated.Text style={styles.title}>Dashboard Ciudadano</Animated.Text>
                <Animated.Text style={styles.subtitle}>📊 Métricas y Tendencias</Animated.Text>
              </View>
              <TouchableOpacity style={styles.exportButton} onPress={handleExport}>
                <Ionicons name="download-outline" size={20} color={colors.white} />
                <Animated.Text style={styles.exportText}>Exportar</Animated.Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </LinearGradient>

        {loading ? (
          <Animated.View entering={FadeInUp.duration(800)} style={styles.loaderContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Animated.Text style={styles.loadingText}>Cargando métricas...</Animated.Text>
          </Animated.View>
        ) : (
          <>
            {/* Tarjetas de estadísticas principales */}
            <Animated.View entering={FadeInUp.delay(100).duration(600)} style={styles.statsGrid}>
              <View style={styles.statsRow}>
                <StatCard
                  title="Total Reportes"
                  value={metricsData.totalReports}
                  icon="document-text-outline"
                  color={colors.primary}
                  subtitle="Todos los reportes"
                />
                <StatCard
                  title="Urgentes"
                  value={metricsData.urgentReports}
                  icon="warning-outline"
                  color={colors.error}
                  subtitle="Requieren atención"
                />
              </View>
              <View style={styles.statsRow}>
                <StatCard
                  title="Últimas 24h"
                  value={metricsData.recentReports}
                  icon="time-outline"
                  color={colors.blue500}
                  subtitle="Reportes recientes"
                />
                <StatCard
                  title="Resueltos"
                  value={metricsData.resolvedReports}
                  icon="checkmark-circle-outline"
                  color={colors.success}
                  subtitle="Casos cerrados"
                />
              </View>
            </Animated.View>

            {/* Selector de rango de tiempo */}
            <Animated.View entering={FadeInUp.delay(200).duration(600)} style={styles.timeRangeSelector}>
              <Animated.Text style={styles.sectionTitle}>Período de análisis:</Animated.Text>
              <View style={styles.timeButtons}>
                {(['7d', '30d', '90d'] as const).map((range) => (
                  <TouchableOpacity
                    key={range}
                    style={[
                      styles.timeButton,
                      selectedTimeRange === range && styles.timeButtonActive
                    ]}
                    onPress={() => setSelectedTimeRange(range)}
                  >
                    <Animated.Text style={[
                      styles.timeButtonText,
                      selectedTimeRange === range && styles.timeButtonTextActive
                    ]}>
                      {range === '7d' ? '7 días' : range === '30d' ? '30 días' : '90 días'}
                    </Animated.Text>
                  </TouchableOpacity>
                ))}
              </View>
            </Animated.View>

            {/* Gráfico de tendencias semanales */}
            <Animated.View entering={FadeInUp.delay(300).duration(800)} style={styles.chartCard}>
              <View style={styles.chartHeader}>
                <Ionicons name="trending-up-outline" size={24} color={colors.primary} />
                <Animated.Text style={styles.sectionTitle}>Tendencia Semanal</Animated.Text>
              </View>
              {metricsData.weeklyTrends.length > 0 && (
                <LineChart
                  data={weeklyChartData}
                  width={screenWidth - 32}
                  height={220}
                  chartConfig={chartConfig}
                  bezier
                  style={{ marginVertical: 8, borderRadius: 16 }}
                />
              )}
            </Animated.View>

            {/* Gráfico de distribución por estado */}
            {pieData.length > 0 && (
              <Animated.View entering={FadeInUp.delay(400).duration(800)} style={styles.chartCard}>
                <View style={styles.chartHeader}>
                  <Ionicons name="pie-chart-outline" size={24} color={colors.primary} />
                  <Animated.Text style={styles.sectionTitle}>Distribución por Estado</Animated.Text>
                </View>
                <PieChart
                  data={pieData}
                  width={screenWidth - 32}
                  height={220}
                  chartConfig={chartConfig}
                  accessor="population"
                  backgroundColor="transparent"
                  paddingLeft="16"
                  absolute
                />
              </Animated.View>
            )}

            {/* Top zonas de riesgo */}
            {zoneRisks.length > 0 && topZonesChartData.labels.length > 0 && (
              <Animated.View entering={FadeInUp.delay(500).duration(800)} style={styles.chartCard}>
                <View style={styles.chartHeader}>
                  <Ionicons name="bar-chart-outline" size={24} color={colors.primary} />
                  <Animated.Text style={styles.sectionTitle}>Top Zonas por Incidentes</Animated.Text>
                </View>
                <BarChart
                  data={topZonesChartData}
                  width={screenWidth - 32}
                  height={220}
                  chartConfig={chartConfig}
                  yAxisLabel=""
                  yAxisSuffix=""
                  verticalLabelRotation={15}
                  style={{ marginVertical: 8, borderRadius: 16 }}
                />
              </Animated.View>
            )}

            {/* Zonas de riesgo detalladas */}
            {zoneRisks.length > 0 && (
              <Animated.View entering={FadeInUp.delay(600).duration(800)} style={styles.zonesSection}>
                <View style={styles.chartHeader}>
                  <Ionicons name="location-outline" size={24} color={colors.primary} />
                  <Animated.Text style={styles.sectionTitle}>Zonas de Riesgo Identificadas</Animated.Text>
                </View>
                {zoneRisks.slice(0, 5).map((zone, index) => (
                  <ZoneRiskCard key={index} zone={zone} />
                ))}
              </Animated.View>
            )}
          </>
        )}
      </ScrollView>
    </AnimatedScreen>
  );
};

export default CitizenMetricsDashboard;

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
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.base,
  },
  exportText: {
    color: colors.white,
    marginLeft: spacing.xs,
    fontSize: fontSizes.sm,
    fontWeight: '600',
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
  timeRangeSelector: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  timeButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: spacing.sm,
  },
  timeButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.base,
    backgroundColor: colors.white,
    ...shadows.sm,
  },
  timeButtonActive: {
    backgroundColor: colors.primary,
  },
  timeButtonText: {
    fontSize: fontSizes.sm,
    color: colors.gray800,
    fontWeight: '500',
  },
  timeButtonTextActive: {
    color: colors.white,
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
  zonesSection: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  zoneCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  zoneHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  zoneTitle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  zoneName: {
    fontSize: fontSizes.base,
    fontWeight: 'bold',
    color: colors.gray800,
    marginLeft: spacing.xs,
  },
  riskBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  riskText: {
    color: colors.white,
    fontSize: fontSizes.xs,
    fontWeight: 'bold',
    marginLeft: spacing.xs,
  },
  zoneStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: spacing.sm,
  },
  zoneStat: {
    alignItems: 'center',
  },
  zoneStatNumber: {
    fontSize: fontSizes.lg,
    fontWeight: 'bold',
    color: colors.primary,
  },
  zoneStatLabel: {
    fontSize: fontSizes.xs,
    color: colors.gray500,
  },
  topIncidents: {
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
    paddingTop: spacing.sm,
  },
  topIncidentsTitle: {
    fontSize: fontSizes.sm,
    fontWeight: '600',
    color: colors.gray800,
    marginBottom: spacing.xs,
  },
  incidentType: {
    fontSize: fontSizes.xs,
    color: colors.gray500,
    marginBottom: 2,
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