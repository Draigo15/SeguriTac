import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
  Vibration,
  Platform,
  Dimensions,
} from 'react-native';
import { 
  colors, 
  spacing, 
  fontSizes,
  commonContainers,
  commonTexts,
  commonButtons,
  borderRadius,
  shadows
} from '../theme';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { Ionicons } from '@expo/vector-icons';
import AnimatedScreen from '../components/AnimatedScreen';
import Animated, { FadeIn, FadeOut, FlipInEasyX, FadeInDown, FadeInUp, useSharedValue, useAnimatedStyle, withRepeat, withTiming } from 'react-native-reanimated';
import { emergencyService } from '../services/emergencyService';
import { useLocation } from '../hooks/useLocation';
import type { NavigationProp } from '@react-navigation/native';

type EmergencyScreenNav = NativeStackNavigationProp<RootStackParamList, 'Emergency'>;

const EmergencyScreen = () => {
  const navigation = useNavigation<NavigationProp<any>>();
  const [countdown, setCountdown] = useState(5);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  
  // Hook optimizado de ubicación
  const { 
    location, 
    loading: locationLoading,
    error: locationError,
    hasPermission,
    getCurrentLocation 
  } = useLocation({ 
    enableHighAccuracy: true,
    requestPermissionOnMount: true 
  });

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

  // Verificar permisos de ubicación al montar
  useEffect(() => {
    if (!hasPermission) {
      Alert.alert(
        'Permisos requeridos',
        'Para enviar alertas de emergencia necesitamos acceso a tu ubicación.',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Permitir', onPress: () => getCurrentLocation() }
        ]
      );
    }
  }, [hasPermission, getCurrentLocation]);

  const handleSendEmergency = useCallback(async () => {
    if (sending || sent) return;
    
    if (!location) {
      Alert.alert('Error', 'No se pudo obtener tu ubicación');
      return;
    }
    
    setSending(true);
    
    try {
      // Usar el servicio de emergencia para enviar la alerta
      const emergencyId = await emergencyService.sendEmergencyAlert(
        'ALERTA DE EMERGENCIA - Solicitud de ayuda inmediata'
      );
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

    } catch (error: any) {
      console.error('Error al enviar alerta de emergencia:', error);
      Alert.alert('Error', 'No se pudo enviar la alerta de emergencia. Intenta nuevamente.');
      setSending(false);
    }
  }, [sending, sent, location, navigation]);

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
                <Text style={styles.locationText}>
                  📍 Ubicación: {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
                  {location.accuracy && (
                    <Text style={styles.accuracyText}>
                      {' '}(±{Math.round(location.accuracy)}m)
                    </Text>
                  )}
                </Text>
              ) : locationLoading ? (
                <View style={styles.locationLoading}>
                  <ActivityIndicator size="small" color={colors.white} />
                  <Text style={styles.locationText}>Obteniendo ubicación...</Text>
                </View>
              ) : (
                <TouchableOpacity 
                  style={styles.retryLocationButton} 
                  onPress={getCurrentLocation}
                >
                  <Ionicons name="location" size={16} color={colors.white} />
                  <Text style={styles.retryLocationText}>Obtener ubicación</Text>
                </TouchableOpacity>
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
    backgroundColor: colors.error,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  warningContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: fontSizes.xxl,
    fontWeight: 'bold',
    color: colors.white,
    marginTop: spacing.lg,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: fontSizes.lg,
    color: colors.white,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  locationText: {
    fontSize: fontSizes.base,
    color: colors.white,
    marginTop: spacing.lg,
    textAlign: 'center',
  },
  locationLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.lg,
  },
  accuracyText: {
    fontSize: fontSizes.sm,
    color: colors.white,
    opacity: 0.8,
  },
  retryLocationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    marginTop: spacing.lg,
  },
  retryLocationText: {
    fontSize: fontSizes.base,
    color: colors.white,
    marginLeft: spacing.xs,
    fontWeight: '500',
  },
  errorText: {
    fontSize: fontSizes.base,
    color: colors.warning,
    marginTop: spacing.lg,
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.xxl,
    width: '100%',
  },
  cancelButton: {
    backgroundColor: colors.white,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: 30,
    marginBottom: spacing.lg,
    width: '80%',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: colors.error,
    fontSize: fontSizes.lg,
    fontWeight: 'bold',
  },
  sendNowButton: {
    backgroundColor: '#B71C1C',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: 30,
    width: '80%',
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  sendNowButtonText: {
    color: colors.white,
    fontSize: fontSizes.lg,
    fontWeight: 'bold',
  },
  successContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    padding: spacing.xl,
    borderRadius: 20,
  },
  successTitle: {
    fontSize: fontSizes.xl,
    fontWeight: 'bold',
    color: colors.success,
    marginTop: spacing.lg,
    textAlign: 'center',
  },
  successText: {
    fontSize: fontSizes.base,
    color: colors.gray600,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
});

export default EmergencyScreen;