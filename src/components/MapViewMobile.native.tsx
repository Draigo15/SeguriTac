import React, { memo, useMemo, useCallback, useRef, useImperativeHandle, forwardRef, useState, useEffect } from 'react';
import { View, StyleSheet, Platform, Text, TouchableOpacity, Linking } from 'react-native';
import MapView, { Marker, Region, MapPressEvent, PROVIDER_GOOGLE } from 'react-native-maps';
import { mapsConfig } from '../config/mapsConfig';
import { colors } from '../theme';
import { useLocation } from '../hooks/useLocation';
import { MapViewMobileRef } from './MapViewMobile.types';

// Carga condicional de WebView para fallback basado en Leaflet/OSM
let WebView: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  WebView = require('react-native-webview').WebView;
} catch (error) {
  // WebView puede no estar disponible (por ejemplo, ciertas configuraciones de Expo Go)
  console.log('WebView no disponible, se usará fallback simple');
}

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
  showHeatmap?: boolean;
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
  showHeatmap = false,
  style
}, ref) => {
  const [mapReady, setMapReady] = useState(false);
  const [mapFailed, setMapFailed] = useState(false);
  const [loadErrorMessage, setLoadErrorMessage] = useState<string | null>(null);
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

  // HTML de Leaflet para fallback sin Google Maps (usa OpenStreetMap)
  const leafletHtml = useMemo(() => {
    const baseMarkers = [{
      id: 'principal',
      latitude,
      longitude,
      title: title || 'Ubicación del reporte',
      description: '',
      pinColor: '#002B7F',
    }, ...memoizedMarkers];

    const markersJs = baseMarkers.map(m => {
      const color = m.pinColor || '#002B7F';
      // Convertir color a rotación de hue directamente en el JavaScript
      let hueRotation = 0;
      switch (color.toLowerCase()) {
        case '#ff0000':
        case 'red':
          hueRotation = 0;
          break;
        case '#ffff00':
        case 'yellow':
          hueRotation = 60;
          break;
        case '#00ff00':
        case 'green':
          hueRotation = 120;
          break;
        case '#0000ff':
        case 'blue':
          hueRotation = 240;
          break;
        case '#002b7f':
          hueRotation = 220;
          break;
        default:
          hueRotation = 0;
      }
      
      return `
        var marker${m.id} = L.marker([${m.latitude}, ${m.longitude}]).addTo(map);
        marker${m.id}.bindPopup(${JSON.stringify(m.title || '')});
        // Cambiar color del marcador usando CSS
        marker${m.id}._icon.style.filter = 'hue-rotate(${hueRotation}deg) saturate(1.5)';
      `;
    }).join('\n');

    // Construir puntos de calor solo si está habilitado
    const heatPointsJs = showHeatmap ? baseMarkers.map(m => {
      const color = (m.pinColor || '').toLowerCase();
      let weight = 0.5; // intensidad por defecto
      switch (color) {
        case '#ff0000':
        case 'red':
          weight = 1.0; // pendientes (alto impacto)
          break;
        case '#ffff00':
        case 'yellow':
          weight = 0.7; // en proceso
          break;
        case '#00ff00':
        case 'green':
          weight = 0.3; // resueltos (baja intensidad)
          break;
        default:
          weight = 0.5;
      }
      return `[${m.latitude}, ${m.longitude}, ${weight}]`;
    }).join(', ') : '';

    return `<!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
         <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
         <style> 
           html, body, #map { 
             height: 100%; 
             margin: 0; 
             padding: 0; 
             width: 100%;
           } 
           ${showHeatmap ? `#controls { position: absolute; right: 10px; top: 10px; z-index: 1000; }
           #toggleHeat { background: #002B7F; color: white; border: none; border-radius: 6px; padding: 6px 10px; box-shadow: 0 2px 6px rgba(0,0,0,0.2); }` : ''}
         </style>
      </head>
      <body>
        <div id="map"></div>
        ${showHeatmap ? '<div id="controls"><button id="toggleHeat">Calor</button></div>' : ''}
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        ${showHeatmap ? '<script src="https://unpkg.com/leaflet.heat/dist/leaflet-heat.js"></script>' : ''}
        <script>
          const center = [${latitude}, ${longitude}];
          const map = L.map('map').setView(center, 15);
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '© OpenStreetMap contributors'
          }).addTo(map);
          ${markersJs}
          ${showHeatmap ? `
          // Capa de calor con gradiente acorde a la leyenda (verde/amarillo/rojo)
          var heat = L.heatLayer([${heatPointsJs}], {
            radius: 25,
            blur: 15,
            maxZoom: 17,
            minOpacity: 0.4,
            gradient: {
              0.3: 'green',  // resuelto
              0.7: 'yellow', // en proceso
              1.0: 'red'     // pendiente
            }
          });
          heat.addTo(map);
          var heatVisible = true;
          var toggleBtn = document.getElementById('toggleHeat');
          if (toggleBtn) {
            toggleBtn.addEventListener('click', function() {
              if (heatVisible) { map.removeLayer(heat); toggleBtn.innerText = 'Calor (off)'; }
              else { heat.addTo(map); toggleBtn.innerText = 'Calor'; }
              heatVisible = !heatVisible;
            });
          }
          ` : ''}
           
          // Ajustar vista para mostrar todos los marcadores
          if (${baseMarkers.length} > 1) {
            var group = new L.featureGroup([${baseMarkers.map(m => `marker${m.id}`).join(', ')}]);
            map.fitBounds(group.getBounds().pad(0.1));
          }
        </script>
      </body>
    </html>`;
  }, [latitude, longitude, title, memoizedMarkers, showHeatmap]);

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

  // Forzar fallback OSM inmediatamente para evitar problemas con Google Maps
  useEffect(() => {
    const timeout = setTimeout(() => {
      setMapFailed(true);
      setLoadErrorMessage('Usando OpenStreetMap como alternativa a Google Maps');
    }, 1000); // Reducido a 1 segundo para cambiar rápido
    return () => clearTimeout(timeout);
  }, []);

  try {
    return (
      <View style={styles.container}>
        {mapFailed ? (
          WebView ? (
            <WebView
              source={{ html: leafletHtml }}
              style={styles.map}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              startInLoadingState={true}
            />
          ) : (
            <View style={styles.expoGoFallback}>
              <Text style={styles.expoGoTitle}>📍 Ubicación del Reporte</Text>
              {loadErrorMessage ? (
                <Text style={styles.expoGoNote}>{loadErrorMessage}</Text>
              ) : null}
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
          )
        ) : (
        <MapView
          ref={mapRef}
          style={[styles.map, style]}
          initialRegion={region}
          showsUserLocation={showUserLocation && hasPermission}
          showsMyLocationButton={false}
          showsCompass={true}
          showsScale={Platform.OS === 'android'}
          mapType="standard"
          provider={PROVIDER_GOOGLE}
          zoomEnabled={zoomEnabled}
          scrollEnabled={scrollEnabled}
          rotateEnabled={true}
          pitchEnabled={false}
          toolbarEnabled={false}
          loadingEnabled={false}
          loadingIndicatorColor="#002B7F"
          loadingBackgroundColor="#ffffff"
          onPress={onMapPress}
          onRegionChange={onRegionChange}
          onRegionChangeComplete={() => setMapReady(true)}
          maxZoomLevel={20}
          minZoomLevel={3}
          cacheEnabled={false}
          onMapReady={() => setMapReady(true)}
          onMapLoaded={() => setMapReady(true)}
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
        )}
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
    flex: 1, // Cambiar de height: 300 a flex: 1
    width: '100%',
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
