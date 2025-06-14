import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  Alert,
  Share,
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import MapView, { Marker } from 'react-native-maps';
import { Picker } from '@react-native-picker/picker';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db, auth } from '../services/firebase';
import Toast from 'react-native-toast-message';


const ReportDetailScreen = () => {
  const route = useRoute();
  const { report }: any = route.params || {};

  const [newStatus, setNewStatus] = useState('Pendiente');
  const [currentUserRole, setCurrentUserRole] = useState('');

  useEffect(() => {
    if (report?.status) {
      setNewStatus(report.status);
    }

    const fetchRole = async () => {
      try {
        const currentUser = auth.currentUser;
        if (currentUser) {
          const userRef = doc(db, 'users', currentUser.uid);
          const docSnap = await getDoc(userRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            setCurrentUserRole(data.role || '');
          }
        }
      } catch (error) {
        console.error('Error al obtener rol del usuario:', error);
      }
    };

    fetchRole();
  }, [report]);

  const handleShare = async () => {
    try {
      const tipo = report?.incidentType ?? 'Desconocido';
      const fecha = report?.dateFormatted ?? 'No disponible';
      const descripcion = report?.description ?? 'Sin descripción';
      const ubicacion =
        report?.location?.latitude && report?.location?.longitude
          ? `📍 Ubicación:\nhttps://maps.google.com/?q=${report.location.latitude},${report.location.longitude}`
          : '';

      const mensaje = `📢 *Reporte de Incidente* 🛑

🗂 Tipo: ${tipo}
📅 Fecha: ${fecha}
📝 Descripción:
${descripcion}

${ubicacion}`;

      await Share.share({ message: mensaje });
    } catch (error) {
      Alert.alert('Error', 'No se pudo compartir el reporte.');
    }
  };

  const handleUpdateStatus = async () => {
    try {
      if (!report?.id || !report?.email) {
        throw new Error('Faltan datos del reporte para actualizar.');
      }

      const reportRef = doc(db, 'reports', report.id);
      await updateDoc(reportRef, { status: newStatus });

      const tokenDoc = await getDoc(doc(db, 'user_tokens', report.email));
      if (tokenDoc.exists()) {
        const { token } = tokenDoc.data();
        await fetch('https://seguridad-ciudadana-backend.onrender.com/send-status-update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token, newStatus }),
        });
      }

      Toast.show({
        type: 'success',
        text1: 'Estado actualizado',
        text2: `Nuevo estado: ${newStatus}`,
      });
    } catch (error) {
      console.error('Error al actualizar estado:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'No se pudo actualizar el estado.',
      });
    }
  };

  if (!report || typeof report !== 'object') {
    return (
      <View style={styles.center}>
        <Text style={{ color: 'red' }}>No se pudo cargar el reporte.</Text>
      </View>
    );
  }

  const isValidLocation =
    typeof report.location?.latitude === 'number' &&
    typeof report.location?.longitude === 'number';

  const isValidImage =
    typeof report.imageUri === 'string' && report.imageUri.startsWith('http');

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 100 }}>
      <Text style={styles.title}>📌 {report.incidentType ?? 'Tipo desconocido'}</Text>
      <Text style={styles.date}>📅 {report.dateFormatted ?? 'Fecha no disponible'}</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Estado actual:</Text>
        <Text style={styles.text}>{report.status ?? 'Pendiente'}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Descripción:</Text>
        <Text style={styles.text}>{report.description ?? 'Sin descripción'}</Text>
      </View>

      {isValidImage && (
        <View style={styles.card}>
          <Text style={styles.label}>Imagen:</Text>
          <Image
            source={{ uri: report.imageUri }}
            style={styles.image}
            onError={() => console.log('Error al cargar imagen')}
          />
        </View>
      )}

      {isValidLocation && (
        <View style={styles.card}>
          <Text style={styles.label}>Ubicación del incidente:</Text>
          <MapView
            style={styles.map}
            initialRegion={{
              latitude: report.location?.latitude ?? -16.5,
              longitude: report.location?.longitude ?? -68.15,
              latitudeDelta: 0.005,
              longitudeDelta: 0.005,
            }}
          >
            <Marker
              coordinate={{
                latitude: report.location.latitude,
                longitude: report.location.longitude,
              }}
              title="Ubicación del Reporte"
            />
          </MapView>
        </View>
      )}

      {currentUserRole === 'autoridad' && (
        <View style={styles.card}>
          <Text style={styles.label}>Actualizar Estado:</Text>
          <Picker selectedValue={newStatus} onValueChange={setNewStatus}>
            <Picker.Item label="Pendiente" value="Pendiente" />
            <Picker.Item label="En proceso" value="En proceso" />
            <Picker.Item label="Resuelto" value="Resuelto" />
          </Picker>
          <TouchableOpacity style={styles.updateButton} onPress={handleUpdateStatus}>
            <Text style={styles.updateButtonText}>Guardar Estado</Text>
          </TouchableOpacity>
        </View>
      )}

      <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
        <Text style={styles.shareButtonText}>📤 Compartir Reporte</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

export default ReportDetailScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#E3F2FD',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#002B7F',
    marginBottom: 5,
    textAlign: 'center',
  },
  date: {
    fontSize: 16,
    color: '#444',
    marginBottom: 20,
    textAlign: 'center',
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  text: {
    fontSize: 16,
    color: '#555',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  image: {
    width: '100%',
    height: 250,
    borderRadius: 10,
    marginTop: 10,
  },
  map: {
    width: '100%',
    height: 250,
    borderRadius: 10,
    marginTop: 10,
  },
  shareButton: {
    backgroundColor: '#00796B',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  shareButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  updateButton: {
    backgroundColor: '#1565C0',
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 10,
    alignItems: 'center',
  },
  updateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
