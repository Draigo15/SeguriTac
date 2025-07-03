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
import { Platform } from 'react-native';

import { Picker } from '@react-native-picker/picker';
import { doc, updateDoc, getDoc ,setDoc } from 'firebase/firestore';
import { db, auth } from '../services/firebase';
import Toast from 'react-native-toast-message';
import { Timestamp } from 'firebase/firestore';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types'; // Ajusta la ruta si es distinta
import * as Location from 'expo-location';
import { useRef } from 'react';




const ReportDetailScreen = () => {

    const [MapView, setMapView] = useState<any>(null);
  const [Marker, setMarker] = useState<any>(null);
  const [WebMap, setWebMap] = useState<any>(null);

  useEffect(() => {
    if (Platform.OS === 'web') {
      import('../components/WebMap').then((mod) => setWebMap(() => mod.default));
    } else {
      import('react-native-maps').then((Maps) => {
        setMapView(() => Maps.default);
        setMarker(() => Maps.Marker);
      });
    }
  }, []);

  const route = useRoute();
  const { report }: any = route.params || {};

const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();



  const [newStatus, setNewStatus] = useState('Pendiente');
  const [currentUserRole, setCurrentUserRole] = useState('');
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
const mapRef = useRef<any>(null);


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

  const handleLocateMe = async () => {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') {
    Alert.alert('Permiso denegado', 'No se puede acceder a tu ubicación.');
    return;
  }

  const location = await Location.getCurrentPositionAsync({});
  const { latitude, longitude } = location.coords;

  setUserLocation({ latitude, longitude });

  mapRef.current?.animateToRegion({
    latitude,
    longitude,
    latitudeDelta: 0.005,
    longitudeDelta: 0.005,
  });
};

const handleUpdateStatus = async () => {
  try {
    console.log('🧪 Intentando actualizar estado...');
    if (!report?.id) {
      console.error('⛔ report.id es undefined');
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'ID del reporte no disponible.',
      });
      return;
    }

    const reportRef = doc(db, 'reports', report.id);
    await updateDoc(reportRef, { status: newStatus });

    console.log('✅ Estado actualizado en Firestore:', newStatus);

    // Envío de notificación push si existe token
    const tokenDoc = await getDoc(doc(db, 'user_tokens', report.email));
    if (tokenDoc.exists()) {
      const { token } = tokenDoc.data();
      console.log('📲 Token encontrado, enviando notificación...');
      await fetch('https://seguridad-ciudadana-backend.onrender.com/send-status-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newStatus }),
      });
    }

    const userNotifRef = doc(db, 'user_notifications', report.email);
    const notifSnap = await getDoc(userNotifRef);

    const nuevaNotificacion = {
      id: Date.now().toString(),
      title: '🔔 Estado actualizado',
      body: `El estado de tu reporte cambió a "${newStatus}".`,
      timestamp: Timestamp.now(),
    };

    if (notifSnap.exists()) {
      const prevData = notifSnap.data();
      const updatedNotifs = [nuevaNotificacion, ...(prevData.notifications || [])];

      await updateDoc(userNotifRef, {
        notifications: updatedNotifs,
        hasUnread: true,
      });
    } else {
      await setDoc(userNotifRef, {
        notifications: [nuevaNotificacion],
        hasUnread: true,
      });
    }

    // ✅ Confirmación visual (Toast + Alert)
    Toast.show({
      type: 'success',
      text1: 'Estado actualizado',
      text2: `Nuevo estado: ${newStatus}`,
    });

    Alert.alert(
      '✅ Estado actualizado',
      `El estado del reporte se cambió exitosamente a "${newStatus}".`,
      [{ text: 'OK', style: 'default' }]
    );

  } catch (error: any) {
    console.error('❌ Error al actualizar estado:', error.message || error);
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
if (Platform.OS !== 'web' && (!MapView || !Marker)) {
  return (
    <View style={styles.center}>
      <Text style={{ color: '#002B7F' }}>Cargando mapa...</Text>
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

    <View style={{ position: 'relative', width: '100%', height: 250, marginTop: 10 }}>
      {Platform.OS === 'web' ? (
        WebMap ? (
          <WebMap latitude={report.location.latitude} longitude={report.location.longitude} />
        ) : (
          <View style={styles.center}><Text>Cargando mapa...</Text></View>
        )
      ) : MapView && Marker ? (
        <>
          <MapView
            ref={mapRef}
            style={{ ...StyleSheet.absoluteFillObject, borderRadius: 10 }}
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

            {userLocation && (
              <Marker
                coordinate={userLocation}
                title="Mi ubicación"
                pinColor="blue"
              />
            )}
          </MapView>

          <TouchableOpacity style={styles.fabLocation} onPress={handleLocateMe}>
            <Text style={styles.fabText}>📍</Text>
          </TouchableOpacity>
        </>
      ) : (
        <View style={styles.center}><Text>Cargando mapa...</Text></View>
      )}
    </View>
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

      <TouchableOpacity
        style={styles.chatButton}
        onPress={() => navigation.navigate('Chat', { reportId: report.id })}
      >
        <Text style={styles.chatButtonText}>💬 Ir al Chat</Text>
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
  chatButton: {
  backgroundColor: '#002B7F',
  paddingVertical: 14,
  borderRadius: 10,
  alignItems: 'center',
  marginTop: 10,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.2,
  shadowRadius: 4,
  elevation: 3,
},
chatButtonText: {
  color: '#fff',
  fontSize: 16,
  fontWeight: 'bold',
},
locateButton: {
  marginTop: 10,
  backgroundColor: '#007BFF',
  paddingVertical: 10,
  borderRadius: 8,
  alignItems: 'center',
},
locateButtonText: {
  color: '#fff',
  fontWeight: 'bold',
  fontSize: 14,
},
fabLocation: {
  position: 'absolute',
  bottom: 10,
  right: 10,
  backgroundColor: '#007BFF',
  width: 46,
  height: 46,
  borderRadius: 23,
  justifyContent: 'center',
  alignItems: 'center',
  elevation: 5,
},
fabText: {
  fontSize: 22,
  color: '#fff',
},

});
