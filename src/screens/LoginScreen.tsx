/**
 * LoginScreen - Pantalla de inicio de sesión para ciudadanos y autoridades
 * 
 * Esta pantalla maneja la autenticación de usuarios con diferentes roles,
 * validación de credenciales, gestión de tokens FCM para notificaciones push,
 * y navegación basada en el rol del usuario.
 * 
 * @author Equipo de Desarrollo
 * @version 1.0.0
 * @since 2024
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Image,
} from 'react-native';

// Componentes personalizados y animaciones
import AnimatedScreen from '../components/AnimatedScreen';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

// Navegación
import { useNavigation, useRoute } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/types';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';

// Firebase - Autenticación y base de datos
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../services/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, handleNetworkChange, enableFirestoreNetwork } from '../services/firebase';
import NetInfo from '@react-native-community/netinfo';

// Servicios externos
import { registerForPushNotificationsAsync } from '../services/notifications';
import Toast from 'react-native-toast-message';

// Hooks optimizados para móvil
import { useAuthForm, validationRules } from '../hooks/useForm';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Componentes UI y tema
import * as Animatable from 'react-native-animatable';
import { Text, TextInput, Button } from 'react-native-paper';
import { 
  colors, 
  spacing, 
  fontSizes,
  commonContainers,
  commonTexts,
  commonInputs,
  commonButtons,
  commonImages
} from '../theme';

// Tipos TypeScript para navegación tipada
type LoginScreenNav = NativeStackNavigationProp<RootStackParamList, 'Login'>;
type LoginScreenRoute = RouteProp<RootStackParamList, 'Login'>;

/**
 * Componente principal de la pantalla de inicio de sesión
 * 
 * Funcionalidades principales:
 * - Autenticación con Firebase Auth
 * - Validación de roles (ciudadano/autoridad)
 * - Registro de tokens FCM para notificaciones
 * - Manejo de errores con mensajes específicos
 * - Navegación condicional basada en el rol
 * 
 * @returns {JSX.Element} Componente de la pantalla de login
 */
const LoginScreen = () => {
  // Hooks de navegación
  const navigation = useNavigation<LoginScreenNav>();
  const route = useRoute<LoginScreenRoute>();
  
  // Obtener el rol desde los parámetros de navegación (por defecto: ciudadano)
  const { role } = route.params ?? { role: 'ciudadano' };

  // Hook de formulario optimizado para autenticación
  const {
    values,
    errors,
    touched,
    isValid,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit,
    getFieldProps,
    setSubmitting,
  } = useAuthForm();

  // Estados adicionales
  const [secure, setSecure] = useState(true); // Visibilidad de la contraseña
  const [isConnected, setIsConnected] = useState(true); // Estado de conectividad

  // Monitorear conectividad de red
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected ?? false);
      handleNetworkChange(state.isConnected);
      
      if (state.isConnected) {
        // Intentar reactivar Firestore cuando se recupere la conexión
        enableFirestoreNetwork().catch(console.error);
      }
    });

    return () => unsubscribe();
  }, []);

  /**
   * Función principal de autenticación optimizada con hook de formulario
   * 
   * Flujo de autenticación:
   * 1. Validación automática con hook de formulario
   * 2. Autenticación con Firebase Auth
   * 3. Verificación de existencia del usuario en Firestore
   * 4. Validación del rol del usuario
   * 5. Almacenamiento local de datos del usuario
   * 6. Registro de token FCM para notificaciones push
   * 7. Navegación basada en el rol
   * 
   * @async
   * @function performLogin
   * @returns {Promise<void>}
   */
  const performLogin = async () => {
    // Verificar conectividad antes de intentar login
    if (!isConnected) {
      Toast.show({
        type: 'warning',
        text1: 'Sin conexión',
        text2: 'Verifica tu conexión a internet e intenta nuevamente.',
      });
      return;
    }

    // Activar estado de carga
    setSubmitting(true);

    try {
      // Paso 1: Autenticación con Firebase Auth
      const userCredential = await signInWithEmailAndPassword(auth, values.email, values.password);
      const user = userCredential.user;

      // Paso 2: Verificar existencia del usuario en Firestore
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (!userDoc.exists()) {
        // Usuario autenticado pero sin datos en Firestore - cerrar sesión
        await auth.signOut();
        Toast.show({
          type: 'error',
          text1: 'Usuario no registrado',
          text2: 'No se encontró información del usuario en Firestore.',
        });
        await new Promise(resolve => setTimeout(resolve, 500));
        return;
      }

      // Paso 3: Validación del rol del usuario
      const userData = userDoc.data();
      if (userData.role !== role) {
        // Rol incorrecto - cerrar sesión y limpiar almacenamiento
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

      // Paso 4: Almacenar datos del usuario localmente
      await AsyncStorage.setItem('user', JSON.stringify({ ...user, role: userData.role }));

      // Paso 5: Registrar token FCM para notificaciones push
      const fcmToken = await registerForPushNotificationsAsync();
      if (fcmToken && user.email) {
        // Guardar token en Firestore
        await setDoc(doc(db, 'tokens', user.email), {
          token: fcmToken,
          email: user.email,
          updatedAt: new Date(),
        });

        // Enviar token al backend para gestión de notificaciones
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 segundos de timeout
          
          const response = await fetch('https://seguridad-ciudadana-backend.onrender.com/api/guardar-token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: fcmToken, email: user.email }),
            signal: controller.signal,
          });
          
          clearTimeout(timeoutId);
          
          if (!response.ok) {
            console.warn('⚠️ Error al guardar token FCM en backend:', response.status);
          }
        } catch (fetchError) {
          console.warn('⚠️ No se pudo conectar al backend para guardar token FCM:', fetchError);
          // No interrumpir el login por este error
        }
      }

      // Mostrar mensaje de éxito
      Toast.show({
        type: 'success',
        text1: 'Inicio de sesión exitoso',
        text2: `Bienvenido, ${userData.role}`,
      });

      // Esperar para que el Toast sea visible antes de navegar
      await new Promise(resolve => setTimeout(resolve, 500));

      // Paso 6: Requiere verificación OTP por email antes de continuar
      navigation.navigate('MFAEmailVerify', { email: user.email || '', role: userData.role });

    } catch (error: any) {
      // Manejo de errores específicos de Firebase Auth y Firestore
      let message = error.message || 'Ha ocurrido un error. Inténtalo nuevamente.';

      // Mapeo de códigos de error a mensajes amigables
      if (error.code === 'auth/invalid-credential') {
        message = 'Correo o contraseña incorrectos.';
      } else if (error.code === 'auth/user-not-found') {
        message = 'El usuario no existe.';
      } else if (error.code === 'auth/wrong-password') {
        message = 'Contraseña incorrecta.';
      } else if (error.code === 'auth/too-many-requests') {
        message = 'Demasiados intentos fallidos. Intenta más tarde.';
      } else if (error.code === 'unavailable' || error.message.includes('offline') || error.message.includes('client is offline')) {
        // Error específico de Firestore offline
        message = 'Sin conexión a internet. Verifica tu conexión y vuelve a intentar.';
      } else if (error.code === 'permission-denied') {
        message = 'No tienes permisos para acceder a esta información.';
      } else if (error.code === 'failed-precondition') {
        message = 'Error de configuración. Contacta al administrador.';
      } else if (error.message.includes('network') || error.message.includes('fetch')) {
        message = 'Error de conexión. Verifica tu internet y vuelve a intentar.';
      }

      console.log('Error de login:', error.code, error.message);

      // Mostrar error al usuario
      Toast.show({
        type: 'error',
        text1: 'Error de inicio de sesión',
        text2: message,
      });
    } finally {
      // Desactivar estado de carga independientemente del resultado
      setSubmitting(false);
    }
  };

  // Función de envío del formulario con validación automática
  const handleLogin = handleSubmit(performLogin);

  // Renderizado del componente con animaciones y estructura de UI
  return (
    // Contenedor principal con animación de fade
    <AnimatedScreen animationType="fade" duration={800}>
      {/* Fondo de la pantalla de autenticación */}
      <View style={commonContainers.authBackground}>
        {/* Contenedor principal del formulario con animación de entrada */}
        <Animated.View entering={FadeInUp.duration(800).springify()} style={commonContainers.authContainer}>
          {/* Logo de la aplicación con animación desde arriba */}
          <Animated.Image
            entering={FadeInDown.duration(1000).springify()}
            source={require('../../assets/iconselector.png')}
            style={commonImages.loginLogo}
            resizeMode="contain"
          />

          {/* Título dinámico basado en el rol seleccionado */}
          <Animated.Text 
            entering={FadeInUp.delay(300).duration(800)}
            style={commonTexts.loginTitle}
          >
            {role === 'ciudadano' ? 'Inicio de sesión - Ciudadano' : 'Inicio de sesión - Autoridad'}
          </Animated.Text>

          {/* Indicador de conectividad */}
          {!isConnected && (
            <Animated.View 
              entering={FadeInUp.delay(400).duration(600)}
              style={{
                backgroundColor: colors.warning,
                padding: 8,
                borderRadius: 8,
                marginBottom: 16,
                width: '100%'
              }}
            >
              <Text style={{ color: colors.white, textAlign: 'center', fontSize: 14 }}>
                ⚠️ Sin conexión a internet
              </Text>
            </Animated.View>
          )}

        {/* Campo de entrada para el correo electrónico */}
        <TextInput
          label="Correo electrónico"
          {...getFieldProps('email')}
          mode="outlined"
          keyboardType="email-address" // Teclado optimizado para emails
          autoCapitalize="none" // Evitar capitalización automática
          left={<TextInput.Icon icon="email-outline" />}
          style={commonInputs.loginInput}
          error={touched.email && !!errors.email}
          theme={{
             colors: {
               text: colors.gray900,
               primary: colors.secondary,
               placeholder: colors.gray900,
               background: colors.white,
             },
           }}
        />
        {touched.email && errors.email && (
          <Text style={{ color: colors.error, fontSize: 12, marginTop: 4 }}>
            {errors.email}
          </Text>
        )}

        {/* Campo de entrada para la contraseña con toggle de visibilidad */}
        <TextInput
          label="Contraseña"
          {...getFieldProps('password')}
          secureTextEntry={secure} // Controla la visibilidad de la contraseña
          mode="outlined"
          style={commonInputs.loginInput}
          left={<TextInput.Icon icon="lock-outline" />}
          right={
            // Botón para alternar visibilidad de la contraseña
            <TextInput.Icon
              icon={secure ? 'eye-off-outline' : 'eye-outline'}
              onPress={() => setSecure(!secure)}
            />
          }
          error={touched.password && !!errors.password}
          theme={{
             colors: {
               text: colors.gray900,
               primary: colors.secondary,
               placeholder: colors.gray900,
               background: colors.white,
             },
           }}
        />
        {touched.password && errors.password && (
          <Text style={{ color: colors.error, fontSize: 12, marginTop: 4 }}>
            {errors.password}
          </Text>
        )}

        {/* Botón principal de inicio de sesión con animación */}
        <Animated.View entering={FadeInUp.delay(400).duration(800)} style={{width: '100%', marginBottom: 24}}>
          <Button
            mode="contained"
            onPress={handleLogin}
            loading={isSubmitting} // Muestra spinner durante la autenticación
            disabled={isSubmitting || !isValid} // Deshabilita el botón durante la carga o si el formulario es inválido
            style={commonButtons.loginButton}
            contentStyle={{ paddingVertical: 8 }}
            labelStyle={commonButtons.buttonText}
          >
            Iniciar Sesión
          </Button>
        </Animated.View>

        {/* Enlace para navegar a la pantalla de registro */}
        <Animated.Text 
          entering={FadeInUp.delay(500).duration(800)}
          style={commonTexts.linkText}
        >
          ¿No tienes cuenta?{' '}
          <Text
            style={commonTexts.linkTextBold}
            onPress={() => navigation.navigate('Register', { role })} // Mantiene el rol seleccionado
          >
            Regístrate
          </Text>
        </Animated.Text>

        {/* Enlace para cambiar de rol y volver al selector */}
        <Animated.Text 
          entering={FadeInUp.delay(600).duration(800)}
          style={[commonTexts.linkText, { marginTop: 16 }]}
        >
          ¿Quieres cambiar de rol?{' '}
          <Text
            style={commonTexts.linkTextBold}
            onPress={() => navigation.navigate('RoleSelector')} // Regresa al selector de roles
          >
            Volver a seleccionar
          </Text>
        </Animated.Text>
        </Animated.View>
      </View>
    </AnimatedScreen>
  );
};

// Exportación por defecto del componente
export default LoginScreen;

/**
 * Estilos específicos del componente LoginScreen
 * 
 * Nota: Actualmente se utilizan estilos centralizados del tema.
 * Este objeto está disponible para estilos específicos de esta pantalla
 * que no puedan ser reutilizados en otros componentes.
 * 
 * @see ../theme.ts - Para estilos comunes y reutilizables
 */
const styles = StyleSheet.create({
  // Estilos específicos de esta pantalla si los hay
  // Ejemplo:
  // customContainer: {
  //   // estilos únicos para esta pantalla
  // }
});
