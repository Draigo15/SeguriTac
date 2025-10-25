// src/components/WebMap.native.tsx
// Versión nativa (Android/iOS) - Stub para evitar imports de Leaflet
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing } from '../theme';

type WebMapProps = {
  latitude: number;
  longitude: number;
  userLatitude?: number;
  userLongitude?: number;
};

const WebMap: React.FC<WebMapProps> = ({ latitude, longitude, userLatitude, userLongitude }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Vista de mapa no disponible</Text>
      <Text style={styles.coordinates}>
        📍 Incidente: {latitude.toFixed(6)}, {longitude.toFixed(6)}
      </Text>
      {userLatitude !== undefined && userLongitude !== undefined && (
        <Text style={styles.userCoordinates}>
          🚶 Tu ubicación: {userLatitude.toFixed(6)}, {userLongitude.toFixed(6)}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 250,
    width: '100%',
    backgroundColor: colors.gray100,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.gray300,
  },
  title: {
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.sm,
    fontWeight: 'bold',
    fontSize: 16,
  },
  coordinates: {
    color: colors.textLight,
    fontSize: 13,
    textAlign: 'center',
  },
  userCoordinates: {
    color: colors.primary,
    fontSize: 13,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
});

export default WebMap;
