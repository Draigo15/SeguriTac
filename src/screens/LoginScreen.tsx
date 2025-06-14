import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Image,
  TouchableOpacity,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { setDoc, doc } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import { RootStackParamList } from '../navigation/types';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { registerForPushNotificationsAsync } from '../services/notifications';
import Toast from 'react-native-toast-message';
import AsyncStorage from '@react-native-async-storage/async-storage';

import * as Animatable from 'react-native-animatable';
import { Text, TextInput, Button } from 'react-native-paper';
import Icon from 'react-native-vector-icons/Ionicons';

type LoginScreenNav = NativeStackNavigationProp<RootStackParamList, 'Login'>;
type LoginScreenRoute = RouteProp<RootStackParamList, 'Login'>;

const LoginScreen = () => {
  const navigation = useNavigation<LoginScreenNav>();
  const route = useRoute<LoginScreenRoute>();
  const { role } = route.params ?? { role: 'ciudadano' };

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [secure, setSecure] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Toast.show({
        type: 'error',
        text1: 'Campos requeridos',
        text2: 'Por favor completa todos los campos',
      });
      return;
    }

    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      console.log('Usuario autenticado:', user);
      await AsyncStorage.setItem('user', JSON.stringify(user));

      const fcmToken = await registerForPushNotificationsAsync();
      if (fcmToken && user.email) {
        await setDoc(doc(db, 'tokens', user.email), {
          token: fcmToken,
          email: user.email,
          updatedAt: new Date(),
        });

        await fetch('https://seguridad-ciudadana-backend.onrender.com/api/guardar-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: fcmToken, email: user.email }),
        });

        Toast.show({
          type: 'success',
          text1: 'Notificaciones activadas',
          text2: 'Recibirás alertas de seguridad en este dispositivo',
        });
      }

      if (role === 'ciudadano') {
        navigation.navigate('Home');
      } else {
        navigation.navigate('AuthorityDashboard');
      }
    } catch (error: any) {
      console.log('Código de error:', error.code);
      let message = 'Ha ocurrido un error. Inténtalo nuevamente.';
      if (error.code === 'auth/invalid-credential') {
        message = 'Correo o contraseña incorrectos.';
      } else if (error.code === 'auth/user-not-found') {
        message = 'El usuario no existe.';
      } else if (error.code === 'auth/wrong-password') {
        message = 'Contraseña incorrecta.';
      } else if (error.code === 'auth/too-many-requests') {
        message = 'Demasiados intentos fallidos. Intenta más tarde.';
      }

      Toast.show({
        type: 'error',
        text1: 'Error de inicio de sesión',
        text2: message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.background}>
      <Animatable.View animation="fadeInUp" duration={800} style={styles.container}>
        <Image
          source={require('../../assets/iconselector.png')}
          style={styles.logo}
          resizeMode="contain"
        />

        <Text variant="headlineSmall" style={styles.title}>
          {role === 'ciudadano' ? 'Inicio de sesión - Ciudadano' : 'Inicio de sesión - Autoridad'}
        </Text>

        <TextInput
          label="Correo electrónico"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          style={styles.input}
          mode="outlined"
          left={<TextInput.Icon icon="email-outline" />}
        />

        <TextInput
          label="Contraseña"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={secure}
          style={styles.input}
          mode="outlined"
          left={<TextInput.Icon icon="lock-outline" />}
          right={
            <TextInput.Icon
              icon={secure ? 'eye-off-outline' : 'eye-outline'}
              onPress={() => setSecure(!secure)}
            />
          }
        />

        <Button
          mode="contained"
          onPress={handleLogin}
          loading={loading}
          disabled={loading}
          style={styles.loginButton}
          contentStyle={{ paddingVertical: 8 }}
        >
          Iniciar Sesión
        </Button>

        <Text style={styles.registerText}>
          ¿No tienes cuenta?{' '}
          <Text
            style={styles.registerLink}
            onPress={() => navigation.navigate('Register', { role })}
          >
            Regístrate
          </Text>
        </Text>
        <Text style={styles.changeRoleText}>
  ¿Quieres cambiar de rol?{' '}
  <Text
    style={styles.changeRoleLink}
    onPress={() => navigation.navigate('RoleSelector')}
  >
    Volver a seleccionar
  </Text>
</Text>
      </Animatable.View>
    </View>
  );
};

export default LoginScreen;

const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: '#002B7F',
    justifyContent: 'center',
  },
  container: {
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  logo: {
    width: 260,
    height: 260,
    marginBottom: 16,
  },
  title: {
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 24,
    fontWeight: 'bold',
  },
  input: {
    width: '100%',
    marginBottom: 16,
  },
  loginButton: {
    width: '100%',
    backgroundColor: '#0055CC',
    marginTop: 8,
  },
  registerText: {
    color: '#fff',
    marginTop: 20,
    fontSize: 14,
  },
  registerLink: {
    color: '#E0F7FA',
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
  changeRoleText: {
  color: '#fff',
  marginTop: 8,
  fontSize: 14,
  textAlign: 'center',
},
changeRoleLink: {
  color: '#E0F7FA',
  fontWeight: 'bold',
  textDecorationLine: 'underline',
},
});
