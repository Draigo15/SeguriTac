/**
 * AllReportsMapScreen - Pantalla de Visualización de Reportes en Mapa
 * 
 * Esta pantalla implementa el RF-6: Visualización de Reportes en Mapa
 * Permite a los usuarios visualizar todos los reportes de incidentes de seguridad
 * ciudadana en un mapa interactivo con funcionalidades de filtrado y búsqueda.
 * 
 * Funcionalidades principales:
 * - Visualización de reportes en mapa interactivo con marcadores
 * - Filtros por tipo de incidente y estado del reporte
 * - Búsqueda por texto en descripción y ubicación
 * - Modo heatmap para visualizar densidad de incidentes
 * - Geolocalización del usuario actual
 * - Actualización en tiempo real de reportes
 * - Interfaz responsive para web y móvil
 * 
 * Tecnologías utilizadas:
 * - React Native Maps para visualización en móvil
 * - WebMap para visualización en navegador web
 * - Firebase Firestore para datos en tiempo real
 * - Expo Location para geolocalización
 * - Animaciones con react-native-reanimated
 * 
 * @author Equipo de Desarrollo
 * @version 1.0.0
 * @since 2024
 * @implements RF-6
 */

import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
  TextInput,
} from 'react-native';
import { Platform } from 'react-native';
import AnimatedScreen from '../components/AnimatedScreen';
import Animated, { FadeInDown, FadeInUp, ZoomIn } from 'react-native-reanimated';
import AnimatedButton from '../components/AnimatedButton';

// Componentes de terceros para filtros y selección
import { Picker } from '@react-native-picker/picker';

// Firebase - Base de datos en tiempo real
import { collection, QuerySnapshot, DocumentData } from 'firebase/firestore';
import { db } from '../services/firebase';
import { robustOnSnapshot } from '../services/firestoreWrapper';

// Servicios de geolocalización
import * as Location from 'expo-location';

// Componentes de retroalimentación y navegación
import Toast from 'react-native-toast-message';
import { useRoute, RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/types';
import { logMetric } from '../utils/metrics';

type AllReportsMapRouteProp = RouteProp<RootStackParamList, 'AllReportsMap'>;

// RF-6: Componentes de mapa para diferentes plataformas
import WebMapList from '../components/WebMapList';
import MapViewMobile from '../components/MapViewMobile';
const IS_TEST = typeof process !== 'undefined' && !!process.env.JEST_WORKER_ID;

/**
 * Componente principal de la pantalla de visualización de reportes en mapa
 * 
 * Implementa el RF-6: Visualización de Reportes en Mapa
 * Proporciona una interfaz completa para que los usuarios puedan:
 * - Visualizar todos los reportes en un mapa interactivo
 * - Filtrar reportes por tipo de incidente y estado
 * - Buscar reportes por texto
 * - Alternar entre vista normal y heatmap
 * - Centrar el mapa en su ubicación actual
 * 
 * @returns {JSX.Element} Componente de la pantalla de mapa de reportes
 */
const AllReportsMapScreen = () => {
  // RF-6: Parámetros de navegación para región inicial y reporte enfocado
  const route = useRoute<AllReportsMapRouteProp>();
  const { initialRegion, focusedReportId } = route.params || {};
  
  // RF-6: Estados para gestión de reportes y visualización en mapa
  const [reports, setReports] = useState<any[]>([]); // Todos los reportes cargados desde Firestore
  const [filteredReports, setFilteredReports] = useState<any[]>([]); // Reportes filtrados para mostrar en mapa
  const [loading, setLoading] = useState(true); // Estado de carga inicial
  
  // RF-6: Estados para filtros de búsqueda y categorización
  const [incidentFilter, setIncidentFilter] = useState(''); // Filtro por tipo de incidente
  const [statusFilter, setStatusFilter] = useState(''); // Filtro por estado del reporte
  const [incidentTypes, setIncidentTypes] = useState<string[]>([]); // Tipos de incidentes disponibles
  const [statusTypes, setStatusTypes] = useState<string[]>([]); // Estados de reportes disponibles
  const [search, setSearch] = useState(''); // Texto de búsqueda
  
  // RF-6: Estados para funcionalidades del mapa
  const [showHeatmap, setShowHeatmap] = useState(true); // Alternar entre vista normal y heatmap
  const mapRef = useRef<any>(null); // Referencia al componente de mapa para animaciones

  // RF-6: Efecto para cargar reportes en tiempo real desde Firestore
  useEffect(() => {
    const t0 = Date.now();
    /**
     * Suscripción en tiempo real a la colección de reportes
     * 
     * RF-6: Carga todos los reportes que tienen coordenadas de ubicación válidas
     * para mostrarlos en el mapa. Actualiza automáticamente cuando hay cambios
     * en la base de datos.
     * 
     * Funcionalidades:
     * - Filtrar reportes con ubicación válida (latitud y longitud)
     * - Extraer tipos de incidentes y estados únicos para filtros
     * - Actualizar estados de la aplicación con datos nuevos
     * - Mostrar retroalimentación al usuario sobre la carga
     */
    const unsubscribe = robustOnSnapshot(
      collection(db, 'reports'),
      (snapshot) => {
        // RF-6: Verificación de tipo para asegurar QuerySnapshot válido
        if (!('forEach' in snapshot)) return;
        
        const fetchedReports: any[] = [];
        const typesSet = new Set<string>();
        const statusSet = new Set<string>();

        // RF-6: Procesar cada documento de reporte
        snapshot.forEach((doc) => {
          const data = doc.data();
          // RF-6: Solo incluir reportes con coordenadas válidas para el mapa
          if (data.location?.latitude && data.location?.longitude) {
            fetchedReports.push({ id: doc.id, ...data });
            // RF-6: Recopilar tipos únicos para filtros dinámicos
            if (data.incidentType) typesSet.add(data.incidentType);
            if (data.status) statusSet.add(data.status);
          }
        });

        // RF-6: Actualizar estados con datos procesados
        setReports(fetchedReports);
        setFilteredReports(fetchedReports);
        setIncidentTypes(Array.from(typesSet));
        setStatusTypes(Array.from(statusSet));
        setLoading(false);
        // Métrica de carga de mapa con número de reportes
        logMetric('map_load_ms', Date.now() - t0, { count: fetchedReports.length });

        // RF-11: Retroalimentación visual sobre la carga de datos
        Toast.show({
          type: 'info',
          text1: `Se cargaron ${fetchedReports.length} reportes`,
        });
      },
      (error) => {
        console.error('❌ Error cargando mapa de reportes:', error);
        setLoading(false);
        logMetric('map_load_error_ms', Date.now() - t0, {});
      },
      { maxRetries: 3, retryDelay: 1000, enableLogging: true }
    );

    // RF-6: Centrar mapa en ubicación del usuario al inicializar
    centerOnUserLocation();

    return unsubscribe;
  }, []);

  // RF-6: Efecto para aplicar filtros dinámicos a los reportes del mapa
  useEffect(() => {
    /**
     * Sistema de filtrado dinámico para reportes en el mapa
     * 
     * RF-6: Aplica múltiples filtros de forma combinada para permitir
     * a los usuarios encontrar reportes específicos en el mapa:
     * - Filtro por tipo de incidente (robo, vandalismo, etc.)
     * - Filtro por estado del reporte (pendiente, en proceso, resuelto)
     * - Búsqueda por texto en descripción y email del reportante
     * 
     * Los filtros se aplican de forma acumulativa para refinar la búsqueda.
     */
    let filtered = [...reports];

    // RF-6: Filtrar por tipo de incidente seleccionado
    if (incidentFilter) {
      filtered = filtered.filter((r) => r.incidentType === incidentFilter);
    }

    // RF-6: Filtrar por estado del reporte seleccionado
    if (statusFilter) {
      filtered = filtered.filter((r) => r.status === statusFilter);
    }

    // RF-6: Búsqueda por texto en descripción y email
    if (search.trim() !== '') {
      filtered = filtered.filter((r) =>
        r.description?.toLowerCase().includes(search.toLowerCase()) ||
        r.email?.toLowerCase().includes(search.toLowerCase())
      );
    }

    // RF-6: Actualizar reportes filtrados para mostrar en el mapa
    setFilteredReports(filtered);
  }, [incidentFilter, statusFilter, search]);

  /**
   * Función para centrar el mapa en la ubicación actual del usuario
   * 
   * RF-6: Proporciona funcionalidad de geolocalización para que los usuarios
   * puedan ver reportes cercanos a su ubicación actual. Solicita permisos
   * de ubicación y anima el mapa hacia las coordenadas del usuario.
   * 
   * Funcionalidades:
   * - Solicitar permisos de ubicación en primer plano
   * - Obtener coordenadas GPS actuales del dispositivo
   * - Animar el mapa hacia la ubicación del usuario
   * - Establecer zoom apropiado para visualizar área local
   * 
   * @returns {Promise<void>} Promesa que se resuelve al completar la animación
   */
  const centerOnUserLocation = async () => {
    // RF-6: Solicitar permisos de ubicación al usuario
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      alert('Permiso de ubicación denegado');
      return;
    }

    // RF-6: Obtener coordenadas GPS actuales del dispositivo
    const location = await Location.getCurrentPositionAsync({});
    
    // RF-6: Animar el mapa hacia la ubicación del usuario con zoom local
    mapRef.current?.animateToRegion({
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      latitudeDelta: 0.01, // Zoom nivel ciudad/barrio
      longitudeDelta: 0.01, // Zoom nivel ciudad/barrio
    });
  };

  // RF-6: Pantalla de carga mientras se obtienen los reportes
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#002B7F" />
      </View>
    );
  }

  // RF-6: Renderizado principal de la interfaz de visualización de reportes en mapa
  return (
    <AnimatedScreen animationType="slideHorizontal" duration={800}>
    <View style={styles.container}>
      {/* RF-6: Título principal de la pantalla de mapa */}
      <Animated.Text 
        entering={FadeInDown.duration(800)}
        style={styles.header}
      >
        🗺️ Mapa de Reportes
      </Animated.Text>

      {/* RF-6: Campo de búsqueda por texto para filtrar reportes */}
      <Animated.View entering={FadeInDown.delay(100).duration(800)}>
        <TextInput
          placeholder="🔍 Buscar por palabra clave..."
          style={styles.searchInput}
          onChangeText={setSearch}
          value={search}
        />
      </Animated.View>

      {/* RF-6: Controles de filtrado por tipo de incidente y estado */}
      <Animated.View 
        entering={FadeInDown.delay(200).duration(800)}
        style={styles.filters}
      >
        {/* RF-6: Selector de filtro por tipo de incidente */}
        <Picker
          selectedValue={incidentFilter}
          style={styles.picker}
          onValueChange={(itemValue) => setIncidentFilter(itemValue)}
        >
          <Picker.Item label="Todos los Tipos" value="" />
          {incidentTypes.map((type) => (
            <Picker.Item key={type} label={type} value={type} />
          ))}
        </Picker>

        {/* RF-6: Selector de filtro por estado del reporte */}
        <Picker
          selectedValue={statusFilter}
          style={styles.picker}
          onValueChange={(itemValue) => setStatusFilter(itemValue)}
        >
          <Picker.Item label="Todos los Estados" value="" />
          {statusTypes.map((status) => (
            <Picker.Item key={status} label={status} value={status} />
          ))}
        </Picker>
      </Animated.View>

      {/* RF-6: Componente de mapa adaptativo según la plataforma */}
      {Platform.OS === 'web' ? (
        // RF-6: Mapa web con lista de reportes para navegadores
        <View style={styles.map}>
          <WebMapList reports={filteredReports} />
        </View>
      ) : (
        // RF-6: Mapa móvil nativo para dispositivos Android/iOS
        <View style={styles.map}>
          {IS_TEST ? (
            // En entorno de pruebas, evitamos renderizar el mapa real pero exponemos testID
            <View style={styles.center} testID="map-view-mobile" />
          ) : filteredReports.length > 0 ? (
            <MapViewMobile
              latitude={filteredReports[0].location.latitude}
              longitude={filteredReports[0].location.longitude}
              markers={filteredReports.map(r => ({
                id: r.id,
                latitude: r.location.latitude,
                longitude: r.location.longitude,
                title: r.incidentType,
                description: r.description,
                pinColor: r.status === 'Pendiente' ? 'red' : (r.status === 'En Proceso' ? 'yellow' : 'green')
              }))}
              showHeatmap={showHeatmap}
            />
          ) : (
            // RF-6: Indicador de carga cuando no hay reportes filtrados
            <View style={styles.center}>
              <ActivityIndicator size="large" color="#002B7F" />
            </View>
          )}
        </View>
      )}



      {/* RF-6: Leyenda visual para interpretar los marcadores del mapa */}
      <Animated.View 
        entering={FadeInUp.delay(300).duration(800)}
        style={styles.legend}
      >
        {/* RF-6: Indicador visual para reportes pendientes */}
        <View style={styles.legendItem}>
          <View style={[styles.legendCircle, { backgroundColor: 'red' }]} />
          <Animated.Text style={styles.legendLabel}>Pendiente</Animated.Text>
        </View>
        {/* RF-6: Indicador visual para reportes en proceso */}
        <View style={styles.legendItem}>
          <View style={[styles.legendCircle, { backgroundColor: 'orange' }]} />
          <Animated.Text style={styles.legendLabel}>En Proceso</Animated.Text>
        </View>
        {/* RF-6: Indicador visual para reportes resueltos */}
        <View style={styles.legendItem}>
          <View style={[styles.legendCircle, { backgroundColor: 'green' }]} />
          <Animated.Text style={styles.legendLabel}>Resuelto</Animated.Text>
        </View>
      </Animated.View>


      {/* RF-6: Botones de acción flotantes (FABs) para funcionalidades del mapa */}
      
      {/* RF-6: Botón para alternar entre vista normal y heatmap */}
      <Animated.View entering={ZoomIn.delay(400).duration(500)}>
        <AnimatedButton 
          style={styles.fabHeatmap} 
          onPress={() => setShowHeatmap(!showHeatmap)}
          testID="toggle-heatmap"
          animationType="scale"
          iconName={showHeatmap ? "fire" : "thermometer"}
        >
          <Animated.Text style={styles.fabText}>{showHeatmap ? '🔥' : '🌡️'}</Animated.Text>
        </AnimatedButton>
      </Animated.View>

      {/* RF-6: Botón para centrar el mapa en la ubicación del usuario */}
      <Animated.View entering={ZoomIn.delay(500).duration(500)}>
        <AnimatedButton 
          style={styles.fabLocation} 
          onPress={centerOnUserLocation}
          testID="center-location"
          animationType="bounce"
          iconName="map-marker"
        >
          <Animated.Text style={styles.fabText}>📍</Animated.Text>
        </AnimatedButton>
      </Animated.View>

      <Toast />
    </View>
    </AnimatedScreen>
  );
};

export default AllReportsMapScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#002B7F',
    textAlign: 'center',
    marginVertical: 10,
  },
  searchInput: {
    marginHorizontal: 10,
    marginBottom: 6,
    padding: 10,
    borderRadius: 8,
    borderColor: '#ccc',
    borderWidth: 1,
    backgroundColor: '#f7f7f7',
  },
  map: {
    flex: 1,
    width: Dimensions.get('window').width,
    height: '100%',
  },
  filters: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 5,
    paddingHorizontal: 10,
  },
  picker: {
    width: '45%',
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fabHeatmap: {
    position: 'absolute',
    bottom: 90,
    right: 20,
    backgroundColor: '#005BEA',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
  },
  fabLocation: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#00BFA6',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
  },
  fabText: {
    fontSize: 24,
    color: '#fff',
  },
  legend: {
    position: 'absolute',
    bottom: 160,
    left: 10,
    backgroundColor: 'rgba(255,255,255,0.9)',
    padding: 8,
    borderRadius: 8,
    elevation: 4,
  },
  legendItem: {
  flexDirection: 'row',
  alignItems: 'center',
  marginVertical: 2,
},
legendCircle: {
  width: 14,
  height: 14,
  borderRadius: 7,
  marginRight: 6,
},
legendLabel: {
  fontSize: 14,
  color: '#333',
},

});
