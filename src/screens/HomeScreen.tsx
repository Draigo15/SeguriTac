import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Image,
  Pressable,
} from 'react-native';
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
    <View style={styles.container}>
      {/* Encabezado con ícono de notificaciones */}
      <View style={styles.header}>
        <Text style={styles.headerText}>Hola, {userName || 'Usuario'} 👋</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Notifications')}>
          <Ionicons name="notifications-outline" size={28} color="#fff" />
          {hasNewNotifications && <View style={styles.redDot} />}
        </TouchableOpacity>
      </View>

      {/* Logo */}
      <Image
        source={require('../../assets/iconselector.png')}
        style={styles.logo}
        resizeMode="contain"
      />

      {/* Botones de navegación */}
      <Pressable style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]} onPress={() => navigation.navigate('Report')}>
        <Text style={styles.buttonText}>📝 Crear Nuevo Reporte</Text>
      </Pressable>

      <Pressable style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]} onPress={() => navigation.navigate('MyReports')}>
        <Text style={styles.buttonText}>📄 Ver Mis Reportes</Text>
      </Pressable>

      <Pressable style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]} onPress={() => navigation.navigate('CitizenProfile')}>
        <Text style={styles.buttonText}>👤 Editar Perfil</Text>
      </Pressable>

      <Pressable style={({ pressed }) => [styles.logoutButton, pressed && styles.buttonPressed]} onPress={handleLogout}>
        <Text style={styles.buttonText}>🚪 Cerrar Sesión</Text>
      </Pressable>
    </View>
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
    backgroundColor: '#0055CC',
    paddingVertical: 14,
    paddingHorizontal: 25,
    borderRadius: 12,
    marginBottom: 18,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 4,
    elevation: 5,
  },
  logoutButton: {
    backgroundColor: '#e53935',
    paddingVertical: 14,
    paddingHorizontal: 25,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 4,
    elevation: 5,
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
