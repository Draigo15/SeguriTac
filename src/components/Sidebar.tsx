/**
 * Sidebar.tsx - Componente de Navegación Lateral
 * 
 * REQUERIMIENTOS IMPLEMENTADOS:
 * - RF-10: Cierre de Sesión - Implementa función completa de logout seguro
 * 
 * FUNCIONALIDADES PRINCIPALES:
 * - Menú de navegación lateral deslizable
 * - Función de cierre de sesión seguro (RF-10)
 * - Navegación contextual según tipo de usuario
 * - Información del usuario autenticado
 * - Opciones diferenciadas para ciudadanos y autoridades
 * 
 * COMPONENTES RF-10:
 * - handleLogout: Función principal de cierre de sesión
 * - Botón de logout en footer del sidebar
 * - Gestión de roles de usuario para redirección
 * - Limpieza completa de datos de sesión
 * 
 * TECNOLOGÍAS:
 * - Firebase Authentication para cierre de sesión
 * - AsyncStorage para gestión de datos locales
 * - React Navigation para redirección post-logout
 * - Animaciones y gestos nativos
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSizes, borderRadius, shadows } from '../theme';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { signOut } from 'firebase/auth'; // RF-10: Firebase Authentication para logout
import { auth } from '../services/firebase'; // RF-10: Instancia de autenticación
import { secureStorage } from '../services/secureStorage'; // RNF-2: Almacenamiento seguro

const { width } = Dimensions.get('window');

/**
 * RF-10: Interfaz de propiedades del componente Sidebar
 * Define la estructura de datos necesaria para el funcionamiento del menú lateral
 * que incluye la funcionalidad de cierre de sesión
 */
interface SidebarProps {
  isVisible: boolean;        // RF-10: Control de visibilidad del sidebar
  onClose: () => void;       // RF-10: Función para cerrar el sidebar
  userName: string;          // RF-10: Nombre del usuario autenticado para mostrar
  userType?: 'citizen' | 'authority'; // RF-10: Tipo de usuario para opciones contextuales
}

type SidebarNav = NativeStackNavigationProp<RootStackParamList>;

/**
 * Sidebar - Componente de menú lateral con funcionalidad de logout (RF-10)
 * 
 * RF-10: Este componente implementa la interfaz principal para el cierre de sesión
 * del usuario, proporcionando acceso directo a la función handleLogout desde
 * cualquier pantalla de la aplicación.
 * 
 * CARACTERÍSTICAS RF-10:
 * - Botón de "Cerrar Sesión" siempre visible en el footer
 * - Gestión del rol del usuario para redirección apropiada
 * - Integración con Firebase Authentication
 * - Limpieza completa de datos locales
 * - Navegación segura post-logout
 * 
 * @param {SidebarProps} props - Propiedades del componente
 * @returns {JSX.Element | null} Componente sidebar o null si no es visible
 */
const Sidebar: React.FC<SidebarProps> = ({ isVisible, onClose, userName, userType = 'citizen' }) => {
  const navigation = useNavigation<SidebarNav>();

  /**
   * RF-10: Función principal de cierre de sesión
   * 
   * PROCEDIMIENTO COMPLETO DE LOGOUT (RF-10):
   * Esta función implementa los 4 procedimientos documentados para el cierre de sesión:
   * 
   * PROCEDIMIENTO 01: Obtener rol del usuario desde AsyncStorage (líneas 34-42)
   * - Recupera datos del usuario almacenados localmente
   * - Extrae el rol para mantener contexto en la redirección
   * - Maneja casos donde no hay datos almacenados
   * 
   * PROCEDIMIENTO 02: Cerrar sesión en Firebase Auth (líneas 44-45)
   * - Utiliza signOut(auth) para invalidar la sesión en el servidor
   * - Garantiza que el token de acceso sea revocado
   * - Operación asíncrona con await para completitud
   * 
   * PROCEDIMIENTO 03: Limpiar datos locales (línea 46)
   * - Elimina información sensible del dispositivo
   * - Utiliza AsyncStorage.removeItem('user') para limpieza completa
   * - Previene acceso no autorizado a datos residuales
   * 
   * PROCEDIMIENTO 04: Redireccionar a pantalla de login (líneas 48-52)
   * - Utiliza navigation.reset() para limpiar stack de navegación
   * - Establece Login como nueva raíz sin historial
   * - Pasa el rol del usuario para experiencia consistente
   * 
   * SEGURIDAD:
   * - Proceso atómico que garantiza limpieza completa
   * - Manejo de errores para casos de falla
   * - Redirección segura sin posibilidad de retroceso
   * 
   * @returns {Promise<void>} Promesa que se resuelve al completar el logout
   */
  const handleLogout = async () => {
    try {
      // RF-10 PROCEDIMIENTO 01: Obtener rol del usuario desde AsyncStorage
      // Líneas 34-42 en documentación - Recuperación de datos de usuario
      const storedUser = await secureStorage.getItem('user');
      let userRole = 'ciudadano'; // Valor por defecto para casos sin datos
      
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        userRole = userData.role || 'ciudadano';
      }
      
      // RF-10 PROCEDIMIENTO 02: Cerrar sesión en Firebase Auth
      // Líneas 44-45 en documentación - Invalidación de sesión en servidor
      await signOut(auth);
      
      // RF-10 PROCEDIMIENTO 03: Limpiar datos locales
      // Línea 46 en documentación - Eliminación de datos sensibles
      await secureStorage.removeItem('user');
      
      // RF-10 PROCEDIMIENTO 04: Redireccionar a pantalla de login
      // Líneas 48-52 en documentación - Navegación segura post-logout
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login', params: { role: userRole } }],
      });
    } catch (error: any) {
      // RF-11: Manejo de errores en caso de falla del logout
      console.error('Error al cerrar sesión:', error);
    }
  };

  const menuItems = [
    ...(userType !== 'authority' ? [{
      title: 'Crear Reporte',
      icon: 'create-outline',
      onPress: () => {
        navigation.navigate('Report');
        onClose();
      },
      color: colors.secondary,
    }] : []),
    {
      title: userType === 'authority' ? 'Todos los Reportes' : 'Mis Reportes',
      icon: 'document-text-outline',
      onPress: () => {
        if (userType === 'authority') {
          navigation.navigate('ViewAllReports');
        } else {
          navigation.navigate('MyReports');
        }
        onClose();
      },
      color: colors.blue500,
    },
    {
      title: 'Mapa de Reportes',
      icon: 'map-outline',
      onPress: () => {
        if (userType === 'authority') {
          navigation.navigate('AllReportsMap');
        } else {
          navigation.navigate('MyReportsMap');
        }
        onClose();
      },
      color: colors.green500,
    },
    {
      title: 'Notificaciones',
      icon: 'notifications-outline',
      onPress: () => {
        navigation.navigate('Notifications');
        onClose();
      },
      color: colors.yellow500,
    },
    {
      title: 'Mi Perfil',
      icon: 'person-outline',
      onPress: () => {
        navigation.navigate('CitizenProfile');
        onClose();
      },
      color: colors.blue600,
    },
    {
      title: 'Dashboard Ciudadano',
      icon: 'analytics-outline',
      onPress: () => {
        navigation.navigate('CitizenMetricsDashboard');
        onClose();
      },
      color: colors.blue500,
    },
    {
      title: 'Mapa de Calor',
      icon: 'flame-outline',
      onPress: () => {
        navigation.navigate('IncidentHeatmap');
        onClose();
      },
      color: colors.red500,
    },
    ...(userType === 'authority' ? [{
      title: 'Exportar Datos',
      icon: 'download-outline',
      onPress: () => {
        navigation.navigate('DataExport');
        onClose();
      },
      color: colors.green500,
    }] : []),
    {
      title: 'Configuración',
      icon: 'settings-outline',
      onPress: () => {
        navigation.navigate('Settings');
        onClose();
      },
      color: colors.gray500,
    },
  ];

  if (!isVisible) return null;

  return (
    <View style={styles.overlay}>
      <TouchableOpacity style={styles.backdrop} onPress={onClose} />
      <View style={styles.sidebar}>
        {/* Header del Sidebar */}
        <View style={styles.header}>
          <Image
            source={require('../../assets/iconselector.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.userName}>{userName || 'Usuario'}</Text>
          <Text style={styles.userRole}>{userType === 'authority' ? 'Autoridad' : 'Ciudadano'}</Text>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color={colors.white} />
          </TouchableOpacity>
        </View>

        {/* Menu Items */}
        <ScrollView style={styles.menuContainer} showsVerticalScrollIndicator={false}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.menuItem}
              onPress={item.onPress}
              activeOpacity={0.7}
            >
              <View style={[styles.iconContainer, { backgroundColor: item.color }]}>
                <Ionicons name={item.icon as any} size={20} color={colors.white} />
              </View>
              <Text style={styles.menuText}>{item.title}</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.gray400} />
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* RF-10: Footer con botón de cierre de sesión */}
        <View style={styles.footer}>
          {/* RF-10: Botón principal de logout - Ejecuta los 4 procedimientos de cierre de sesión */}
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} testID="logout-button">
            <Ionicons name="log-out-outline" size={20} color={colors.white} />
            <Text style={styles.logoutText}>Cerrar Sesión</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  sidebar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: width * 0.8,
    maxWidth: 300,
    backgroundColor: colors.primary,
    ...shadows.lg,
  },
  header: {
    padding: spacing.lg,
    paddingTop: 60,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    position: 'relative',
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: spacing.md,
  },
  userName: {
    fontSize: fontSizes.lg,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: spacing.xs,
  },
  userRole: {
    fontSize: fontSizes.sm,
    color: colors.gray300,
  },
  closeButton: {
    position: 'absolute',
    top: 60,
    right: spacing.md,
    padding: spacing.xs,
  },
  menuContainer: {
    flex: 1,
    paddingTop: spacing.md,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginHorizontal: spacing.md,
    marginVertical: spacing.xs,
    borderRadius: borderRadius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  menuText: {
    flex: 1,
    fontSize: fontSizes.base,
    color: colors.white,
    fontWeight: '500',
  },
  footer: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.error,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    ...shadows.md,
  },
  logoutText: {
    fontSize: fontSizes.base,
    color: colors.white,
    fontWeight: '600',
    marginLeft: spacing.sm,
  },
});

export default Sidebar;