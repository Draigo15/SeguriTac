import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  Modal,
  ScrollView,
  RefreshControl,
} from 'react-native';
import AnimatedScreen from '../components/AnimatedScreen';
import Animated, { FadeInDown, FadeInUp, FadeInLeft } from 'react-native-reanimated';
import HeatmapWebView from '../components/HeatmapWebView';
import { collection } from 'firebase/firestore';
import { db } from '../services/firebase';
import { robustOnSnapshot } from '../services/firestoreWrapper';
import { fontSizes, spacing, colors, shadows, borderRadius } from '../theme';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { heatmapService, ZoneRisk, HeatmapPoint } from '../services/heatmapService';
import { exportService } from '../services/exportService';

const { width, height } = Dimensions.get('window');

interface Report {
  id: string;
  latitude: number;
  longitude: number;
  incidentType: string;
  status: string;
  priority?: string;
  urgent?: boolean;
  createdAt: any;
  description?: string;
}

const IncidentHeatmapScreen = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [heatmapPoints, setHeatmapPoints] = useState<HeatmapPoint[]>([]);
  const [zoneRisks, setZoneRisks] = useState<ZoneRisk[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedZone, setSelectedZone] = useState<ZoneRisk | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [mapCenter, setMapCenter] = useState({ lat: 4.7110, lng: -74.0721 }); // Bogotá por defecto


  const loadReportsData = () => {
    const unsubscribe = robustOnSnapshot(
      collection(db, 'reports'),
      (snapshot) => {
        // Type guard to ensure we have a QuerySnapshot
        if (!('forEach' in snapshot)) return;
        
        const reportsData: Report[] = [];
        
        snapshot.forEach((doc) => {
          const data = doc.data();
          if (data.latitude && data.longitude) {
            reportsData.push({
              id: doc.id,
              latitude: data.latitude,
              longitude: data.longitude,
              incidentType: data.incidentType || 'Otros',
              status: data.status || 'Pendiente',
              priority: data.priority,
              urgent: data.urgent,
              createdAt: data.createdAt,
              description: data.description,
            });
          }
        });
        
        setReports(reportsData);
        setLoading(false);
        setRefreshing(false);
      },
      (error) => {
        console.error('❌ Error cargando mapa de calor:', error);
        setLoading(false);
        setRefreshing(false);
      },
      { maxRetries: 3, retryDelay: 1200, enableLogging: true }
    );

    return unsubscribe;
  };

  const loadHeatmapData = async () => {
    try {
      const points = await heatmapService.getHeatmapPoints();
      setHeatmapPoints(points);
      
      const zones = await heatmapService.getZoneRisks(1000);
      setZoneRisks(zones);
      
      // Actualizar el centro del mapa si hay datos
      if (points.length > 0) {
        const avgLat = points.reduce((sum, p) => sum + p.latitude, 0) / points.length;
        const avgLng = points.reduce((sum, p) => sum + p.longitude, 0) / points.length;
        setMapCenter({ lat: avgLat, lng: avgLng });
      }
    } catch (error) {
      console.error('Error cargando datos del heatmap:', error);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadHeatmapData();
  };

  const handleExport = () => {
    Alert.alert(
      'Exportar Datos del Heatmap',
      'Seleccione el formato de exportación:',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'CSV', onPress: () => exportService.exportToCSV() },
        { text: 'JSON', onPress: () => exportService.exportToJSON() },
        { text: 'PDF', onPress: () => exportService.exportToPDF() },
      ]
    );
  };

  const showZoneDetails = (zone: ZoneRisk) => {
    setSelectedZone(zone);
    setModalVisible(true);
  };

  const generateHeatmapHTML = () => {
    const heatmapData = heatmapPoints.map(point => 
      `[${point.latitude}, ${point.longitude}, ${point.weight}]`
    ).join(',\n        ');
    
    const zoneCircles = zoneRisks.map((zone, index) => {
      const color = getRiskColor(zone.riskLevel);
      return `
        var circle${index} = L.circle([${zone.coordinates.latitude}, ${zone.coordinates.longitude}], {
          color: '${color}',
          fillColor: '${color}',
          fillOpacity: 0.3,
          radius: ${zone.radius}
        }).addTo(map);
        
        circle${index}.bindPopup(\`
          <div style="font-family: Arial, sans-serif;">
            <h3 style="margin: 0 0 10px 0; color: ${color};">${zone.zone}</h3>
            <p><strong>Nivel de Riesgo:</strong> ${zone.riskLevel.toUpperCase()}</p>
            <p><strong>Incidentes:</strong> ${zone.incidentCount}</p>
            <p><strong>Radio:</strong> ${Math.round(zone.radius / 1000)}km</p>
            ${zone.topIncidentTypes.length > 0 ? `
              <p><strong>Principales tipos:</strong></p>
              <ul style="margin: 5px 0; padding-left: 20px;">
                ${zone.topIncidentTypes.slice(0, 3).map(incident => 
                  `<li>${incident.type} (${incident.count})</li>`
                ).join('')}
              </ul>
            ` : ''}
          </div>
        \`);
      `;
    }).join('');

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Heatmap de Incidentes</title>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <script src="https://unpkg.com/leaflet.heat@0.2.0/dist/leaflet-heat.js"></script>
        <style>
            body { margin: 0; padding: 0; }
            #map { height: 100vh; width: 100vw; }
            .legend {
                background: white;
                padding: 10px;
                border-radius: 5px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.2);
                font-family: Arial, sans-serif;
                font-size: 12px;
            }
            .legend-item {
                display: flex;
                align-items: center;
                margin: 5px 0;
            }
            .legend-color {
                width: 20px;
                height: 15px;
                margin-right: 8px;
                border-radius: 3px;
            }
        </style>
    </head>
    <body>
        <div id="map"></div>
        <script>
            var map = L.map('map').setView([${mapCenter.lat}, ${mapCenter.lng}], 11);
            
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors'
            }).addTo(map);
            
            // Datos del heatmap
            var heatmapData = [
                ${heatmapData}
            ];
            
            // Crear heatmap
            if (heatmapData.length > 0) {
                var heat = L.heatLayer(heatmapData, {
                    radius: 25,
                    blur: 15,
                    maxZoom: 17,
                    gradient: {
                        0.0: '#313695',
                        0.1: '#4575b4',
                        0.2: '#74add1',
                        0.3: '#abd9e9',
                        0.4: '#e0f3f8',
                        0.5: '#ffffcc',
                        0.6: '#fee090',
                        0.7: '#fdae61',
                        0.8: '#f46d43',
                        0.9: '#d73027',
                        1.0: '#a50026'
                    }
                }).addTo(map);
            }
            
            // Agregar zonas de riesgo
            ${zoneCircles}
            
            // Leyenda
            var legend = L.control({position: 'bottomright'});
            legend.onAdd = function (map) {
                var div = L.DomUtil.create('div', 'legend');
                div.innerHTML = \`
                    <h4 style="margin: 0 0 10px 0;">Zonas de Riesgo</h4>
                    <div class="legend-item">
                        <div class="legend-color" style="background: #DC3545;"></div>
                        <span>Crítico</span>
                    </div>
                    <div class="legend-item">
                        <div class="legend-color" style="background: #FD7E14;"></div>
                        <span>Alto</span>
                    </div>
                    <div class="legend-item">
                        <div class="legend-color" style="background: #FFC107;"></div>
                        <span>Medio</span>
                    </div>
                    <div class="legend-item">
                        <div class="legend-color" style="background: #28A745;"></div>
                        <span>Bajo</span>
                    </div>
                    <hr style="margin: 10px 0;">
                    <div style="font-size: 11px; color: #666;">
                        <strong>Heatmap:</strong> Densidad de incidentes<br>
                        <strong>Círculos:</strong> Zonas de riesgo identificadas
                    </div>
                \`;
                return div;
            };
            legend.addTo(map);
            
            // Comunicación con React Native
            window.ReactNativeWebView = {
                postMessage: function(data) {
                    if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
                        window.ReactNativeWebView.postMessage(data);
                    }
                }
            };
        </script>
    </body>
    </html>
    `;
  };

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

  useEffect(() => {
    const unsubscribe = loadReportsData();
    loadHeatmapData();
    return unsubscribe;
  }, []);

  const ZoneModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={modalVisible}
      onRequestClose={() => setModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <Animated.View entering={FadeInUp.duration(300)} style={styles.modalContent}>
          {selectedZone && (
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.modalHeader}>
                <View style={styles.modalTitleContainer}>
                  <Ionicons name="location" size={24} color={colors.primary} />
                  <Animated.Text style={styles.modalTitle}>{selectedZone.zone}</Animated.Text>
                </View>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setModalVisible(false)}
                >
                  <Ionicons name="close" size={24} color={colors.gray600} />
                </TouchableOpacity>
              </View>
              
              <View style={[styles.riskBadge, { backgroundColor: getRiskColor(selectedZone.riskLevel) }]}>
                <Ionicons name={getRiskIcon(selectedZone.riskLevel) as any} size={20} color="white" />
                <Animated.Text style={styles.riskText}>
                  RIESGO {selectedZone.riskLevel.toUpperCase()}
                </Animated.Text>
              </View>
              
              <View style={styles.statsContainer}>
                <View style={styles.statItem}>
                  <Ionicons name="warning-outline" size={20} color={colors.error} />
                  <View style={styles.statTextContainer}>
                    <Animated.Text style={styles.statNumber}>{selectedZone.incidentCount}</Animated.Text>
                    <Animated.Text style={styles.statLabel}>Incidentes Totales</Animated.Text>
                  </View>
                </View>
                
                <View style={styles.statItem}>
                  <Ionicons name="resize-outline" size={20} color={colors.blue500} />
                  <View style={styles.statTextContainer}>
                    <Animated.Text style={styles.statNumber}>{Math.round(selectedZone.radius / 1000)}km</Animated.Text>
                    <Animated.Text style={styles.statLabel}>Radio de Influencia</Animated.Text>
                  </View>
                </View>
              </View>
              
              {selectedZone.topIncidentTypes.length > 0 && (
                <View style={styles.incidentTypesContainer}>
                  <Animated.Text style={styles.sectionTitle}>Principales Tipos de Incidentes</Animated.Text>
                  {selectedZone.topIncidentTypes.map((incident, index) => (
                    <Animated.View key={index} entering={FadeInLeft.delay(index * 100)} style={styles.incidentTypeItem}>
                      <View style={styles.incidentTypeLeft}>
                        <View style={styles.incidentTypeDot} />
                        <Animated.Text style={styles.incidentTypeName}>{incident.type}</Animated.Text>
                      </View>
                      <View style={styles.incidentTypeCount}>
                        <Animated.Text style={styles.incidentTypeNumber}>{incident.count}</Animated.Text>
                      </View>
                    </Animated.View>
                  ))}
                </View>
              )}
              
              <View style={styles.coordinatesContainer}>
                <Animated.Text style={styles.sectionTitle}>Coordenadas del Centro</Animated.Text>
                <Animated.Text style={styles.coordinatesText}>
                  Lat: {selectedZone.coordinates.latitude.toFixed(6)}
                </Animated.Text>
                <Animated.Text style={styles.coordinatesText}>
                  Lng: {selectedZone.coordinates.longitude.toFixed(6)}
                </Animated.Text>
              </View>
            </ScrollView>
          )}
        </Animated.View>
      </View>
    </Modal>
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
                <Ionicons name="map-outline" size={32} color={colors.white} />
                <Animated.Text style={styles.title}>Heatmap de Incidentes</Animated.Text>
                <Animated.Text style={styles.subtitle}>🗺️ Zonas de Riesgo Identificadas</Animated.Text>
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
            <Animated.Text style={styles.loadingText}>Cargando mapa de calor...</Animated.Text>
          </Animated.View>
        ) : (
          <>
            {/* Mapa */}
            <Animated.View entering={FadeInUp.delay(200).duration(800)} style={styles.mapContainer}>
              <HeatmapWebView
                html={generateHeatmapHTML()}
                style={styles.webView}
                onLoadStart={() => {}}
                onLoadEnd={() => {}}
              />
            </Animated.View>

            {/* Estadísticas rápidas */}
            <Animated.View entering={FadeInUp.delay(300).duration(800)} style={styles.quickStats}>
              <View style={styles.quickStatsRow}>
                <View style={styles.quickStatItem}>
                  <Ionicons name="location-outline" size={20} color={colors.primary} />
                  <Animated.Text style={styles.quickStatNumber}>{zoneRisks.length}</Animated.Text>
                  <Animated.Text style={styles.quickStatLabel}>Zonas</Animated.Text>
                </View>
                <View style={styles.quickStatItem}>
                  <Ionicons name="warning-outline" size={20} color={colors.error} />
                  <Animated.Text style={styles.quickStatNumber}>{reports.length}</Animated.Text>
                  <Animated.Text style={styles.quickStatLabel}>Incidentes</Animated.Text>
                </View>
                <View style={styles.quickStatItem}>
                  <Ionicons name="alert-circle-outline" size={20} color={colors.warning} />
                  <Animated.Text style={styles.quickStatNumber}>
                    {zoneRisks.filter(z => z.riskLevel === 'critical' || z.riskLevel === 'high').length}
                  </Animated.Text>
                  <Animated.Text style={styles.quickStatLabel}>Alto Riesgo</Animated.Text>
                </View>
              </View>
            </Animated.View>

            {/* Lista de zonas de riesgo */}
            {zoneRisks.length > 0 && (
              <Animated.View entering={FadeInUp.delay(400).duration(800)} style={styles.zonesContainer}>
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.zonesScrollContent}
                  refreshControl={
                    <RefreshControl
                      refreshing={refreshing}
                      onRefresh={onRefresh}
                      colors={[colors.primary]}
                      tintColor={colors.primary}
                    />
                  }
                >
                  {zoneRisks.slice(0, 10).map((zone, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[styles.zoneCard, { borderLeftColor: getRiskColor(zone.riskLevel) }]}
                      onPress={() => showZoneDetails(zone)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.zoneCardHeader}>
                        <Ionicons name={getRiskIcon(zone.riskLevel) as any} size={16} color={getRiskColor(zone.riskLevel)} />
                        <Animated.Text style={styles.zoneCardTitle} numberOfLines={1}>{zone.zone}</Animated.Text>
                      </View>
                      <Animated.Text style={[styles.zoneCardRisk, { color: getRiskColor(zone.riskLevel) }]}>
                        {zone.riskLevel.toUpperCase()}
                      </Animated.Text>
                      <Animated.Text style={styles.zoneCardCount}>{zone.incidentCount} incidentes</Animated.Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </Animated.View>
            )}
          </>
        )}

        <ZoneModal />
      </View>
    </AnimatedScreen>
  );
};

export default IncidentHeatmapScreen;

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
  mapContainer: {
    flex: 1,
    margin: spacing.md,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadows.lg,
  },
  webView: {
    flex: 1,
  },
  webViewLoader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.white,
  },
  quickStats: {
    backgroundColor: colors.white,
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    ...shadows.md,
  },
  quickStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  quickStatItem: {
    alignItems: 'center',
  },
  quickStatNumber: {
    fontSize: fontSizes.lg,
    fontWeight: 'bold',
    color: colors.gray800,
    marginTop: spacing.xs,
  },
  quickStatLabel: {
    fontSize: fontSizes.xs,
    color: colors.gray500,
    marginTop: 2,
  },
  zonesContainer: {
    marginBottom: spacing.md,
  },
  zonesScrollContent: {
    paddingHorizontal: spacing.md,
  },
  zoneCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginRight: spacing.sm,
    width: 140,
    borderLeftWidth: 4,
    ...shadows.sm,
  },
  zoneCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  zoneCardTitle: {
    fontSize: fontSizes.sm,
    fontWeight: 'bold',
    color: colors.gray800,
    marginLeft: spacing.xs,
    flex: 1,
  },
  zoneCardRisk: {
    fontSize: fontSizes.xs,
    fontWeight: 'bold',
    marginBottom: spacing.xs,
  },
  zoneCardCount: {
    fontSize: fontSizes.xs,
    color: colors.gray500,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
  },
  loadingText: {
    color: colors.gray500,
    marginTop: spacing.md,
    fontSize: fontSizes.base,
    fontWeight: '500',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing.lg,
    maxHeight: height * 0.8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  modalTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  modalTitle: {
    fontSize: fontSizes.lg,
    fontWeight: 'bold',
    color: colors.gray800,
    marginLeft: spacing.sm,
  },
  closeButton: {
    padding: spacing.sm,
  },
  riskBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.base,
    marginBottom: spacing.md,
  },
  riskText: {
    color: colors.white,
    fontSize: fontSizes.sm,
    fontWeight: 'bold',
    marginLeft: spacing.xs,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: spacing.lg,
  },
  statItem: {
    alignItems: 'center',
  },
  statTextContainer: {
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  statNumber: {
    fontSize: fontSizes.xl,
    fontWeight: 'bold',
    color: colors.gray800,
  },
  statLabel: {
    fontSize: fontSizes.xs,
    color: colors.gray500,
    textAlign: 'center',
    marginTop: 2,
  },
  incidentTypesContainer: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: fontSizes.md,
    fontWeight: 'bold',
    color: colors.gray800,
    marginBottom: spacing.md,
  },
  incidentTypeItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  incidentTypeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  incidentTypeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginRight: spacing.sm,
  },
  incidentTypeName: {
    fontSize: fontSizes.sm,
    color: colors.gray800,
    flex: 1,
  },
  incidentTypeCount: {
    backgroundColor: colors.gray100,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  incidentTypeNumber: {
    fontSize: fontSizes.sm,
    fontWeight: 'bold',
    color: colors.primary,
  },
  coordinatesContainer: {
    backgroundColor: colors.gray100,
    padding: spacing.md,
    borderRadius: borderRadius.md,
  },
  coordinatesText: {
    fontSize: fontSizes.sm,
    color: colors.gray500,
    fontFamily: 'monospace',
    marginBottom: spacing.xs,
  },
});