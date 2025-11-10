import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
  Text,
  Alert,
} from 'react-native';
import { Platform } from 'react-native';
import AnimatedScreen from '../components/AnimatedScreen';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import AnimatedButton from '../components/AnimatedButton';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db, auth } from '../services/firebase';
import { colors, spacing, fontSizes, borderRadius, shadows } from '../theme';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';
import { useLocation } from '../hooks/useLocation';
type Report = {
  id: string;
  location: { latitude: number; longitude: number };
  incidentType: string;
  status: string;
  description: string;
  timestamp: any;
};

// Importaciones de componentes de mapa
import WebMapList from '../components/WebMapList';
import MapViewMobile from '../components/MapViewMobile';
import type { MapViewMobileRef } from '../components/MapViewMobile.types';

const MyReportsMapScreen = () => {
  const navigation = useNavigation<NavigationProp<any>>();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const mapRef = useRef<MapViewMobileRef>(null);
  
  // Hook optimizado de ubicación
  const { 
    location: userLocation, 
    region: userRegion,
    loading: locationLoading,
    error: locationError,
    hasPermission,
    getCurrentLocation 
  } = useLocation({ 
    enableHighAccuracy: true,
    requestPermissionOnMount: true 
  });

  useEffect(() => {
    fetchMyReports();
  }, []);

  const fetchMyReports = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        Alert.alert('Error', 'Usuario no autenticado');
        return;
      }

      const reportsQuery = query(
        collection(db, 'reports'),
        where('email', '==', user.email)
      );
      
      const querySnapshot = await getDocs(reportsQuery);
      const reportsData: Report[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.location && data.location.latitude && data.location.longitude) {
          reportsData.push({
            id: doc.id,
            ...data,
          } as Report);
        }
      });
      
      setReports(reportsData);
    } catch (error: any) {
      console.error('Error fetching reports:', error);
      Alert.alert('Error', 'No se pudieron cargar los reportes');
    } finally {
      setLoading(false);
    }
  };

  // Función optimizada para centrar en ubicación del usuario
  const centerOnUserLocation = useCallback(async () => {
    if (!hasPermission) {
      Alert.alert('Permiso denegado', 'Se necesita acceso a la ubicación para mostrar el mapa');
      return;
    }

    const currentLocation = await getCurrentLocation();
    if (currentLocation && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }, 1000);
    }
  }, [hasPermission, getCurrentLocation]);

  const getMarkerColor = (status: string) => {
    switch (status) {
      case 'Resuelto':
        return colors.green500;
      case 'En Proceso':
        return colors.yellow500;
      case 'Pendiente':
      default:
        return colors.error;
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Cargando mis reportes...</Text>
      </View>
    );
  }



  return (
    <AnimatedScreen>
      <Animated.View entering={FadeInUp.delay(200)} style={styles.container}>
        {/* Stats */}
        <Animated.View entering={FadeInDown.delay(600)} style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{reports.length}</Text>
            <Text style={styles.statLabel}>Total de Reportes</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              {reports.filter(r => r.status === 'Pendiente').length}
            </Text>
            <Text style={styles.statLabel}>Pendientes</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              {reports.filter(r => r.status === 'Resuelto').length}
            </Text>
            <Text style={styles.statLabel}>Resueltos</Text>
          </View>
        </Animated.View>

        {/* Map Container */}
        <Animated.View entering={FadeInUp.delay(800)} style={styles.mapContainer}>
          {Platform.OS === 'web' ? (
            <WebMapList reports={reports} />
          ) : (
            <View style={styles.map}>
              {reports.length > 0 ? (
                <MapViewMobile
                  ref={mapRef}
                  latitude={userLocation?.latitude || reports[0].location.latitude}
                  longitude={userLocation?.longitude || reports[0].location.longitude}
                  markers={reports.map(report => ({
                    id: report.id,
                    latitude: report.location.latitude,
                    longitude: report.location.longitude,
                    title: report.incidentType,
                    description: report.description,
                    pinColor: getMarkerColor(report.status)
                  }))}
                  enableLocationTracking={true}
                  showUserLocation={hasPermission}
                  showHeatmap={false}
                />
              ) : (
                <View style={styles.center}>
                  <Text style={styles.loadingText}>No hay reportes para mostrar</Text>
                </View>
              )}
            </View>
          )}
        </Animated.View>

        {/* Legend */}
        <Animated.View entering={FadeInDown.delay(1000)} style={styles.legend}>
          <Text style={styles.legendTitle}>Leyenda:</Text>
          <View style={styles.legendItems}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.error }]} />
              <Text style={styles.legendText}>Pendiente</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.yellow500 }]} />
              <Text style={styles.legendText}>En Proceso</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.green500 }]} />
              <Text style={styles.legendText}>Resuelto</Text>
            </View>
          </View>
        </Animated.View>

        {/* Location Button */}
        <Animated.View entering={FadeInUp.delay(1200)} style={styles.fabContainer}>
          <AnimatedButton
            style={styles.fabLocation}
            onPress={centerOnUserLocation}
            animationType="bounce"
          >
            <Ionicons name="locate" size={24} color={colors.white} />
          </AnimatedButton>
        </Animated.View>
      </Animated.View>
    </AnimatedScreen>
  );
};

export default MyReportsMapScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.primary,
  },
  loadingText: {
    marginTop: spacing.md,
    color: colors.white,
    fontSize: fontSizes.base,
  },

  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: fontSizes.xl,
    fontWeight: 'bold',
    color: colors.white,
  },
  statLabel: {
    fontSize: fontSizes.xs,
    color: colors.gray300,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  mapContainer: {
    flex: 1,
    marginHorizontal: spacing.lg,
    marginVertical: spacing.md,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.white,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
  },
  map: {
    flex: 1,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  legend: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    padding: spacing.md,
    borderRadius: borderRadius.md,
  },
  legendTitle: {
    fontSize: fontSizes.base,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: spacing.sm,
  },
  legendItems: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: spacing.xs,
  },
  legendText: {
    fontSize: fontSizes.sm,
    color: colors.white,
  },
  fabContainer: {
    position: 'absolute',
    bottom: 100,
    right: spacing.lg,
  },
  fabLocation: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.lg,
  },
});