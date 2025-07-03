import React, { useEffect, useState } from 'react';
import { Platform, View, ActivityIndicator } from 'react-native';
import WebMapList from './WebMapList';

let MapView: any = null;
let Marker: any = null;
let Heatmap: any = null;
let PROVIDER_GOOGLE: any = null;

type Report = {
  id: string;
  location: { latitude: number; longitude: number };
  incidentType: string;
  status: string;
};

type Props = {
  reports: Report[];
  showHeatmap: boolean;
  filteredReports: Report[];
  mapRef: any;
};

const MapSwitcher: React.FC<Props> = ({ reports, showHeatmap, filteredReports, mapRef }) => {
  const [ready, setReady] = useState(Platform.OS === 'web'); // ya está listo si es web

  useEffect(() => {
    if (Platform.OS !== 'web') {
      (async () => {
        const Maps = await import('react-native-maps');
        MapView = Maps.default;
        Marker = Maps.Marker;
        Heatmap = Maps.Heatmap;
        PROVIDER_GOOGLE = Maps.PROVIDER_GOOGLE;
        setReady(true);
      })();
    }
  }, []);

  if (!ready) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#002B7F" />
      </View>
    );
  }

  if (Platform.OS === 'web') {
    return <WebMapList reports={filteredReports} />;
  }

  const initialRegion = {
    latitude: filteredReports[0]?.location.latitude ?? -16.5,
    longitude: filteredReports[0]?.location.longitude ?? -68.15,
    latitudeDelta: 0.1,
    longitudeDelta: 0.1,
  };

  return (
    <MapView
      ref={mapRef}
      style={{ flex: 1 }}
      provider={PROVIDER_GOOGLE}
      initialRegion={initialRegion}
    >
      {showHeatmap && Heatmap && (
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
          description={`Estado: ${report.status}`}
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
  );
};

export default MapSwitcher;
