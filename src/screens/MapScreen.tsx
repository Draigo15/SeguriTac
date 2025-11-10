import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
// Los tests mockean react-native-maps para que Marker y Callout sean Views
import MapView, { Marker, Callout } from 'react-native-maps';
import { getAllReports } from '../services/reports';

const MapScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [reports, setReports] = useState<any[]>([]);
  const [selectedReport, setSelectedReport] = useState<any | null>(null);

  useEffect(() => {
    let mounted = true;
    getAllReports()
      .then((data: any[]) => {
        if (mounted) setReports(data);
      })
      .catch(() => {
        if (mounted) setReports([]);
      });
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <View style={styles.container}>
      <MapView style={styles.map}>
        {reports.map((report) => (
          <Marker
            key={report.id}
            testID="map-marker"
            // En el mock de tests, fireEvent.press llamará a esta prop
            onPress={() => setSelectedReport(report)}
            coordinate={{
              latitude: report?.location?.latitude ?? 0,
              longitude: report?.location?.longitude ?? 0,
            }}
          >
            {(!selectedReport || selectedReport.id !== report.id) && (
              <Callout>
                <Text>{report.title}</Text>
              </Callout>
            )}
          </Marker>
        ))}
      </MapView>

      {selectedReport && (
        <View style={styles.details}>
          <Text style={styles.title}>{selectedReport.title}</Text>
          <TouchableOpacity
            accessibilityRole="button"
            onPress={() => navigation.navigate('ReportDetail', { reportId: selectedReport.id })}
          >
            <Text style={styles.link}>Ver más</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  details: { padding: 16, backgroundColor: '#fff' },
  title: { fontSize: 16, fontWeight: '600' },
  link: { color: '#007AFF', marginTop: 8 },
});

export default MapScreen;