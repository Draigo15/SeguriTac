// src/components/WebMapList.native.tsx
// Versión nativa (Android/iOS) - Stub para evitar imports de Leaflet
import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { colors, spacing } from '../theme';

type Report = {
  id: string;
  location: { latitude: number; longitude: number };
  incidentType: string;
  status: string;
};

type Props = {
  reports: Report[];
};

const WebMapList: React.FC<Props> = ({ reports }) => {
  const renderReport = ({ item }: { item: Report }) => (
    <View style={styles.reportItem}>
      <Text style={styles.incidentType}>{item.incidentType}</Text>
      <Text style={styles.status}>Estado: {item.status}</Text>
      <Text style={styles.coordinates}>
        Lat: {item.location.latitude.toFixed(6)}, Lng: {item.location.longitude.toFixed(6)}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Lista de Reportes</Text>
      <Text style={styles.subtitle}>Mapa no disponible en plataforma nativa</Text>
      
      {reports.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No hay reportes para mostrar</Text>
        </View>
      ) : (
        <FlatList
          data={reports}
          renderItem={renderReport}
          keyExtractor={(item) => item.id}
          style={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray100,
    padding: spacing.md,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  subtitle: {
    color: colors.textLight,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  list: {
    flex: 1,
  },
  reportItem: {
    backgroundColor: colors.white,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  incidentType: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  status: {
    color: colors.textLight,
    marginBottom: spacing.xs,
  },
  coordinates: {
    fontSize: 12,
    color: colors.textLight,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: colors.textLight,
    textAlign: 'center',
  },
});

export default WebMapList;