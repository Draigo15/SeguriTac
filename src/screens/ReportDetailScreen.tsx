/**
 * ReportDetailScreen - Pantalla de Detalle de Reporte
 * 
 * Pantalla que muestra información completa de un reporte de incidente específico,
 * incluyendo detalles, ubicación en mapa, imagen de evidencia y funcionalidades
 * de gestión para autoridades.
 * 
 * Funcionalidades principales:
 * - Visualización completa de datos del reporte
 * - Mapa interactivo con ubicación del incidente
 * - Gestión de estados (solo para autoridades)
 * - Compartir reporte via redes sociales
 * - Navegación al chat del reporte
 * - Localización del usuario actual
 * 
 * @author Equipo de Desarrollo
 * @version 1.0.0
 * @date 2024-01-15
 */

// React y React Native core
import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  Alert,
  Share,
  Platform,
} from 'react-native';

// Componentes personalizados y animaciones
import AnimatedScreen from '../components/AnimatedScreen';
import AnimatedButton from '../components/AnimatedButton';

// Componentes de terceros
import { Picker } from '@react-native-picker/picker';
import Toast from 'react-native-toast-message';
import * as Location from 'expo-location';

// Firebase y servicios
import { doc, updateDoc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { db, auth } from '../services/firebase';

// Navegación y tipos
import { useRoute, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';

// Importaciones de componentes de mapa
import WebMap from '../components/WebMap';
import MapViewMobile from '../components/MapViewMobile';

/**
 * Componente principal para mostrar detalles completos de un reporte
 * 
 * Renderiza una vista detallada del reporte con información completa,
 * mapa interactivo, opciones de gestión para autoridades y funcionalidades
 * de compartir y chat.
 * 
 * @component
 * @returns {JSX.Element} Pantalla de detalle del reporte
 */
const ReportDetailScreen = () => {

  // Navegación y parámetros de ruta
  const route = useRoute();
  const { report }: any = route.params || {}; // Datos del reporte pasados desde la pantalla anterior
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  // Estados de gestión del reporte
  const [newStatus, setNewStatus] = useState('Pendiente'); // Estado seleccionado para actualización
  const [currentUserRole, setCurrentUserRole] = useState(''); // Rol del usuario actual (ciudadano/autoridad)
  
  // Estados de ubicación y mapa
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null); // Ubicación actual del usuario
  const mapRef = useRef<any>(null); // Referencia al componente de mapa para animaciones


  /**
   * Efecto para inicialización de datos del reporte y obtención del rol del usuario
   * 
   * Funciones principales:
   * 1. Establece el estado inicial basado en el reporte recibido
   * 2. Obtiene el rol del usuario autenticado desde Firestore
   * 3. Determina permisos de gestión (solo autoridades pueden cambiar estados)
   * 
   * Se ejecuta cuando cambia el reporte o al montar el componente.
   */
  useEffect(() => {
    // Establecer estado inicial del reporte
    if (report?.status) {
      setNewStatus(report.status);
    }

    /**
     * Función interna para obtener el rol del usuario actual
     * Consulta Firestore para determinar si es ciudadano o autoridad
     */
    const fetchRole = async () => {
      try {
        const currentUser = auth.currentUser;
        if (currentUser) {
          const userRef = doc(db, 'users', currentUser.uid);
          const docSnap = await getDoc(userRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            setCurrentUserRole(data.role || ''); // Establecer rol (ciudadano/autoridad)
          }
        }
      } catch (error: any) {
        console.error('Error al obtener rol del usuario:', error);
      }
    };

    fetchRole();
  }, [report]); // Dependencia: se ejecuta cuando cambia el reporte

  /**
   * Función para compartir información del reporte
   * 
   * Utiliza la API nativa de compartir del dispositivo para permitir
   * al usuario enviar los detalles del reporte a través de diferentes
   * aplicaciones (WhatsApp, email, SMS, etc.).
   * 
   * Información compartida:
   * - Tipo de incidente
   * - Fecha del reporte
   * - Descripción detallada
   * - Ubicación con enlace a Google Maps (si disponible)
   */
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

      await Share.share({ message: mensaje }); // Abrir panel nativo de compartir
    } catch (error: any) {
      Alert.alert('Error', 'No se pudo compartir el reporte.');
    }
  };

  /**
   * Función para obtener y mostrar la ubicación actual del usuario
   * 
   * Utiliza la API de geolocalización para:
   * 1. Solicitar permisos de ubicación al usuario
   * 2. Obtener las coordenadas GPS actuales del dispositivo
   * 3. Actualizar el estado con la nueva ubicación
   * 4. Animar el mapa para centrar la vista en la ubicación del usuario
   * 
   * Manejo de errores:
   * - Verifica permisos antes de acceder a la ubicación
   * - Muestra alertas informativas en caso de fallos
   */
  const handleLocateMe = async () => {
    try {
      console.log('📍 Solicitando permisos de ubicación...');
      // Solicitar permisos de ubicación
      const { status } = await Location.requestForegroundPermissionsAsync();
      console.log('📍 Estado de permisos:', status);
      
      if (status !== 'granted') {
        console.log('❌ Permisos de ubicación denegados');
        Alert.alert('Permiso denegado', 'No se puede acceder a tu ubicación.');
        return;
      }

      console.log('📍 Obteniendo ubicación actual...');
      // Obtener ubicación actual
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      const { latitude, longitude } = location.coords;
      console.log('📍 Ubicación obtenida:', { latitude, longitude });

      setUserLocation({ latitude, longitude }); // Actualizar estado con nueva ubicación

      // Animar el mapa hacia la ubicación del usuario (solo en móvil)
      if (Platform.OS !== 'web' && mapRef.current) {
        console.log('📍 Animando mapa hacia ubicación del usuario');
        mapRef.current.animateToRegion({
          latitude,
          longitude,
          latitudeDelta: 0.005, // Zoom cercano
          longitudeDelta: 0.005,
        });
      }
    } catch (error) {
      console.error('❌ Error al obtener ubicación:', error);
      Alert.alert('Error', 'No se pudo obtener tu ubicación.');
    }
  };

  /**
   * Función para actualizar el estado del reporte (solo autoridades)
   * 
   * Permite a usuarios con rol de 'autoridad' cambiar el estado de un reporte
   * en la base de datos de Firestore. Estados disponibles:
   * - Pendiente: Reporte recién creado
   * - En Proceso: Autoridad trabajando en el caso
   * - Resuelto: Caso completado
   * 
   * Funcionalidades adicionales:
   * - Cierra automáticamente el chat cuando el estado es 'Resuelto'
   * - Envía notificaciones push al usuario que creó el reporte
   * - Registra notificaciones en Firestore para historial
   * - Proporciona feedback visual mediante Toast y Alert
   * 
   * @async
   * @function
   */
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
      await updateDoc(reportRef, { status: newStatus }); // Actualizar estado en Firestore

      console.log('✅ Estado actualizado en Firestore:', newStatus);

      // Cerrar chat automáticamente si el reporte se marca como resuelto
      if (newStatus === 'Resuelto') {
        await updateDoc(reportRef, {
          chatClosed: true,
        });
        console.log('🔒 Chat marcado como cerrado automáticamente.');
      }

      // Envío de notificación push si existe token del usuario
      const tokenDoc = await getDoc(doc(db, 'user_tokens', report.email));
      if (tokenDoc.exists()) {
        const { token } = tokenDoc.data();
        console.log('📲 Token encontrado, enviando notificación...');
        await fetch('https://seguridad-ciudadana-backend.onrender.com/enviar-notificacion-estado', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: report.email, newStatus }),
        });
      }

      // Crear y guardar notificación en Firestore para historial
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

      // Confirmación visual para el usuario (Toast + Alert)
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

  // Validación de datos del reporte - Verificar que existan datos válidos
  if (!report || typeof report !== 'object') {
    return (
      <AnimatedScreen>
        <View style={styles.container}>
          <Text style={styles.errorText}>Error: No se encontraron datos del reporte</Text>
        </View>
      </AnimatedScreen>
    );
  }

  // Debug: Verificar datos de ubicación
  console.log('🗺️ ReportDetailScreen - Datos de ubicación:', {
    hasLocation: !!report.location,
    latitude: report.location?.latitude,
    longitude: report.location?.longitude,
    latType: typeof report.location?.latitude,
    lngType: typeof report.location?.longitude
  });

  const isValidLocation =
    report.location &&
    typeof report.location?.latitude === 'number' &&
    typeof report.location?.longitude === 'number' &&
    !isNaN(report.location.latitude) &&
    !isNaN(report.location.longitude) &&
    report.location.latitude >= -90 &&
    report.location.latitude <= 90 &&
    report.location.longitude >= -180 &&
    report.location.longitude <= 180;

  console.log('🗺️ ReportDetailScreen - isValidLocation:', isValidLocation);

  const isValidImage =
    (typeof report.imageUri === 'string' && report.imageUri.length > 0) ||
    (typeof report.imageUrl === 'string' && report.imageUrl.length > 0) ||
    (typeof report.imageBase64 === 'string' && report.imageBase64.length > 0);

  // Debug logs para verificar datos
  console.log('🗺️ Debug ReportDetailScreen:');
  console.log('📍 report.location:', report.location);
  console.log('✅ isValidLocation:', isValidLocation);
  console.log('🖼️ isValidImage:', isValidImage);
  console.log('📱 Platform.OS:', Platform.OS);

  console.log('🌐 WebMap disponible:', !!WebMap);
  if (isValidLocation) {
    console.log('📍 Coordenadas válidas:', {
      lat: report.location.latitude,
      lng: report.location.longitude
    });
  }

  return (
    // Contenedor principal con animaciones de entrada
    <AnimatedScreen animationType="zoom" duration={600}>
      {/* Contenedor scrollable con padding inferior para botones flotantes */}
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Título principal con emoji y tipo de incidente */}
        <Text style={styles.title}>📌 {report.incidentType ?? 'Tipo desconocido'}</Text>
        {/* Fecha formateada del reporte */}
        <Text style={styles.date}>📅 {report.dateFormatted ?? 'Fecha no disponible'}</Text>

      {/* Tarjeta de estado actual del reporte */}
      <View style={styles.card}>
        <Text style={styles.label}>Estado actual:</Text>
        <Text style={styles.text}>{report.status ?? 'Pendiente'}</Text>
      </View>

      {/* Tarjeta de descripción detallada del incidente */}
      <View style={styles.card}>
        <Text style={styles.label}>Descripción:</Text>
        <Text style={styles.text}>{report.description ?? 'Sin descripción'}</Text>
      </View>

      {/* Sección de imagen del incidente */}
      <View style={styles.card}>
        <Text style={styles.label}>Imagen del Incidente:</Text>
        {isValidImage ? (
          <Image
            source={{ uri: report.imageUrl || report.imageBase64 || report.imageUri }}
            style={styles.image}
            onError={() => console.log('Error al cargar imagen')}
          />
        ) : (
          <View style={[styles.image, { justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0f0f0' }]}>
            <Text style={{ color: '#666', fontSize: 16 }}>📷 Imagen no disponible</Text>
          </View>
        )}
      </View>

      {/* Sección de mapa con ubicación del incidente */}
      <View style={styles.card}>
        <Text style={styles.label}>Ubicación del Incidente:</Text>

        <View style={{ position: 'relative', width: '100%', height: 250, marginTop: 10, borderRadius: 10, overflow: 'hidden' }}>
          {isValidLocation ? (
            Platform.OS === 'web' ? (
              <WebMap 
                latitude={report.location.latitude} 
                longitude={report.location.longitude}
                userLatitude={userLocation?.latitude}
                userLongitude={userLocation?.longitude}
              />
            ) : (
              <>
                <MapViewMobile
                  latitude={report.location.latitude}
                  longitude={report.location.longitude}
                />
                <TouchableOpacity style={styles.fabLocation} onPress={handleLocateMe}>
                  <Text style={styles.fabText}>📍</Text>
                </TouchableOpacity>
              </>
            )
          ) : (
            <View style={{ height: 250, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0f0f0', borderRadius: 10 }}>
              <Text style={{ color: '#666', fontSize: 16 }}>📍 Ubicación no disponible</Text>
            </View>
          )}
        </View>
      </View>

      {/* Sección de gestión de estado (solo para autoridades) */}
      {currentUserRole === 'autoridad' && (
        <View style={styles.card}>
          <Text style={styles.label}>Actualizar Estado:</Text>
          {/* Selector de estado con opciones predefinidas */}
          <Picker selectedValue={newStatus} onValueChange={setNewStatus}>
            <Picker.Item label="Pendiente" value="Pendiente" />
            <Picker.Item label="En proceso" value="En proceso" />
            <Picker.Item label="Resuelto" value="Resuelto" />
          </Picker>
          {/* Botón para confirmar actualización de estado */}
          <AnimatedButton
            title="Guardar Estado"
            onPress={handleUpdateStatus}
            style={styles.updateButton}
            animationType="highlight"
            icon="save-outline"
          />
        </View>
      )}

      {/* Botones de acción principales */}
      {/* Botón para compartir información del reporte */}
      <AnimatedButton
        title="Compartir Reporte"
        onPress={handleShare}
        style={styles.shareButton}
        animationType="scale"
        icon="share-social-outline"
      />

      {/* Botón para navegar al chat del reporte */}
      <AnimatedButton
        title="Ir al Chat"
        onPress={() => navigation.navigate('Chat', { reportId: report.id })}
        style={styles.chatButton}
        animationType="bounce"
        icon="chatbubble-outline"
      />
      </ScrollView>
    </AnimatedScreen>
  );
};

/**
 * Exportación del componente ReportDetailScreen
 * 
 * Pantalla principal para visualizar detalles completos de reportes de seguridad.
 * Proporciona una interfaz completa para:
 * 
 * Funcionalidades principales:
 * - Visualización detallada de información del reporte
 * - Mapa interactivo con ubicación del incidente
 * - Gestión de estados para usuarios autoridad
 * - Sistema de chat integrado para seguimiento
 * - Funcionalidad de compartir información
 * - Geolocalización del usuario actual
 * 
 * Casos de uso:
 * - Ciudadanos: Ver detalles y hacer seguimiento de sus reportes
 * - Autoridades: Gestionar y actualizar estado de reportes
 * - Ambos: Comunicarse a través del chat integrado
 * 
 * @module ReportDetailScreen
 * @category Screens
 * @subcategory Reports
 */
export default ReportDetailScreen;

/**
 * Objeto de estilos para ReportDetailScreen
 * 
 * Define la apariencia visual y layout del componente con:
 * - Diseño responsivo y moderno
 * - Esquema de colores consistente con la marca
 * - Animaciones y transiciones suaves
 * - Optimización para diferentes tamaños de pantalla
 * - Accesibilidad y usabilidad mejoradas
 * 
 * Categorías de estilos:
 * - Layout: Contenedores principales y estructura
 * - Tipografía: Textos, títulos y etiquetas
 * - Tarjetas: Componentes de información agrupada
 * - Botones: Elementos interactivos y de acción
 * - Mapa: Estilos específicos para componentes de ubicación
 * - Estados: Estilos para diferentes estados de la UI
 */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  errorText: {
    fontSize: 16,
    color: '#d32f2f',
    textAlign: 'center',
    fontWeight: '500',
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
