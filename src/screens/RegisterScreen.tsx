/**
 * RegisterScreen - Pantalla de registro para ciudadanos y autoridades
 * 
 * Esta pantalla maneja el registro de nuevos usuarios con diferentes roles,
 * validación de datos de entrada, creación de cuentas en Firebase Auth,
 * almacenamiento de información del usuario en Firestore con medidas de seguridad
 * para prevenir escalación de privilegios.
 * 
 * @author Equipo de Desarrollo
 * @version 1.0.0
 * @since 2024
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image,
  TouchableOpacity,
} from 'react-native';

// Componentes personalizados y animaciones
import AnimatedScreen from '../components/AnimatedScreen';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import AnimatedButton from '../components/AnimatedButton';

// Navegación
import { useNavigation, useRoute } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/types';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';

// Firebase - Autenticación y base de datos
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../services/firebase';
import { doc, setDoc } from 'firebase/firestore';

// Hooks optimizados para móvil
import { useForm, validationRules } from '../hooks/useForm';

// Componentes UI y tema
import { 
  colors, 
  fontSizes, 
  spacing,
  commonContainers,
  commonTexts,
  commonInputs,
  commonButtons,
  commonImages
} from '../theme';
import Icon from 'react-native-vector-icons/Ionicons';
import Toast from 'react-native-toast-message';

// Tipos TypeScript para navegación tipada
type RegisterScreenNav = NativeStackNavigationProp<RootStackParamList, 'Register'>;
type RegisterScreenRoute = RouteProp<RootStackParamList, 'Register'>;

/**
 * Componente principal de la pantalla de registro
 * 
 * Funcionalidades principales:
 * - Registro de usuarios con Firebase Auth
 * - Validación de datos de entrada (campos requeridos, contraseña segura)
 * - Almacenamiento seguro de datos del usuario en Firestore
 * - Prevención de escalación de privilegios mediante validación de roles
 * - Manejo de errores con mensajes específicos
 * - Navegación automática al login después del registro exitoso
 * 
 * @returns {JSX.Element} Componente de la pantalla de registro
 */
const RegisterScreen = () => {
  // Hooks de navegación
  const navigation = useNavigation<RegisterScreenNav>();
  const route = useRoute<RegisterScreenRoute>();
  
  // Obtener el rol desde los parámetros de navegación (por defecto: ciudadano)
  const { role } = route.params ?? { role: 'ciudadano' };

  // Hook de formulario optimizado para registro
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
  } = useForm({
    initialValues: {
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      dni: '',
      phone: '',
    },
    validationRules: {
      email: validationRules.email,
      password: validationRules.password,
      firstName: { required: true, minLength: 2, maxLength: 50 },
      lastName: { required: true, minLength: 2, maxLength: 50 },
      dni: { required: true, minLength: 8, maxLength: 12, pattern: /^[0-9]+$/ },
      phone: validationRules.phone,
    },
    validateOnBlur: true,
  });

  // Estados adicionales
  const [showPassword, setShowPassword] = useState(false); // Visibilidad de la contraseña

  /**
   * Función principal de registro de usuario optimizada con hook de formulario
   * 
   * Proceso de registro:
   * 1. Validación automática con hook de formulario
   * 2. Creación de cuenta en Firebase Auth
   * 3. Almacenamiento de datos del usuario en Firestore
   * 4. Navegación al login
   * 
   * @returns {Promise<void>} Promesa que se resuelve cuando el registro es exitoso
   */
  const performRegister = async () => {
    try {
      setSubmitting(true); // Activar indicador de carga
      
      // Crear cuenta en Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
      const user = userCredential.user;

      // Preparar datos del usuario para Firestore
      const userData = {
        email: values.email.toLowerCase().trim(),
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim(),
        dni: values.dni.trim(),
        phone: values.phone.trim(),
        role: role, // Rol seleccionado (ciudadano/autoridad)
        createdAt: new Date(),
        isActive: true,
        // Campos adicionales de seguridad
        emailVerified: user.emailVerified,
        lastLogin: null,
        profileComplete: true,
      };

      // Guardar datos del usuario en Firestore
      await setDoc(doc(db, 'users', user.uid), userData);

      // Mostrar mensaje de éxito
      Toast.show({
        type: 'success',
        text1: 'Registro exitoso',
        text2: 'Tu cuenta ha sido creada correctamente',
        position: 'bottom',
      });

      // Navegar al login con el rol correspondiente
      navigation.navigate('Login', { role });

    } catch (error: any) {
      // Manejo de errores específicos de Firebase Auth
      let errorMessage = 'Error de registro';
      let errorDescription = 'No se pudo crear la cuenta';

      switch (error.code) {
        case 'auth/email-already-in-use':
          errorMessage = 'Email ya registrado';
          errorDescription = 'Ya existe una cuenta con este email';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Email inválido';
          errorDescription = 'El formato del email no es válido';
          break;
        case 'auth/operation-not-allowed':
          errorMessage = 'Operación no permitida';
          errorDescription = 'El registro está temporalmente deshabilitado';
          break;
        case 'auth/weak-password':
          errorMessage = 'Contraseña débil';
          errorDescription = 'La contraseña debe ser más segura';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'Error de conexión';
          errorDescription = 'Verifica tu conexión a internet';
          break;
        default:
          errorDescription = error.message || 'Error desconocido';
      }

      Toast.show({
        type: 'error',
        text1: errorMessage,
        text2: errorDescription,
        position: 'bottom',
      });

      // console.error('Error en registro:', error); // Comentado para evitar mostrar errores técnicos de Firebase
    }
  };

  // Función de envío del formulario con validación automática
  const handleRegister = handleSubmit(performRegister);

  // Renderizado del componente con estructura optimizada para formularios
  return (
    // Contenedor principal con animación de deslizamiento hacia arriba
    <AnimatedScreen animationType="slideUp" duration={600}>
      {/* KeyboardAvoidingView para manejar el teclado en iOS */}
      <KeyboardAvoidingView
        style={commonContainers.authBackground}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined} // Solo en iOS
      >
        {/* ScrollView para permitir desplazamiento cuando el teclado está activo */}
        <ScrollView 
          contentContainerStyle={commonContainers.authContainer} 
          keyboardShouldPersistTaps="handled" // Permite tocar elementos cuando el teclado está visible
        >
          {/* Logo de la aplicación con animación desde arriba */}
          <Animated.Image
            entering={FadeInDown.duration(1000).springify()}
            source={require('../../assets/iconselector.png')}
            style={commonImages.authLogo}
            resizeMode="contain"
          />

          {/* Título dinámico basado en el rol seleccionado */}
          <Animated.Text 
            entering={FadeInUp.delay(200).duration(800)}
            style={commonTexts.authTitle}
          >
            Registro - {role === 'ciudadano' ? 'Ciudadano' : 'Autoridad'}
          </Animated.Text>

        {/* Campo de entrada para el nombre con icono */}
        <Animated.View 
          entering={FadeInUp.delay(300).duration(800)}
          style={commonContainers.inputContainer}
        >
          <Icon name="person-outline" size={20} color="#000" style={commonInputs.icon} />
          <TextInput
            style={[commonInputs.authInput, errors.firstName && commonInputs.textInputError]}
            placeholder="Nombres"
            placeholderTextColor="#000"
            {...getFieldProps('firstName')}
            autoCapitalize="words" // Capitaliza la primera letra de cada palabra
          />
          {errors.firstName && (
            <Text style={commonTexts.errorText}>{errors.firstName}</Text>
          )}
        </Animated.View>

        {/* Campo de entrada para el apellido con icono */}
        <Animated.View 
          entering={FadeInUp.delay(400).duration(800)}
          style={commonContainers.inputContainer}
        >
          <Icon name="person-outline" size={20} color="#000" style={commonInputs.icon} />
          <TextInput
            style={[commonInputs.authInput, errors.lastName && commonInputs.textInputError]}
            placeholder="Apellidos"
            placeholderTextColor="#000"
            {...getFieldProps('lastName')}
            autoCapitalize="words" // Capitaliza la primera letra de cada palabra
          />
          {errors.lastName && (
            <Text style={commonTexts.errorText}>{errors.lastName}</Text>
          )}
        </Animated.View>

        {/* Campo de entrada para el DNI con icono */}
        <Animated.View 
          entering={FadeInUp.delay(450).duration(800)}
          style={commonContainers.inputContainer}
        >
          <Icon name="card-outline" size={20} color="#000" style={commonInputs.icon} />
          <TextInput
            style={[commonInputs.authInput, errors.dni && commonInputs.textInputError]}
            placeholder="DNI (8 dígitos)"
            placeholderTextColor="#000"
            {...getFieldProps('dni')}
            keyboardType="numeric" // Teclado numérico
            maxLength={8} // Máximo 8 caracteres
          />
          {errors.dni && (
            <Text style={commonTexts.errorText}>{errors.dni}</Text>
          )}
        </Animated.View>

        {/* Campo de entrada para el teléfono con icono */}
        <Animated.View 
          entering={FadeInUp.delay(500).duration(800)}
          style={commonContainers.inputContainer}
        >
          <Icon name="call-outline" size={20} color="#000" style={commonInputs.icon} />
          <TextInput
            style={[commonInputs.authInput, errors.phone && commonInputs.textInputError]}
            placeholder="Teléfono (9 dígitos)"
            placeholderTextColor="#000"
            {...getFieldProps('phone')}
            keyboardType="phone-pad" // Teclado de teléfono
            maxLength={9} // Máximo 9 caracteres
          />
          {errors.phone && (
            <Text style={commonTexts.errorText}>{errors.phone}</Text>
          )}
        </Animated.View>

        {/* Campo de entrada para el email con teclado optimizado */}
        <Animated.View 
          entering={FadeInUp.delay(550).duration(800)}
          style={commonContainers.inputContainer}
        >
          <Icon name="mail-outline" size={20} color="#000" style={commonInputs.icon} />
          <TextInput
            style={[commonInputs.authInput, errors.email && commonInputs.textInputError]}
            placeholder="Correo electrónico"
            placeholderTextColor="#000"
            {...getFieldProps('email')}
            autoCapitalize="none" // Sin capitalización automática
            keyboardType="email-address" // Teclado optimizado para emails
          />
          {errors.email && (
            <Text style={commonTexts.errorText}>{errors.email}</Text>
          )}
        </Animated.View>

        {/* Campo de entrada para la contraseña con toggle de visibilidad */}
        <Animated.View 
          entering={FadeInUp.delay(600).duration(800)}
          style={commonContainers.inputContainer}
        >
          <Icon name="lock-closed-outline" size={20} color="#000" style={commonInputs.icon} />
          <TextInput
            style={[commonInputs.authInput, { paddingRight: 50 }, errors.password && commonInputs.textInputError]} // Espacio para el botón del ojo
            placeholder="Contraseña"
            placeholderTextColor="#000"
            {...getFieldProps('password')}
            secureTextEntry={!showPassword} // Controla la visibilidad de la contraseña
            autoCapitalize="none" // Sin capitalización automática
          />
          {/* Botón para alternar visibilidad de la contraseña */}
          <TouchableOpacity
            style={{
              position: 'absolute',
              right: 15,
              top: '50%',
              transform: [{ translateY: -10 }],
            }}
            onPress={() => setShowPassword(!showPassword)}
          >
            <Icon
              name={showPassword ? 'eye-outline' : 'eye-off-outline'}
              size={20}
              color="#666"
            />
          </TouchableOpacity>
          {errors.password && (
            <Text style={commonTexts.errorText}>{errors.password}</Text>
          )}
        </Animated.View>

        {/* Botón de registro con estado de carga */}
        <Animated.View 
          entering={FadeInUp.delay(700).duration(800)}
          style={{width: '100%'}}
        >
          <AnimatedButton
            title={isSubmitting ? 'Registrando...' : 'Registrarse'} // Texto dinámico según estado
            onPress={handleRegister}
            style={[commonButtons.authButton, (isSubmitting || !isValid) && styles.buttonDisabled]}
            animationType="scale"
            icon="person-add-outline"
            disabled={isSubmitting || !isValid} // Deshabilitado durante el proceso de registro o si el formulario no es válido
          />
        </Animated.View>

        {/* Contenedor de enlaces de navegación */}
        <Animated.View 
          entering={FadeInUp.delay(800).duration(800)}
          style={styles.linksContainer}
        >
          {/* Enlace para ir a la pantalla de login (mantiene el rol seleccionado) */}
          <Pressable onPress={() => navigation.navigate('Login', { role })}>
            <Text style={commonTexts.linkText}>¿Ya tienes cuenta? Inicia sesión</Text>
          </Pressable>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
    </AnimatedScreen>
  );
};

// Exportación por defecto del componente RegisterScreen
export default RegisterScreen;

/**
 * Estilos específicos para RegisterScreen
 * 
 * Contiene estilos que no están cubiertos por el tema centralizado.
 * Estos estilos son específicos para esta pantalla y complementan
 * los estilos comunes definidos en el sistema de temas.
 * 
 * @example
 * // Para agregar un nuevo estilo específico:
 * // newStyle: {
 * //   property: value,
 * // },
 */
const styles = StyleSheet.create({
  // Estilo para el botón cuando está deshabilitado durante el registro
  buttonDisabled: {
    backgroundColor: colors.gray400 ?? '#aaa', // Color de fondo gris para indicar estado deshabilitado
  },
  // Contenedor para los enlaces de navegación
  linksContainer: {
    alignItems: 'center',
    marginTop: spacing.lg,
    gap: spacing.md,
  },
});
