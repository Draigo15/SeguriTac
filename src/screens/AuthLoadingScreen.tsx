import React, { useEffect } from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { 
  colors, 
  spacing, 
  fontSizes,
  shadows
} from '../theme';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import AnimatedScreen from '../components/AnimatedScreen';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';

import { auth, db } from '../services/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { secureStorage } from '../services/secureStorage';
import { validateSession, getSessionToken } from '../services/authBackend';
import { appConfig } from '../config/appConfig';
import Constants from 'expo-constants';
import { User } from 'firebase/auth';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'AuthLoading'>;

const AuthLoadingScreen = () => {
  const navigation = useNavigation<NavigationProp>();

  useEffect(() => {
    const isDetoxE2E = !!Constants.expoConfig?.extra?.detoxE2E;

    // Atajo en E2E: si existe usuario persistido en secureStorage, navegar directo sin depender de Firebase
    if (isDetoxE2E) {
      (async () => {
        try {
          const storedUser = await secureStorage.getItem('user');
          if (storedUser) {
            const parsed = JSON.parse(storedUser);
            const role = parsed?.role;
            if (role === 'autoridad') {
              navigation.reset({ index: 0, routes: [{ name: 'AuthorityDashboard' }] });
              return;
            } else if (role === 'ciudadano') {
              navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
              return;
            }
          }
        } catch (_) {
          // continuar con flujo normal si falla parsing/lectura
        }
      })();
    }

    // Primero validar sesión de backend si existe token
    (async () => {
      try {
        const token = await getSessionToken();
        if (token) {
          const status = await validateSession();
          if (!status.valid) {
            // Limpiar token inválido para evitar estados inconsistentes
            await secureStorage.removeItem(appConfig.storage.keys.userToken);
          }
        }
      } catch (e) {
        // No bloquear carga por errores de red
      }
    })();

    const unsubscribe = auth.onAuthStateChanged(async (user: User | null) => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          const storedUser = await secureStorage.getItem('user');
          const storedRole = storedUser ? JSON.parse(storedUser).role : null;

          // Si hay token backend válido, la redirección será inmediata tras validar rol
          const backendStatus = await validateSession().catch(() => ({ valid: false }));

          if (userDoc.exists()) {
            const role = userDoc.data().role;

            // ✅ VERIFICAR que el rol actual coincida con el guardado en AsyncStorage
            if (storedRole && role !== storedRole) {
              console.warn(`Rol inconsistente. Firebase: ${role} | AsyncStorage: ${storedRole}`);
              await auth.signOut();
              await secureStorage.removeItem('user');
              navigation.reset({ index: 0, routes: [{ name: 'RoleSelector' }] });
              return;
            }

            // ✅ Redirección segura (si sesión backend válida, priorizar acceso)
            if (backendStatus.valid) {
              if (role === 'ciudadano') {
                navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
              } else if (role === 'autoridad') {
                navigation.reset({ index: 0, routes: [{ name: 'AuthorityDashboard' }] });
              } else {
                navigation.reset({ index: 0, routes: [{ name: 'RoleSelector' }] });
              }
              return;
            }

            // Si la sesión backend no es válida, continuar flujo normal
            if (role === 'ciudadano') {
              navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
            } else if (role === 'autoridad') {
              navigation.reset({ index: 0, routes: [{ name: 'AuthorityDashboard' }] });
            } else {
              navigation.reset({ index: 0, routes: [{ name: 'RoleSelector' }] });
            }
          } else {
            await auth.signOut();
            await secureStorage.removeItem('user');
            navigation.reset({ index: 0, routes: [{ name: 'RoleSelector' }] });
          }
        } catch (err) {
          console.error('Error verificando usuario:', err);
          await auth.signOut();
          await secureStorage.removeItem('user');
          navigation.reset({ index: 0, routes: [{ name: 'RoleSelector' }] });
        }
      } else {
        navigation.reset({ index: 0, routes: [{ name: 'RoleSelector' }] });
      }
    });

    return unsubscribe;
  }, []);

  return (
    <AnimatedScreen animationType="fade" duration={800}>
      <View style={styles.container}>
        <Animated.View 
          entering={ZoomIn.duration(1000).springify()}
          style={styles.loaderContainer}
        >
          <ActivityIndicator size="large" color="#2196f3" />
          <Animated.Text 
            entering={FadeIn.delay(300).duration(800)}
            style={styles.loadingText}
          >
            Verificando sesión...
          </Animated.Text>
        </Animated.View>
      </View>
    </AnimatedScreen>
  );
};

export default AuthLoadingScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.gray100,
  },
  loaderContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    ...shadows.md,
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: fontSizes.base,
    color: colors.gray600,
    fontWeight: '500',
  },
});
