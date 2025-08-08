import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Image,
} from 'react-native';
import AnimatedScreen from '../components/AnimatedScreen';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useNavigation, useRoute } from '@react-navigation/native';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../services/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { RootStackParamList } from '../navigation/types';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { registerForPushNotificationsAsync } from '../services/notifications';
import Toast from 'react-native-toast-message';
import AsyncStorage from '@react-native-async-storage/async-storage';

import * as Animatable from 'react-native-animatable';
import { Text, TextInput, Button } from 'react-native-paper';

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
        text2: 'Por favor completa todos los campos.',
      });
      return;
    }

    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (!userDoc.exists()) {
        await auth.signOut();
        Toast.show({
          type: 'error',
          text1: 'Usuario no registrado',
          text2: 'No se encontró información del usuario en Firestore.',
        });
        await new Promise(resolve => setTimeout(resolve, 500));
        return;
      }

      const userData = userDoc.data();
      if (userData.role !== role) {
        await auth.signOut();
        await AsyncStorage.removeItem('user');

        Toast.show({
          type: 'error',
          text1: 'Rol incorrecto',
          text2: 'Este no es el rol que corresponde a tu cuenta.',
        });
        await new Promise(resolve => setTimeout(resolve, 500));
        return;
      }

      await AsyncStorage.setItem('user', JSON.stringify({ ...user, role: userData.role }));

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
      }

      Toast.show({
        type: 'success',
        text1: 'Inicio de sesión exitoso',
        text2: `Bienvenido, ${userData.role}`,
      });

      await new Promise(resolve => setTimeout(resolve, 500)); // Espera para que el Toast se vea

      if (userData.role === 'autoridad') {
        navigation.navigate('AuthorityDashboard');
      } else {
        navigation.navigate('Home');
      }

    } catch (error: any) {
      let message = error.message || 'Ha ocurrido un error. Inténtalo nuevamente.';

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
    <AnimatedScreen animationType="fade" duration={800}>
      <View style={styles.background}>
        <Animated.View entering={FadeInUp.duration(800).springify()} style={styles.container}>
          <Animated.Image
            entering={FadeInDown.duration(1000).springify()}
            source={require('../../assets/iconselector.png')}
            style={styles.logo}
            resizeMode="contain"
          />

          <Animated.Text 
            entering={FadeInUp.delay(300).duration(800)}
            style={styles.title}
          >
            {role === 'ciudadano' ? 'Inicio de sesión - Ciudadano' : 'Inicio de sesión - Autoridad'}
          </Animated.Text>

        <TextInput
          label="Correo electrónico"
          value={email}
          onChangeText={setEmail}
          mode="outlined"
          keyboardType="email-address"
          autoCapitalize="none"
          left={<TextInput.Icon icon="email-outline" />}
          style={styles.input}
          theme={{
            colors: {
              text: '#000',
              primary: '#000',
              placeholder: '#000',
              background: '#fff',
            },
          }}
        />

        <TextInput
          label="Contraseña"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={secure}
          mode="outlined"
          style={styles.input}
          left={<TextInput.Icon icon="lock-outline" />}
          right={
            <TextInput.Icon
              icon={secure ? 'eye-off-outline' : 'eye-outline'}
              onPress={() => setSecure(!secure)}
            />
          }
          theme={{
            colors: {
              text: '#000',
              primary: '#000',
              placeholder: '#000',
              background: '#fff',
            },
          }}
        />

        <Animated.View entering={FadeInUp.delay(400).duration(800)} style={{width: '100%'}}>
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
        </Animated.View>

        <Animated.Text 
          entering={FadeInUp.delay(500).duration(800)}
          style={styles.registerText}
        >
          ¿No tienes cuenta?{' '}
          <Text
            style={styles.registerLink}
            onPress={() => navigation.navigate('Register', { role })}
          >
            Regístrate
          </Text>
        </Animated.Text>

        <Animated.Text 
          entering={FadeInUp.delay(600).duration(800)}
          style={styles.changeRoleText}
        >
          ¿Quieres cambiar de rol?{' '}
          <Text
            style={styles.changeRoleLink}
            onPress={() => navigation.navigate('RoleSelector')}
          >
            Volver a seleccionar
          </Text>
        </Animated.Text>
        </Animated.View>
      </View>
    </AnimatedScreen>
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
