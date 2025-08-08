import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
  Vibration,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import AnimatedScreen from '../components/AnimatedScreen';
import Animated, { FadeIn, FadeOut, FlipInEasyX } from 'react-native-reanimated';
import { emergencyService } from '../services/emergencyService';

type EmergencyScreenNav = NativeStackNavigationProp<RootStackParamList, 'Emergency'>;

const EmergencyScreen = () => {
  const navigation = useNavigation<EmergencyScreenNav>();
  const [countdown, setCountdown] = useState(5);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [locationError, setLocationError] = useState('');

  // Efecto para la vibración de emergencia
  useEffect(() => {
    // Patrón de vibración SOS en código Morse: ... --- ...
    const vibrationPattern = [
      300, 200, 300, 200, 300, // S (3 cortos)
      500, // pausa entre letras
      500, 200, 500, 200, 500, // O (3 largos)
      500, // pausa entre letras
      300, 200, 300, 200, 300, // S (3 cortos)
    ];
    
    // Vibrar con el patrón SOS
    if (Platform.OS === 'android') {
      // Android puede usar patrones de vibración
      Vibration.vibrate(vibrationPattern, true);
    } else {
      // iOS tiene limitaciones, usamos vibración simple repetida
      const interval = setInterval(() => {
        Vibration.vibrate(500);
      }, 1000);
      return () => {
        clearInterval(interval);
        Vibration.cancel();
      };
    }

    return () => {
      // Detener la vibración al desmontar
      Vibration.cancel();
    };
  }, []);

  // Efecto para la cuenta regresiva
  useEffect(() => {
    if (countdown > 0 && !sent) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0 && !sent) {
      handleSendEmergency();
    }
  }, [countdown, sent]);

  // Obtener ubicación actual
  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationError('Permiso de ubicación denegado');
        return;
      }

      try {
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        setLocation(location);
      } catch (error) {
        setLocationError('No se pudo obtener la ubicación');
        console.error('Error de ubicación:', error);
      }
    })();
  }, []);

  const handleSendEmergency = async () => {
    if (sending || sent) return;
    
    setSending(true);
    
    try {
      // Usar el servicio de emergencia para enviar la alerta
      const emergencyId = await emergencyService.sendEmergencyAlert();
      console.log('Alerta de emergencia enviada con ID:', emergencyId);

      // Enviar notificación local al usuario
      await emergencyService.sendLocalNotification(
        '🚨 Alerta de Emergencia Enviada',
        'Las autoridades han sido notificadas. Mantén la calma.',
        { reportId: emergencyId }
      );

      setSent(true);
      setSending(false);

      // Detener la vibración cuando se envía la alerta
      Vibration.cancel();

      // Esperar 3 segundos y luego navegar al Home
      setTimeout(() => {
        navigation.navigate('Home');
      }, 3000);

    } catch (error) {
      console.error('Error al enviar alerta de emergencia:', error);
      Alert.alert('Error', 'No se pudo enviar la alerta de emergencia. Intenta nuevamente.');
      setSending(false);
    }
  };

  const handleCancel = () => {
    // Detener la vibración
    Vibration.cancel();
    // Volver al Home
    navigation.navigate('Home');
  };

  return (
    <AnimatedScreen animationType="fade" duration={300}>
      <View style={styles.container}>
        {!sent ? (
          <>
            <Animated.View entering={FadeIn.duration(500)} style={styles.warningContainer}>
              <Ionicons name="warning-outline" size={80} color="#fff" />
              <Text style={styles.title}>MODO DE EMERGENCIA</Text>
              <Text style={styles.subtitle}>
                Enviando alerta en {countdown} segundos
              </Text>
              {locationError ? (
                <Text style={styles.errorText}>{locationError}</Text>
              ) : location ? (
                <Text style={styles.locationText}>Ubicación obtenida ✓</Text>
              ) : (
                <Text style={styles.locationText}>Obteniendo ubicación...</Text>
              )}
            </Animated.View>

            <Animated.View entering={FadeIn.delay(300).duration(500)} style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleCancel}
                disabled={sending}
              >
                <Text style={styles.cancelButtonText}>CANCELAR</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.sendNowButton}
                onPress={handleSendEmergency}
                disabled={sending}
              >
                <Text style={styles.sendNowButtonText}>
                  {sending ? 'ENVIANDO...' : 'ENVIAR AHORA'}
                </Text>
                {sending && <ActivityIndicator color="#fff" style={{ marginLeft: 10 }} />}
              </TouchableOpacity>
            </Animated.View>
          </>
        ) : (
          <Animated.View entering={FlipInEasyX.duration(800)} style={styles.successContainer}>
            <Ionicons name="checkmark-circle-outline" size={100} color="#4CAF50" />
            <Text style={styles.successTitle}>ALERTA ENVIADA</Text>
            <Text style={styles.successText}>
              Las autoridades han sido notificadas y están en camino.
            </Text>
          </Animated.View>
        )}
      </View>
    </AnimatedScreen>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#D32F2F',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  warningContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 20,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: '#fff',
    marginTop: 10,
    textAlign: 'center',
  },
  locationText: {
    fontSize: 16,
    color: '#fff',
    marginTop: 20,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#FFEB3B',
    marginTop: 20,
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 40,
    width: '100%',
  },
  cancelButton: {
    backgroundColor: '#fff',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 30,
    marginBottom: 20,
    width: '80%',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#D32F2F',
    fontSize: 18,
    fontWeight: 'bold',
  },
  sendNowButton: {
    backgroundColor: '#B71C1C',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 30,
    width: '80%',
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  sendNowButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  successContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    padding: 30,
    borderRadius: 20,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginTop: 20,
    textAlign: 'center',
  },
  successText: {
    fontSize: 16,
    color: '#333',
    marginTop: 10,
    textAlign: 'center',
  },
});

export default EmergencyScreen;