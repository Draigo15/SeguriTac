import React, { memo, useMemo, useCallback, useRef, useImperativeHandle, forwardRef } from 'react';
import { View, StyleSheet, Platform, Text, TouchableOpacity, Linking } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Region, MapPressEvent } from 'react-native-maps';
import { mapsConfig } from '../config/mapsConfig';
import { colors } from '../theme';
import { useLocation } from '../hooks/useLocation';
import { MapViewMobileRef } from './MapViewMobile.types';

// Export the ref interface for TypeScript compatibility
export type { MapViewMobileRef };

type Props = {
  latitude: number;
  longitude: number;
  title?: string;
  showUserLocation?: boolean;
  zoomEnabled?: boolean;
  scrollEnabled?: boolean;
  onMapPress?: (event: MapPressEvent) => void;
  onRegionChange?: (region: Region) => void;
  markers?: Array<{
    id: string;
    latitude: number;
    longitude: number;
    title?: string;
    description?: string;
    pinColor?: string;
  }>;
  enableLocationTracking?: boolean;
  style?: any;
};

const MapViewMobile = memo(forwardRef<MapViewMobileRef, Props>(({ 
  latitude, 
  longitude, 
  title,
  showUserLocation = true,
  zoomEnabled = true,
  scrollEnabled = true,
  onMapPress,
  onRegionChange,
  markers = [],
  enableLocationTracking = false,
  style
}, ref) => {
  // Función para abrir en Google Maps como fallback
  const openInGoogleMaps = () => {
    const url = Platform.select({
      ios: `maps:0,0?q=${latitude},${longitude}`,
      android: `geo:0,0?q=${latitude},${longitude}`,
      default: `https://www.google.com/maps?q=${latitude},${longitude}`
    });
    Linking.openURL(url);
  };

  const mapRef = useRef<MapView>(null);
  
  // Hook de ubicación optimizado para móvil
  const { 
    location: userLocation, 
    region: userRegion,
    hasPermission,
    getCurrentLocation 
  } = useLocation({ 
    enableHighAccuracy: true,
    watchPosition: enableLocationTracking,
    requestPermissionOnMount: showUserLocation 
  });

  // Memoizar la región para evitar re-renders innecesarios
  const region = useMemo(() => ({
    latitude,
    longitude,
    latitudeDelta: mapsConfig.defaultRegion.latitudeDelta,
    longitudeDelta: mapsConfig.defaultRegion.longitudeDelta,
  }), [latitude, longitude]);

  // Memoizar las coordenadas del marcador principal
  const markerCoordinate = useMemo(() => ({
    latitude,
    longitude
  }), [latitude, longitude]);

  // Memoizar marcadores adicionales
  const memoizedMarkers = useMemo(() => markers, [markers]);

  // Funciones imperativas expuestas a través de ref
  useImperativeHandle(ref, () => ({
    animateToRegion: (targetRegion: Region, duration = 1000) => {
      mapRef.current?.animateToRegion(targetRegion, duration);
    },
    animateToCoordinate: (coordinate: { latitude: number; longitude: number }, duration = 1000) => {
      const targetRegion = {
        ...coordinate,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
      mapRef.current?.animateToRegion(targetRegion, duration);
    },
    getCurrentRegion: async () => {
      try {
        return await mapRef.current?.getCamera().then(camera => ({
          latitude: camera.center.latitude,
          longitude: camera.center.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        })) || null;
      } catch (error) {
        console.error('Error getting current region:', error);
        return null;
      }
    },
  }), []);

  // Función optimizada para centrar en ubicación del usuario
  const centerOnUserLocation = useCallback(async () => {
    if (!hasPermission) return;
    
    const currentLocation = await getCurrentLocation();
    if (currentLocation && mapRef.current) {
      const userRegion = {
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      };
      mapRef.current.animateToRegion(userRegion, 1000);
    }
  }, [hasPermission, getCurrentLocation]);

  // Renderizar marcadores adicionales
  const renderMarkers = useCallback(() => {
    return memoizedMarkers.map((marker) => (
      <Marker
        key={marker.id}
        coordinate={{
          latitude: marker.latitude,
          longitude: marker.longitude,
        }}
        title={marker.title}
        description={marker.description}
        pinColor={marker.pinColor || colors.primary}
      />
    ));
  }, [memoizedMarkers]);

  try {
    return (
      <View style={styles.container}>
        <MapView
          ref={mapRef}
          style={[styles.map, style]}
          initialRegion={region}
          showsUserLocation={showUserLocation && hasPermission}
          showsMyLocationButton={false}
          showsCompass={true}
          showsScale={Platform.OS === 'android'}
          mapType="standard"
          provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
          zoomEnabled={zoomEnabled}
          scrollEnabled={scrollEnabled}
          rotateEnabled={true}
          pitchEnabled={false}
          toolbarEnabled={false}
          loadingEnabled={true}
          loadingIndicatorColor="#002B7F"
          loadingBackgroundColor="#ffffff"
          onPress={onMapPress}
          onRegionChange={onRegionChange}
          maxZoomLevel={20}
          minZoomLevel={3}
          cacheEnabled={true}
        >
          {/* Marcador principal */}
          <Marker 
            coordinate={markerCoordinate} 
            title={title || 'Ubicación del reporte'}
            pinColor="#002B7F"
          />
          
          {/* Marcadores adicionales */}
          {renderMarkers()}
          
          {/* Marcador de ubicación del usuario si está disponible */}
          {enableLocationTracking && userLocation && (
            <Marker
              coordinate={{
                latitude: userLocation.latitude,
                longitude: userLocation.longitude,
              }}
              title="Tu ubicación"
              pinColor={colors?.success || "#00FF00"}
              anchor={{ x: 0.5, y: 0.5 }}
            />
          )}
        </MapView>
      </View>
    );
  } catch (error) {
    // Fallback solo si hay error cargando el mapa
    return (
      <View style={styles.container}>
        <View style={styles.expoGoFallback}>
          <Text style={styles.expoGoTitle}>📍 Ubicación del Reporte</Text>
          <Text style={styles.coordinates}>
            Lat: {latitude.toFixed(6)}
          </Text>
          <Text style={styles.coordinates}>
            Lng: {longitude.toFixed(6)}
          </Text>
          <TouchableOpacity style={styles.openMapButton} onPress={openInGoogleMaps}>
            <Text style={styles.openMapButtonText}>🗺️ Abrir en Google Maps</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }
}));

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 300,
    borderRadius: 10,
    overflow: 'hidden',
  },
  map: {
    flex: 1,
  },
  expoGoFallback: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  expoGoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
    textAlign: 'center',
  },
  coordinates: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  openMapButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 15,
    marginBottom: 15,
  },
  openMapButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  expoGoNote: {
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
    lineHeight: 16,
    paddingHorizontal: 10,
  },
});

MapViewMobile.displayName = 'MapViewMobile';

export default MapViewMobile;
