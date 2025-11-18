/**
 * HomeScreen.tsx - Pantalla Principal del Ciudadano
 * 
 * REQUERIMIENTOS IMPLEMENTADOS:
 * - RF-10: Cierre de Sesión - Permite al usuario cerrar sesión de forma segura
 * - RF-11: Confirmación y Mensajes de Retroalimentación - Muestra mensajes de error/confirmación
 * 
 * FUNCIONALIDADES:
 * - Dashboard principal con estadísticas del usuario
 * - Acciones rápidas para navegación
 * - Función de logout seguro con limpieza de sesión
 * - Sidebar con opciones de navegación
 * - Notificaciones en tiempo real
 * 
 * TECNOLOGÍAS:
 * - Firebase Authentication para gestión de sesión
 * - AsyncStorage para almacenamiento local
 * - React Navigation para navegación
 * - Componentes animados personalizados
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Image,
  ScrollView,
  Dimensions,
} from 'react-native';

// Importaciones del tema y estilos
import { 
  colors, 
  spacing, 
  fontSizes, 
  borderRadius, 
  shadows,
  commonContainers,
  commonTexts,
  commonButtons,
  commonImages,
  commonLayouts
} from '../theme';

// Componentes personalizados
import AnimatedScreen from '../components/AnimatedScreen';
import AnimatedButton from '../components/AnimatedButton';
import EmergencyButton from '../components/EmergencyButton';
import Sidebar from '../components/Sidebar'; // RF-10: Contiene opción de logout
import InfoCard from '../components/InfoCard';
import QuickActionCard from '../components/QuickActionCard';

// Navegación y hooks
import { useFocusEffect, useNavigation } from '@react-navigation/native';

// Firebase - RF-10: Autenticación y cierre de sesión
import { signOut } from 'firebase/auth';
import { auth, db } from '../services/firebase';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';

// Tipos de navegación
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';

// Iconos y almacenamiento
import { Ionicons } from '@expo/vector-icons';
import { secureStorage } from '../services/secureStorage'; // RNF-2: Almacenamiento seguro

const { width } = Dimensions.get('window');

type HomeScreenNav = NativeStackNavigationProp<RootStackParamList, 'Home'>;

/**
 * HomeScreen - Componente principal del dashboard ciudadano
 * 
 * RF-10: Pantalla principal desde donde el usuario puede acceder al cierre de sesión
 * a través del sidebar. Gestiona el estado de la sesión del usuario.
 * 
 * ESTADOS GESTIONADOS:
 * - sidebarVisible: Control del sidebar que contiene la opción de logout (RF-10)
 * - userName: Nombre del usuario autenticado
 * - hasNewNotifications: Indicador de notificaciones nuevas
 * - userStats: Estadísticas personales del usuario
 */
const HomeScreen = () => {
  const navigation = useNavigation<HomeScreenNav>();
  const [sidebarVisible, setSidebarVisible] = useState(false); // RF-10: Control del sidebar con logout
  const [userName, setUserName] = useState<string>(''); // RF-10: Datos del usuario autenticado
  const [hasNewNotifications, setHasNewNotifications] = useState(false); // RF-11: Indicador visual
  const [userStats, setUserStats] = useState({
    totalReports: 0,
    pendingReports: 0,
    resolvedReports: 0,
  }); // Estadísticas del usuario logueado

  useFocusEffect(
    useCallback(() => {
      const fetchUserData = async () => {
        const currentUser = auth.currentUser;
        if (currentUser) {
          try {
            const docRef = doc(db, 'users', currentUser.uid);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
              const data = docSnap.data();
              const fullName = `${data.firstName} ${data.lastName}`;
              setUserName(fullName);
            }
          } catch (error: any) {
            console.error('Error al traer datos del usuario:', error);
          }
        }
      };

      const checkNotifications = async () => {
        const currentUser = auth.currentUser;
        if (!currentUser?.email) return;

        try {
          const docRef = doc(db, 'user_notifications', currentUser.email);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            setHasNewNotifications(data.hasUnread || false);
          }
        } catch (error: any) {
          console.error('Error al verificar notificaciones:', error);
        }
      };

      const fetchUserStats = async () => {
        const currentUser = auth.currentUser;
        if (!currentUser?.email) return;

        try {
          const reportsRef = collection(db, 'reports');
          const userReportsQuery = query(reportsRef, where('email', '==', currentUser.email));
          const querySnapshot = await getDocs(userReportsQuery);
          
          let total = 0;
          let pending = 0;
          let resolved = 0;
          
          querySnapshot.forEach((doc) => {
            const data = doc.data();
            total++;
            if (data.status === 'Pendiente' || data.status === 'En Proceso') {
              pending++;
            } else if (data.status === 'Resuelto') {
              resolved++;
            }
          });
          
          setUserStats({
            totalReports: total,
            pendingReports: pending,
            resolvedReports: resolved,
          });
        } catch (error: any) {
          console.error('Error al obtener estadísticas:', error);
        }
      };

      fetchUserData();
      checkNotifications();
      fetchUserStats();
    }, [])
  );

/**
 * handleLogout - Función principal de cierre de sesión (RF-10)
 * 
 * RF-10: Implementa el cierre de sesión completo del usuario, invalidando
 * la sesión en Firebase Authentication y limpiando datos locales.
 * 
 * PROCESO DE LOGOUT:
 * 1. Recupera el rol del usuario para mantener contexto
 * 2. Cierra sesión en Firebase Authentication
 * 3. Limpia datos locales de AsyncStorage
 * 4. Redirige a pantalla de login con rol preservado
 * 5. Muestra mensaje de error si falla (RF-11)
 * 
 * SEGURIDAD:
 * - Invalidación completa de sesión
 * - Limpieza de datos sensibles locales
 * - Redirección segura sin historial
 */
const handleLogout = async () => {
  try {
    // RF-10: Obtener el rol del usuario actual desde AsyncStorage para preservar contexto
    const storedUser = await secureStorage.getItem('user');
    let userRole = 'ciudadano'; // Valor por defecto
    
    if (storedUser) {
      const userData = JSON.parse(storedUser);
      userRole = userData.role || 'ciudadano';
    }
    
    // RF-10: Cerrar sesión en Firebase Authentication (invalidar token)
    await signOut(auth);
    
    // RF-10: Limpiar datos locales del usuario
    await secureStorage.removeItem('user');
    
    // RF-10: Redirigir a login sin historial de navegación (reset completo)
    navigation.reset({
      index: 0,
      routes: [{ name: 'Login', params: { role: userRole } }],
    });
  } catch (error: any) {
    // RF-11: Mensaje de error si falla el cierre de sesión
    Alert.alert('Error', 'No se pudo cerrar sesión.');
  }
};

  return (
    <AnimatedScreen animationType="fade" duration={500}>
      <View style={styles.container}>
        {/* Header - RF-10: Contiene acceso al menú con opción de logout */}
        <View style={styles.header}>
          {/* RF-10: Botón de menú que abre sidebar con opción de cierre de sesión */}
          <TouchableOpacity 
            style={styles.menuButton} 
            onPress={() => setSidebarVisible(true)}
            testID="open-sidebar"
          >
            <Ionicons name="menu" size={28} color={colors.white} />
          </TouchableOpacity>
          
          {/* RF-10: Información del usuario autenticado */}
          <View style={styles.headerCenter}>
            <Text style={styles.greeting}>{userName || 'Usuario'}</Text>
            <Text style={styles.subtitle}>¿Cómo podemos ayudarte hoy?</Text>
          </View>
          
          {/* RF-11: Botón de notificaciones con indicador visual */}
          <TouchableOpacity 
            style={styles.notificationButton}
            onPress={() => navigation.navigate('Notifications')}
          >
            <Ionicons name="notifications-outline" size={28} color={colors.white} />
            {hasNewNotifications && <View style={styles.notificationDot} />}
          </TouchableOpacity>
        </View>

        <ScrollView 
          style={styles.content}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Stats Cards */}
          <View style={styles.statsSection}>
            <Text style={styles.sectionTitle}>Mis Estadísticas</Text>
            <View style={styles.statsGrid}>
              <InfoCard
                title="Total de Reportes"
                value={userStats.totalReports}
                icon="document-text"
                color={colors.secondary}
                onPress={() => navigation.navigate('MyReports')}
              />
              <InfoCard
                title="Reportes Pendientes"
                value={userStats.pendingReports}
                icon="time"
                color={colors.yellow500}
                onPress={() => navigation.navigate('MyReports')}
              />
              <InfoCard
                title="Reportes Resueltos"
                value={userStats.resolvedReports}
                icon="checkmark-circle"
                color={colors.green500}
                onPress={() => navigation.navigate('MyReports')}
              />
            </View>
          </View>

          {/* Quick Actions */}
          <View style={styles.actionsSection}>
            <Text style={styles.sectionTitle}>Acciones Rápidas</Text>
            <View style={styles.actionsGrid}>
              <QuickActionCard
                title="Crear Reporte"
                icon="create"
                color={colors.secondary}
                onPress={() => navigation.navigate('Report')}
                description="Reporta un incidente"
              />
              <QuickActionCard
                title="Ver Mapa"
                icon="map"
                color={colors.green500}
                onPress={() => navigation.navigate('MyReportsMap')}
                description="Mapa de reportes"
              />
            </View>
          </View>

          {/* Recent Activity */}
          <View style={styles.recentSection}>
            <Text style={styles.sectionTitle}>Acceso Rápido</Text>
            <AnimatedButton
              title="Ver Mis Reportes"
              onPress={() => navigation.navigate('MyReports')}
              style={styles.actionButton}
               disableAndroidShadow
              animationType="scale"
              icon="document-text-outline"
            />
            <AnimatedButton
              title="Asistente Virtual IA"
              onPress={() => navigation.navigate('IntelligentChatbot')}
              style={[styles.actionButton, styles.chatbotButton]}
              animationType="scale"
              icon="chatbubble-ellipses-outline"
            />
            <AnimatedButton
              title="Editar Perfil"
              onPress={() => navigation.navigate('CitizenProfile')}
              style={styles.actionButton}
              animationType="highlight"
              icon="person-outline"
            />
          </View>
        </ScrollView>

        {/* Emergency Button */}
        <View style={styles.emergencyContainer}>
          <EmergencyButton />
        </View>

        {/* RF-10: Sidebar con opción de cierre de sesión */}
        <Sidebar
          isVisible={sidebarVisible} // RF-10: Control de visibilidad del menú
          onClose={() => setSidebarVisible(false)} // RF-10: Función para cerrar sidebar
          userName={userName} // RF-10: Nombre del usuario autenticado
          userType="citizen" // RF-10: Tipo de usuario para mostrar opciones apropiadas
        />
      </View>
    </AnimatedScreen>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: colors.primary,
    ...shadows.sm,
  },
  menuButton: {
    padding: spacing.xs,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  greeting: {
    fontSize: fontSizes.lg,
    fontWeight: 'bold',
    color: colors.white,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: fontSizes.sm,
    color: colors.gray300,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  notificationButton: {
    padding: spacing.xs,
    position: 'relative',
  },
  notificationDot: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.error,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 100, // Space for emergency button
  },
  statsSection: {
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: fontSizes.lg,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: spacing.md,
  },
  statsGrid: {
    gap: spacing.sm,
  },
  actionsSection: {
    marginBottom: spacing.lg,
  },
  actionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  recentSection: {
    marginBottom: spacing.lg,
  },
  actionButton: {
    marginBottom: spacing.md,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 0,
    borderColor: 'transparent',
  },
  chatbotButton: {
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(76, 175, 80, 0.3)',
  },
  emergencyContainer: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    zIndex: 100,
  },
});
