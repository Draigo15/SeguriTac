import React from 'react';
import {
  View,
  StyleSheet,
  Image,
  ActivityIndicator,
} from 'react-native';
import AnimatedScreen from '../components/AnimatedScreen';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import AnimatedButton from '../components/AnimatedButton';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import useGoogleAuth from '../services/useGoogleAuth';
import { registerForPushNotificationsAsync } from '../services/notifications';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';

type ScreenRouteProp = RouteProp<RootStackParamList, 'LoginMethod'>;
type Nav = NativeStackNavigationProp<RootStackParamList>;

const LoginMethodScreen = () => {
  const route = useRoute<ScreenRouteProp>();
  const { role } = route.params;
  const navigation = useNavigation<Nav>();

  const { promptAsync, handleLogin } = useGoogleAuth();
  const [loading, setLoading] = React.useState(false);

  const handleCorreo = () => {
    navigation.navigate('Login', { role });
  };

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      const result = await promptAsync();

      if (result && result.type === 'success') {
        const user = await handleLogin();

        if (user) {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (!userDoc.exists()) {
            await auth.signOut();
            Toast.show({
              type: 'error',
              text1: 'Usuario no encontrado',
              text2: 'Tu cuenta no está registrada correctamente.',
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
              text2: `Tu rol registrado es "${userData.role}", pero seleccionaste "${role}".`,
            });
            await new Promise(resolve => setTimeout(resolve, 500));
            return;
          }

          await AsyncStorage.setItem('user', JSON.stringify({ ...user, role: userData.role }));

          const token = await registerForPushNotificationsAsync();
          if (token && user.email) {
            await setDoc(doc(db, 'tokens', user.email), {
              token,
              email: user.email,
              updatedAt: new Date(),
            });

            await fetch('https://seguridad-ciudadana-backend.onrender.com/api/guardar-token', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ token, email: user.email }),
            });
          }

          Toast.show({
            type: 'success',
            text1: 'Inicio de sesión exitoso',
            text2: `Bienvenido, ${userData.role}`,
          });

          await new Promise(resolve => setTimeout(resolve, 500)); // ✅ Delay para que se vea el Toast

          if (userData.role === 'autoridad') {
            navigation.reset({ index: 0, routes: [{ name: 'AuthorityDashboard' }] });
          } else {
            navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
          }
        }
      }
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Error de inicio de sesión',
        text2: error.message || 'No se pudo iniciar sesión con Google.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatedScreen animationType="fade" duration={800}>
      <View style={styles.container}>
        <Animated.Image 
          source={require('../../assets/iconselector.png')} 
          style={styles.logo} 
          entering={FadeInDown.duration(1000).springify()}
        />
        <Animated.Text 
          style={styles.title}
          entering={FadeInUp.delay(300).duration(800)}
        >
          Iniciar sesión como {role}
        </Animated.Text>

        <Animated.View entering={FadeInUp.delay(400).duration(800)} style={styles.buttonContainer}>
          <AnimatedButton
            title="📧 Correo y Contraseña"
            onPress={handleCorreo}
            style={styles.button}
            animationType="scale"
            icon="mail-outline"
          />
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(500).duration(800)} style={styles.buttonContainer}>
          <AnimatedButton
            onPress={handleGoogleLogin}
            disabled={loading}
            style={styles.googleButton}
            animationType="bounce"
          >
            <View style={styles.googleContent}>
              <Image
                source={require('../../assets/google-icon.png')}
                style={styles.googleIcon}
              />
              {loading ? (
                <ActivityIndicator size="small" color="#000" />
              ) : (
                <Animated.Text style={styles.googleText}>Iniciar con Google</Animated.Text>
              )}
            </View>
          </AnimatedButton>
        </Animated.View>
      </View>
    </AnimatedScreen>
  );
};

export default LoginMethodScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#002B7F',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  logo: {
    width: 180,
    height: 180,
    marginBottom: 24,
  },
  title: {
    color: '#fff',
    fontSize: 20,
    marginBottom: 32,
    fontWeight: 'bold',
  },
  buttonContainer: {
    width: '95%',
    alignItems: 'center',
  },
  button: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    width: '100%',
    marginBottom: 16,
  },
  googleButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
  },
  googleContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleIcon: {
    width: 24,
    height: 24,
    marginRight: 10,
  },
  googleText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 16,
  },
  buttonText: {
    color: '#002B7F',
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 16,
  },
});
