import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';

type ReportShareCardProps = {
  report: {
    id?: string | number;
    incidentType?: string;
    status?: string;
    dateFormatted?: string;
    description?: string;
    imageUrl?: string;
    imageUri?: string;
    imageBase64?: string;
    location?: { latitude?: number; longitude?: number } | null;
  };
};

export const ReportShareCard: React.FC<ReportShareCardProps> = ({ report }) => {
  const imageSource = report.imageUrl || report.imageUri || report.imageBase64;
  const hasImage = typeof imageSource === 'string' && imageSource.length > 0;

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Reporte #{String(report.id ?? '')}</Text>
      <Text style={styles.subtitle}>Tipo: {report.incidentType ?? 'Desconocido'}</Text>
      <Text style={styles.subtitle}>Estado: {report.status ?? 'Pendiente'}</Text>
      <Text style={styles.subtitle}>Fecha: {report.dateFormatted ?? 'No disponible'}</Text>

      {hasImage ? (
        <Image source={{ uri: imageSource }} style={styles.image} />
      ) : (
        <View style={[styles.image, styles.imagePlaceholder]}>
          <Text style={styles.placeholderText}>Imagen no disponible</Text>
        </View>
      )}

      <Text style={styles.sectionTitle}>Descripción</Text>
      <Text style={styles.description}>{report.description ?? 'Sin descripción'}</Text>

      {report.location?.latitude != null && report.location?.longitude != null && (
        <Text style={styles.location}>
          Ubicación: {report.location.latitude}, {report.location.longitude}
        </Text>
      )}

      <Text style={styles.watermark}>Generado por Seguridad Ciudadana</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    width: 800,
    padding: 24,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  subtitle: {
    fontSize: 18,
    color: '#374151',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
    color: '#111827',
  },
  description: {
    fontSize: 16,
    color: '#374151',
    marginTop: 8,
  },
  image: {
    width: '100%',
    height: 400,
    borderRadius: 12,
    marginTop: 16,
    backgroundColor: '#f3f4f6',
  },
  imagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: '#6b7280',
  },
  location: {
    fontSize: 16,
    color: '#374151',
    marginTop: 12,
  },
  watermark: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'right',
    marginTop: 16,
  },
});

export default ReportShareCard;