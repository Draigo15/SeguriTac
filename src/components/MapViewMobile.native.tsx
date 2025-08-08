import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Platform } from 'react-native';

type Props = {
  latitude: number;
  longitude: number;
};

const MapViewMobile: React.FC<Props> = ({ latitude, longitude }) => {
  const [MapView, setMapView] = useState<any>(null);
  const [Marker, setMarker] = useState<any>(null);

  useEffect(() => {
    if (Platform.OS !== 'web') {
      import('react-native-maps').then((mod) => {
        setMapView(() => mod.default);
        setMarker(() => mod.Marker);
      });
    }
  }, []);

  if (!MapView || !Marker) return null;

  const region = {
    latitude,
    longitude,
    latitudeDelta: 0.005,
    longitudeDelta: 0.005,
  };

  return (
    <View style={styles.container}>
      <MapView style={styles.map} region={region}>
        <Marker coordinate={{ latitude, longitude }} title="Ubicación del reporte" />
      </MapView>
    </View>
  );
};

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
});

export default MapViewMobile;
