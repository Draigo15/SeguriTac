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


import { Picker } from '@react-native-picker/picker';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase';
import * as Location from 'expo-location';

import Toast from 'react-native-toast-message';
import { useRoute, RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/types';

type AllReportsMapRouteProp = RouteProp<RootStackParamList, 'AllReportsMap'>;

const AllReportsMapScreen = () => {
  const route = useRoute<AllReportsMapRouteProp>();
  const { initialRegion, focusedReportId } = route.params || {};
  
const [WebMapList, setWebMapList] = useState<any>(null);
const [MapView, setMapView] = useState<any>(null);
const [Marker, setMarker] = useState<any>(null);
const [Heatmap, setHeatmap] = useState<any>(null);
const [PROVIDER_GOOGLE, setProvider] = useState<any>(null);



useEffect(() => {
  if (Platform.OS === 'web') {
    import('../components/WebMapList').then((mod) => setWebMapList(() => mod.default));
  } else {
    import('react-native-maps').then((Maps) => {
      setMapView(() => Maps.default);
      setMarker(() => Maps.Marker);
      setHeatmap(() => Maps.Heatmap);
      setProvider(() => Maps.PROVIDER_GOOGLE);
    });
  }
}, []);
  const [reports, setReports] = useState<any[]>([]);
  const [filteredReports, setFilteredReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [incidentFilter, setIncidentFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [incidentTypes, setIncidentTypes] = useState<string[]>([]);
  const [statusTypes, setStatusTypes] = useState<string[]>([]);
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [search, setSearch] = useState('');
 const mapRef = useRef<any>(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'reports'), (querySnapshot) => {
      const fetchedReports: any[] = [];
      const typesSet = new Set<string>();
      const statusSet = new Set<string>();

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.location?.latitude && data.location?.longitude) {
          fetchedReports.push({ id: doc.id, ...data });
          if (data.incidentType) typesSet.add(data.incidentType);
          if (data.status) statusSet.add(data.status);
        }
      });

      setReports(fetchedReports);
      setFilteredReports(fetchedReports);
      setIncidentTypes(Array.from(typesSet));
      setStatusTypes(Array.from(statusSet));
      setLoading(false);

      Toast.show({
        type: 'info',
        text1: `Se cargaron ${fetchedReports.length} reportes`,
      });
    });

    centerOnUserLocation(); // Centra al iniciar

    return unsubscribe;
  }, []);

  useEffect(() => {
    let filtered = [...reports];

    if (incidentFilter) {
      filtered = filtered.filter((r) => r.incidentType === incidentFilter);
    }

    if (statusFilter) {
      filtered = filtered.filter((r) => r.status === statusFilter);
    }

    if (search.trim() !== '') {
      filtered = filtered.filter((r) =>
        r.description?.toLowerCase().includes(search.toLowerCase()) ||
        r.email?.toLowerCase().includes(search.toLowerCase())
      );
    }

    setFilteredReports(filtered);
  }, [incidentFilter, statusFilter, search]);

  const centerOnUserLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      alert('Permiso de ubicación denegado');
      return;
    }

    const location = await Location.getCurrentPositionAsync({});
    mapRef.current?.animateToRegion({
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    });
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#002B7F" />
      </View>
    );
  }
  // ⬇️ Agrega esto justo aquí
if (Platform.OS !== 'web' && (!MapView || !Marker || !Heatmap || !PROVIDER_GOOGLE)) {
  return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color="#002B7F" />
    </View>
  );
}
  return (
    <AnimatedScreen animationType="slideHorizontal" duration={800}>
    <View style={styles.container}>
      <Animated.Text 
        entering={FadeInDown.duration(800)}
        style={styles.header}
      >
        🗺️ Mapa de Reportes
      </Animated.Text>

      <Animated.View entering={FadeInDown.delay(100).duration(800)}>
        <TextInput
          placeholder="🔍 Buscar por palabra clave..."
          style={styles.searchInput}
          onChangeText={setSearch}
          value={search}
        />
      </Animated.View>

      <Animated.View 
        entering={FadeInDown.delay(200).duration(800)}
        style={styles.filters}
      >
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

{Platform.OS === 'web' && WebMapList ? (
  <View style={styles.map}>
    <WebMapList reports={filteredReports} />
  </View>
) : MapView && Marker && Heatmap && PROVIDER_GOOGLE ? (
  <MapView
    ref={mapRef}
    style={styles.map}
    provider={PROVIDER_GOOGLE}
    initialRegion={initialRegion || {
      latitude: filteredReports[0]?.location.latitude || -16.5,
      longitude: filteredReports[0]?.location.longitude || -68.15,
      latitudeDelta: 0.1,
      longitudeDelta: 0.1,
    }}
  >
    {showHeatmap && (
      <Heatmap
        points={reports.map((r) => ({
          latitude: r.location.latitude,
          longitude: r.location.longitude,
          weight: 1,
        }))}
        radius={40}
        opacity={0.6}
      />
    )}

    {filteredReports.map((report) => (
      <Marker
        key={report.id}
        coordinate={{
          latitude: report.location.latitude,
          longitude: report.location.longitude,
        }}
        title={report.incidentType}
        description={report.status}
        pinColor={
          report.status === 'Resuelto'
            ? 'green'
            : report.status === 'En proceso'
            ? 'orange'
            : 'red'
        }
      />
    ))}
  </MapView>
) : (
  <View style={styles.center}>
    <ActivityIndicator size="large" color="#002B7F" />
  </View>
)}



      <Animated.View 
        entering={FadeInUp.delay(300).duration(800)}
        style={styles.legend}
      >
        <View style={styles.legendItem}>
          <View style={[styles.legendCircle, { backgroundColor: 'red' }]} />
          <Animated.Text style={styles.legendLabel}>Pendiente</Animated.Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendCircle, { backgroundColor: 'orange' }]} />
          <Animated.Text style={styles.legendLabel}>En Proceso</Animated.Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendCircle, { backgroundColor: 'green' }]} />
          <Animated.Text style={styles.legendLabel}>Resuelto</Animated.Text>
        </View>
      </Animated.View>


      {/* FABs */}
      <Animated.View entering={ZoomIn.delay(400).duration(500)}>
        <AnimatedButton 
          style={styles.fabHeatmap} 
          onPress={() => setShowHeatmap(!showHeatmap)}
          animationType="scale"
          iconName={showHeatmap ? "fire" : "thermometer"}
        >
          <Animated.Text style={styles.fabText}>{showHeatmap ? '🔥' : '🌡️'}</Animated.Text>
        </AnimatedButton>
      </Animated.View>

      <Animated.View entering={ZoomIn.delay(500).duration(500)}>
        <AnimatedButton 
          style={styles.fabLocation} 
          onPress={centerOnUserLocation}
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
