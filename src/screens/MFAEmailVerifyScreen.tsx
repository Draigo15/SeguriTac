import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, TextInput, Button } from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import AnimatedScreen from '../components/AnimatedScreen';
import { colors, spacing } from '../theme';
import { sendOtp as sendEmailOtp, verifyOtp as verifyEmailOtp } from '../services/authBackend';
import { RootStackParamList } from '../navigation/types';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';

 type MFANav = NativeStackNavigationProp<RootStackParamList, 'MFAEmailVerify'>;
 type MFARoute = RouteProp<RootStackParamList, 'MFAEmailVerify'>;

const MFAEmailVerifyScreen: React.FC = () => {
  const navigation = useNavigation<MFANav>();
  const route = useRoute<MFARoute>();
  const { email, role } = route.params;

  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [devHint, setDevHint] = useState<string | undefined>(undefined);
  const [resendCooldown, setResendCooldown] = useState<number>(30);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      const res = await sendEmailOtp(email);
      setLoading(false);
      if (!res.success) {
        Toast.show({ type: 'error', text1: 'Error', text2: res.error || 'No se pudo enviar el código' });
        return;
      }
      if (res.devHint) {
        // Solo en modo desarrollo: ayuda para probar sin SMTP
        setDevHint(res.devHint);
      }
      Toast.show({ type: 'info', text1: 'Código enviado', text2: 'Revisa tu correo para el OTP' });
    };
    init();
    // Iniciar temporizador para reenvío
    setResendCooldown(30);
    const interval = setInterval(() => {
      setResendCooldown(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [email]);

  const handleVerify = async () => {
    if (!code || code.length < 4) {
      Toast.show({ type: 'warning', text1: 'Código requerido', text2: 'Ingresa el código recibido por email' });
      return;
    }
    setLoading(true);
    const res = await verifyEmailOtp(email, code);
    setLoading(false);
    if (!res.success) {
      Toast.show({ type: 'error', text1: 'Verificación fallida', text2: res.error || 'Código incorrecto' });
      return;
    }
    Toast.show({ type: 'success', text1: 'Verificación exitosa', text2: 'Autenticación completada' });
    setTimeout(() => {
      if (role === 'autoridad') {
        navigation.navigate('AuthorityDashboard');
      } else {
        navigation.navigate('Home');
      }
    }, 500);
  };

  const resend = async () => {
    if (resendCooldown > 0) return;
    setLoading(true);
    const res = await sendEmailOtp(email);
    setLoading(false);
    if (!res.success) {
      Toast.show({ type: 'error', text1: 'Error', text2: res.error || 'No se pudo reenviar el código' });
      return;
    }
    setDevHint(res.devHint);
    Toast.show({ type: 'info', text1: 'Código reenviado', text2: 'Revisa tu correo nuevamente' });
    setResendCooldown(30);
  };

  return (
    <AnimatedScreen animationType="fade" duration={500}>
      <View style={styles.container}>
        <Text variant="titleLarge" style={styles.title}>Verificación en dos pasos</Text>
        <Text variant="bodyMedium" style={styles.subtitle}>Hemos enviado un código a {email}</Text>
        {devHint ? (
          <Text variant="bodySmall" style={styles.hint}>DEV: Código = {devHint}</Text>
        ) : null}

        <TextInput
          label="Código de 6 dígitos"
          value={code}
          onChangeText={setCode}
          keyboardType="numeric"
          maxLength={6}
          style={styles.input}
          mode="outlined"
        />

        <Button mode="contained" onPress={handleVerify} loading={loading} disabled={loading || code.length < 6} style={styles.button}
        >
          Verificar código
        </Button>
        <Button mode="text" onPress={resend} disabled={loading || resendCooldown > 0}>
          {resendCooldown > 0 ? `Reenviar en ${resendCooldown}s` : 'Reenviar código'}
        </Button>
      </View>
    </AnimatedScreen>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.lg,
    justifyContent: 'center',
  },
  title: {
    marginBottom: spacing.md,
    color: colors.text,
  },
  subtitle: {
    marginBottom: spacing.md,
  },
  hint: {
    marginBottom: spacing.sm,
    color: '#888',
  },
  input: {
    marginBottom: spacing.md,
    textAlign: 'center',
    fontSize: 20,
    letterSpacing: 6,
  },
  button: {
    marginBottom: spacing.sm,
  },
});

export default MFAEmailVerifyScreen;