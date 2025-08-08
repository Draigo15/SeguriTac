import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Alert,
} from 'react-native';
import AnimatedScreen from '../components/AnimatedScreen';
import AnimatedButton from '../components/AnimatedButton';

import { TouchableOpacity } from 'react-native-gesture-handler';
import { useNavigation } from '@react-navigation/native';
import { signOut } from 'firebase/auth';
import { auth } from '../services/firebase';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { colors, fontSizes, spacing } from '../theme';
import Ionicons from 'react-native-vector-icons/Ionicons';

type AuthorityDashboardNav = NativeStackNavigationProp<RootStackParamList, 'AuthorityDashboard'>;

const AuthorityDashboardScreen = () => {
  const navigation = useNavigation<AuthorityDashboardNav>();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login', params: { role: 'autoridad' } }],
      });
    } catch (error) {
      Alert.alert('Error', 'No se pudo cerrar sesión.');
    }
  };

  return (
    <AnimatedScreen animationType="zoom" duration={600}>
      <View style={styles.container}>

        {/* Logo y título */}
        <Image
          source={require('../../assets/iconselector.png')}
          style={styles.logo}
          resizeMode="contain"
        />

        <Text style={styles.title}>Panel de Autoridad</Text>

        {/* Botones con animaciones */}
        <AnimatedButton
          title="Ver Todos los Reportes"
          onPress={() => navigation.navigate('ViewAllReports')}
          style={styles.button}
          animationType="scale"
          icon="document-text-outline"
        />

        <AnimatedButton
          title="Ver Mapa de Reportes"
          onPress={() => navigation.navigate('AllReportsMap')}
          style={styles.button}
          animationType="bounce"
          icon="map-outline"
        />

        <AnimatedButton
          title="Ver Estadísticas"
          onPress={() => navigation.navigate('ReportStats')}
          style={styles.button}
          animationType="highlight"
          icon="bar-chart-outline"
        />

        <AnimatedButton
          title="Alertas de Emergencia"
          onPress={() => navigation.navigate('EmergencyAlerts')}
          style={styles.button}
          animationType="bounce"
          icon="warning-outline"
        />

        {/* Cerrar sesión */}
        <AnimatedButton
          title="Cerrar Sesión"
          onPress={handleLogout}
          style={[styles.button, styles.logoutButton]}
          animationType="scale"
          icon="log-out-outline"
        />
      </View>
    </AnimatedScreen>
  );
};

export default AuthorityDashboardScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#002B7F',
    paddingHorizontal: spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },

  logo: {
    width: 220,
    height: 220,
    marginBottom: spacing.md,
  },
  title: {
    fontSize: fontSizes.xl,
    fontWeight: 'bold',
    color: colors.white,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#005BEA',
    paddingVertical: 14,
    paddingHorizontal: 25,
    borderRadius: 12,
    marginBottom: spacing.md,
    width: '100%',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 4,
    elevation: 5,
  },
  logoutButton: {
    backgroundColor: '#e53935',
  },
  buttonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.97 }],
  },
  buttonText: {
    color: '#fff',
    fontSize: fontSizes.base,
    fontWeight: 'bold',
  },
  icon: {
    marginRight: 10,
  },
});
