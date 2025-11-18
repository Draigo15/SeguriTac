import React, { forwardRef, useImperativeHandle } from 'react';
import { View, StyleSheet } from 'react-native';
import WebMap from './WebMap';
import { MapViewMobileRef, Region } from './MapViewMobile.types';

// Export the ref interface for TypeScript compatibility
export type { MapViewMobileRef };

type Props = {
  latitude: number;
  longitude: number;
  title?: string;
  showUserLocation?: boolean;
  zoomEnabled?: boolean;
  scrollEnabled?: boolean;
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

const MapViewMobile = forwardRef<MapViewMobileRef, Props>(({ latitude, longitude, ...props }, ref) => {
  useImperativeHandle(ref, () => ({
    animateToRegion: (region: Region, duration?: number) => {
      // Web implementation - no-op for now
      console.log('animateToRegion called on web:', region, duration);
    },
    animateToCoordinate: (coordinate: { latitude: number; longitude: number }, duration?: number) => {
      // Web implementation - no-op for now
      console.log('animateToCoordinate called on web:', coordinate, duration);
    },
    getCurrentRegion: async (): Promise<Region | null> => {
      // Web implementation - return current view region
      return {
        latitude,
        longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
    },
  }));

  return (
    <View style={styles.container}>
      <WebMap latitude={latitude} longitude={longitude} />
    </View>
  );
});

MapViewMobile.displayName = 'MapViewMobile';

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 300,
    borderRadius: 10,
    overflow: 'hidden',
  },
});

export default MapViewMobile;