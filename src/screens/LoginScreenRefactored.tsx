/**
 * LoginScreen refactorizado usando las mejoras de calidad de código
 * Ejemplo de cómo implementar las mejoras:
 * - Uso de validaciones centralizadas
 * - Manejo de errores centralizado
 * - Componentes reutilizables
 * - Estilos del tema
 * - Configuración centralizada
 */

import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Image,
  ScrollView,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
// Migración a almacenamiento seguro
import secureStorage from '../services/secureStorage';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

// Importar servicios y utilidades mejorados
import { auth, db } from '../services/firebase';
import { registerForPushNotificationsAsync } from '../services/notifications';
import {
  showErrorToast,
  showSuccessToast,
  handleFirebaseError,
  withErrorHandling,
} from '../services/errorHandling';
import {
  validateEmail,
  validatePassword,
  validateRegistrationForm,
} from '../utils/validations';
import { apiConfig, appConfig } from '../config/appConfig';
import apiClient from '../services/apiClient';

// Importar componentes mejorados
import ValidatedTextInput from '../components/ValidatedTextInput';
import { LoadingSpinner, ButtonLoader } from '../components/LoadingSpinner';
import AnimatedButton from '../components/AnimatedButton';
import AnimatedScreen from '../components/AnimatedScreen';

// Importar estilos del tema
import {
  colors,
  commonContainers,
  commonTexts,
  commonButtons,
  spacing,
  fontSizes,
} from '../theme';

// Tipos
import { RootStackParamList } from '../navigation/types';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';

type LoginScreenNav = NativeStackNavigationProp<RootStackParamList, 'Login'>;
type LoginScreenRoute = RouteProp<RootStackParamList, 'Login'>;

interface LoginFormData {
  email: string;
  password: string;
}

interface ValidationState {
  email: { isValid: boolean; message: string };
  password: { isValid: boolean; message: string };
}

const LoginScreenRefactored: React.FC = () => {
  const navigation = useNavigation<LoginScreenNav>();
  const route = useRoute<LoginScreenRoute>();
  const { role } = route.params ?? { role: 'ciudadano' };

  // Estados del formulario
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: '',
  });
  
  const [validation, setValidation] = useState<ValidationState>({
    email: { isValid: true, message: '' },
    password: { isValid: true, message: '' },
  });
  
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  /**
   * Actualiza los datos del formulario
   */
  const updateFormData = (field: keyof LoginFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  /**
   * Actualiza el estado de validación
   */
  const updateValidation = (field: keyof ValidationState, isValid: boolean, message: string) => {
    setValidation(prev => ({
      ...prev,
      [field]: { isValid, message }
    }));
  };

  /**
   * Valida todo el formulario
   */
  const validateForm = (): boolean => {
    const emailValid = validateEmail(formData.email);
    const passwordValid = validatePassword(formData.password);

    updateValidation('email', emailValid, emailValid ? '' : 'Email inválido');
    updateValidation('password', passwordValid, passwordValid ? '' : 'Contraseña debe tener al menos 6 caracteres');

    return emailValid && passwordValid;
  };

  /**
   * Verifica el rol del usuario
   */
  const verifyUserRole = async (userId: string, expectedRole: string): Promise<any> => {
    const userDoc = await getDoc(doc(db, 'users', userId));
    
    if (!userDoc.exists()) {
      throw new Error('Usuario no registrado en el sistema');
    }

    const userData = userDoc.data();
    
    if (userData.role !== expectedRole) {
      throw new Error('Este no es el rol que corresponde a tu cuenta');
    }

    return userData;
  };

  /**
   * Registra el token de notificaciones
   */
  const registerNotificationToken = async (userEmail: string): Promise<void> => {
    const fcmToken = await registerForPushNotificationsAsync();
    
    if (fcmToken && userEmail) {
      // Guardar en Firestore
      await setDoc(doc(db, 'tokens', userEmail), {
        token: fcmToken,
        email: userEmail,
        updatedAt: new Date(),
      });

      // Enviar al backend
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), appConfig.timeouts.api);
      
      try {
        // Usar cliente centralizado con manejo de 401
        await apiClient.request('/guardar-token', {
          method: 'POST',
          body: { token: fcmToken, email: userEmail },
          // timeout gestionado internamente por apiClient según appConfig
        });
      } finally {
        clearTimeout(timeoutId);
      }
    }
  };

  /**
   * Maneja el proceso de login
   */
  const handleLogin = async (): Promise<void> => {
    // Validar formulario
    if (!validateForm()) {
      showErrorToast('Por favor corrige los errores en el formulario');
      return;
    }

    setLoading(true);

    const loginProcess = async () => {
      // Autenticar usuario
      const userCredential = await signInWithEmailAndPassword(
        auth, 
        formData.email.trim(), 
        formData.password
      );
      const user = userCredential.user;

      // Verificar rol
      const userData = await verifyUserRole(user.uid, role);

      // Guardar sesión en almacenamiento seguro
      await secureStorage.setItem(
        appConfig.storage.keys.userToken,
        JSON.stringify({ ...user, role: userData.role })
      );

      // Registrar token de notificaciones
      await registerNotificationToken(user.email!);

      // Mostrar éxito
      showSuccessToast(`Bienvenido, ${userData.role}`);

      // Navegar según el rol
      setTimeout(() => {
        if (userData.role === 'autoridad') {
          navigation.navigate('AuthorityDashboard');
        } else {
          navigation.navigate('Home');
        }
      }, 500);
    };

    // Ejecutar con manejo de errores
    const result = await withErrorHandling(
      loginProcess,
      'Login Process',
      true
    );

    if (!result) {
      // Si hay error, limpiar la sesión
      await auth.signOut();
      await secureStorage.removeItem(appConfig.storage.keys.userToken);
    }

    setLoading(false);
  };

  /**
   * Navega a la pantalla de registro
   */
  const navigateToRegister = () => {
    navigation.navigate('Register', { role });
  };

  return (
    <AnimatedScreen animationType="fade" duration={800}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={commonContainers.centeredContainer}>
          {/* Logo */}
          <Animated.Image
            entering={FadeInDown.duration(1000).springify()}
            source={require('../../assets/iconselector.png')}
            style={styles.logo}
            resizeMode="contain"
          />

          {/* Título */}
          <Animated.Text 
            entering={FadeInUp.delay(300).duration(800)}
            style={[commonTexts.title, styles.title]}
          >
            {role === 'ciudadano' ? 'Inicio de sesión - Ciudadano' : 'Inicio de sesión - Autoridad'}
          </Animated.Text>

          {/* Formulario */}
          <Animated.View 
            entering={FadeInUp.delay(400).duration(800)}
            style={styles.formContainer}
          >
            {/* Email Input */}
            <ValidatedTextInput
              label="Correo electrónico"
              value={formData.email}
              onChangeText={(text) => updateFormData('email', text)}
              validationType="email"
              onValidationChange={(isValid, message) => updateValidation('email', isValid, message)}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholder="Ingresa tu correo electrónico"
              required
              fieldName="Correo electrónico"
            />

            {/* Password Input */}
            <ValidatedTextInput
              label="Contraseña"
              value={formData.password}
              onChangeText={(text) => updateFormData('password', text)}
              validationType="password"
              onValidationChange={(isValid, message) => updateValidation('password', isValid, message)}
              secureTextEntry={!showPassword}
              placeholder="Ingresa tu contraseña"
              required
              fieldName="Contraseña"
            />

            {/* Login Button */}
            <AnimatedButton
              title={loading ? '' : 'Iniciar Sesión'}
              onPress={handleLogin}
              disabled={loading}
              style={[commonButtons.primaryButton, styles.loginButton]}
              textStyle={commonButtons.buttonText}
              animationType="scale"
            >
              {loading && <ButtonLoader />}
            </AnimatedButton>

            {/* Register Link */}
            <AnimatedButton
              title="¿No tienes cuenta? Regístrate"
              onPress={navigateToRegister}
              style={[commonButtons.secondaryButton, styles.registerButton]}
              textStyle={commonButtons.secondaryButtonText}
              animationType="highlight"
            />
          </Animated.View>
        </View>
      </ScrollView>
    </AnimatedScreen>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  scrollContent: {
    flexGrow: 1,
    padding: spacing.lg,
  },
  logo: {
    width: 220,
    height: 220,
    marginBottom: spacing.xl,
  },
  title: {
    marginBottom: spacing.xl,
  },
  formContainer: {
    width: '100%',
    maxWidth: 400,
  },
  loginButton: {
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  registerButton: {
    marginTop: spacing.sm,
  },
});

export default LoginScreenRefactored;