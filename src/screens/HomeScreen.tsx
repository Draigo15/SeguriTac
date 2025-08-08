import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native';
import AnimatedScreen from '../components/AnimatedScreen';
import AnimatedButton from '../components/AnimatedButton';
import EmergencyButton from '../components/EmergencyButton';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { signOut } from 'firebase/auth';
import { auth, db } from '../services/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { Ionicons } from '@expo/vector-icons';

type HomeScreenNav = NativeStackNavigationProp<RootStackParamList, 'Home'>;

const HomeScreen = () => {
  const navigation = useNavigation<HomeScreenNav>();
  const [userName, setUserName] = useState('');
  const [hasNewNotifications, setHasNewNotifications] = useState(false);

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
          } catch (error) {
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
        } catch (error) {
          console.error('Error al verificar notificaciones:', error);
        }
      };

      fetchUserData();
      checkNotifications();
    }, [])
  );

const handleLogout = async () => {
  try {
    await signOut(auth);
    navigation.reset({
      index: 0,
      routes: [{ name: 'Login', params: { role: 'ciudadano' } }],
    });
  } catch (error) {
    Alert.alert('Error', 'No se pudo cerrar sesión.');
  }
};

  return (
    <AnimatedScreen animationType="fade" duration={500}>
      <View style={styles.container}>
        {/* Encabezado con ícono de notificaciones */}
        <View style={styles.header}>
          <Text style={styles.headerText}>Hola, {userName || 'Usuario'} 👋</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Notifications')}>
            <Ionicons name="notifications-outline" size={28} color="#fff" />
            {hasNewNotifications && <View style={styles.redDot} />}
          </TouchableOpacity>
        </View>
        
        {/* Botón de emergencia */}
        <View style={styles.emergencyButtonContainer}>
          <EmergencyButton />
        </View>

        {/* Logo */}
        <Image
          source={require('../../assets/iconselector.png')}
          style={styles.logo}
          resizeMode="contain"
        />

        {/* Botones de navegación con animaciones */}
        <AnimatedButton
          title="📝 Crear Nuevo Reporte"
          onPress={() => navigation.navigate('Report')}
          style={styles.button}
          animationType="scale"
          icon="create-outline"
        />

        <AnimatedButton
          title="📄 Ver Mis Reportes"
          onPress={() => navigation.navigate('MyReports')}
          style={styles.button}
          animationType="bounce"
          icon="document-text-outline"
        />

        <AnimatedButton
          title="👤 Editar Perfil"
          onPress={() => navigation.navigate('CitizenProfile')}
          style={styles.button}
          animationType="highlight"
          icon="person-outline"
        />

        <AnimatedButton
          title="🚪 Cerrar Sesión"
          onPress={handleLogout}
          style={styles.logoutButton}
          animationType="scale"
          icon="log-out-outline"
        />
      </View>
    </AnimatedScreen>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#002B7F',
    paddingTop: 60,
    paddingHorizontal: 30,
    alignItems: 'center',
  },
  emergencyButtonContainer: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    zIndex: 100,
  },
  header: {
    position: 'absolute',
    top: 50,
    left: 30,
    right: 30,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerText: {
    fontSize: 18,
    color: '#fff',
    fontWeight: '600',
  },
  redDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: 'red',
    borderRadius: 8,
    width: 10,
    height: 10,
  },
  logo: {
    width: 220,
    height: 220,
    marginTop: 80,
    marginBottom: 20,
  },
  button: {
    marginBottom: 18,
    width: '100%',
  },
  logoutButton: {
    backgroundColor: '#e53935',
    marginTop: 10,
    width: '100%',
  },
  buttonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.97 }],
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
