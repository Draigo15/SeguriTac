import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useNavigation, NavigationProp, ParamListBase } from '@react-navigation/native';
import { auth } from '../services/firebase';
import { signOut } from '../services/auth';

type User = {
  email: string;
  displayName?: string | null;
};

const ProfileScreen: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const navigation = useNavigation<NavigationProp<ParamListBase>>();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const current = auth?.currentUser;
        const userData: User | null = current
          ? { email: current.email ?? '', displayName: current.displayName ?? null }
          : { email: 'test@example.com', displayName: 'Usuario Test' };
        setUser(userData);
      } catch (error) {
        console.error('Error al obtener datos del usuario:', error);
      }
    };

    fetchUserData();
  }, []);

  const performLogout = async () => {
    try {
      await signOut();
      Alert.alert('Éxito', 'Has cerrado sesión correctamente');
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    } catch (error) {
      Alert.alert('Error', 'No se pudo cerrar sesión');
      console.error('Error al cerrar sesión:', error);
    }
  };

  const confirmAndLogout = () => {
    Alert.alert(
      'Confirmación',
      '¿Deseas cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Cerrar sesión', onPress: () => { performLogout(); } },
      ]
    );
  };

  if (!user) {
    return (
      <View style={styles.container}>
        <Text>Cargando información del usuario...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.userInfoContainer}>
        <Text style={styles.userName} testID="user-email">{user.email}</Text>
        <Text style={styles.userEmail}>{user.displayName}</Text>
      </View>

      <TouchableOpacity 
        style={styles.logoutButton}
        onPress={confirmAndLogout}
        testID="logout-button"
      >
        <Text style={styles.logoutButtonText}>Cerrar Sesión</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  userInfoContainer: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  userEmail: {
    fontSize: 16,
    color: '#666',
  },
  logoutButton: {
    backgroundColor: '#e74c3c',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default ProfileScreen;