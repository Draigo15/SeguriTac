import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import MapView, { Marker, Heatmap, PROVIDER_GOOGLE } from 'react-native-maps';
import { Picker } from '@react-native-picker/picker';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase';
import * as Location from 'expo-location';

const AllReportsMapScreen = () => {
  const [reports, setReports] = useState<any[]>([]);
  const [filteredReports, setFilteredReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [incidentFilter, setIncidentFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [incidentTypes, setIncidentTypes] = useState<string[]>([]);
  const [statusTypes, setStatusTypes] = useState<string[]>([]);
  const [showHeatmap, setShowHeatmap] = useState(true);
  const mapRef = useRef<MapView>(null);

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
    });

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

    setFilteredReports(filtered);
  }, [incidentFilter, statusFilter]);

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

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Mapa de Reportes</Text>

      <View style={styles.filters}>
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
      </View>

      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={{
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

      <TouchableOpacity style={styles.fabHeatmap} onPress={() => setShowHeatmap(!showHeatmap)}>
        <Text style={styles.fabText}>{showHeatmap ? '🔥' : '🌡️'}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.fabLocation} onPress={centerOnUserLocation}>
        <Text style={styles.fabText}>📍</Text>
      </TouchableOpacity>
    </View>
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
  map: {
    flex: 1,
    width: Dimensions.get('window').width,
    height: '100%',
  },
  filters: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10,
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
});
