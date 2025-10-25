/**
 * CitizenProfileScreen - Pantalla de Edición de Perfil del Ciudadano
 * 
 * Esta pantalla implementa el RF-13: Edición de Perfil Ciudadano
 * Permite a los ciudadanos autenticados editar y actualizar su información personal
 * almacenada en Firebase Firestore, incluyendo nombres, apellidos, DNI y teléfono.
 * 
 * Funcionalidades principales:
 * - Carga automática de datos del perfil desde Firestore
 * - Validación en tiempo real de campos de entrada
 * - Actualización segura de información en la base de datos
 * - Mensajes de confirmación y error para retroalimentación al usuario
 * - Interfaz responsive con animaciones suaves
 * 
 * Validaciones implementadas:
 * - Campos obligatorios (nombres, apellidos, DNI)
 * - Formato de teléfono válido
 * - Longitud máxima para DNI (8 dígitos) y teléfono (9 dígitos)
 * 
 * @author Equipo de Desarrollo
 * @version 1.0.0
 * @since 2024
 * @implements RF-13
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
} from 'react-native';

// Tema y estilos globales
import { 
  colors, 
  spacing, 
  fontSizes,
  commonContainers,
  commonTexts,
  commonInputs,
  commonButtons
} from '../theme';

// Componentes personalizados y animaciones
import AnimatedScreen from '../components/AnimatedScreen';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import AnimatedButton from '../components/AnimatedButton';

// Firebase - Autenticación y base de datos
import { auth, db } from '../services/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

// Componentes de terceros
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Toast from 'react-native-toast-message';

// Hooks personalizados para formularios
import { useForm, validationRules } from '../hooks/useForm';

/**
 * Componente principal de la pantalla de edición de perfil ciudadano
 * 
 * Implementa el RF-13: Edición de Perfil Ciudadano
 * Proporciona una interfaz completa para que los ciudadanos puedan:
 * - Visualizar su información personal actual
 * - Editar campos como nombres, apellidos, DNI y teléfono
 * - Guardar cambios de forma segura en Firebase Firestore
 * - Recibir retroalimentación visual sobre el estado de las operaciones
 * 
 * @returns {JSX.Element} Componente de la pantalla de edición de perfil
 */
const CitizenProfileScreen = () => {
  // Hook de formulario con validaciones integradas para gestión de estado
  // Incluye validación en tiempo real y manejo de errores
  const {
    values,        // Valores actuales de los campos del formulario
    errors,        // Errores de validación por campo
    touched,       // Campos que han sido tocados por el usuario
    isValid,       // Estado general de validez del formulario
    isSubmitting,  // Estado de envío para prevenir múltiples submissions
    getFieldProps, // Función para obtener props de campo (value, onChange, onBlur)
    setValue,      // Función para establecer valores programáticamente
    handleSubmit,  // Función para manejar el envío del formulario
    reset          // Función para resetear el formulario
  } = useForm({
    // Valores iniciales del formulario (se actualizan al cargar datos de Firestore)
    initialValues: {
      firstName: '', // Nombres del ciudadano
      lastName: '',  // Apellidos del ciudadano
      dni: '',       // Documento Nacional de Identidad
      phone: ''      // Número de teléfono
    },
    // Reglas de validación para cada campo del formulario
    validationRules: {
      firstName: validationRules.required, // Campo obligatorio
      lastName: validationRules.required,  // Campo obligatorio
      dni: validationRules.required,       // Campo obligatorio
      phone: validationRules.phone         // Validación de formato de teléfono
    }
  });

  // Efecto para cargar los datos del perfil al montar el componente
  // Implementa la funcionalidad de visualización de datos existentes del RF-13
  useEffect(() => {
    /**
     * Función asíncrona para obtener los datos del perfil del usuario desde Firestore
     * 
     * Proceso:
     * 1. Verifica que hay un usuario autenticado
     * 2. Consulta el documento del usuario en la colección 'users'
     * 3. Carga los datos en el formulario usando setValue
     * 4. Maneja errores con mensajes de retroalimentación (RF-11)
     * 
     * @async
     * @function fetchProfile
     */
    const fetchProfile = async () => {
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      try {
        // Referencia al documento del usuario en Firestore
        const docRef = doc(db, 'users', currentUser.uid);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          // Cargar datos existentes en el formulario con valores por defecto
          setValue('firstName', data.firstName || '');
          setValue('lastName', data.lastName || '');
          setValue('dni', data.dni || '');
          setValue('phone', data.phone || '');
        }
      } catch (error: any) {
        console.error('Error al cargar perfil:', error);
        // Mensaje de error para retroalimentación al usuario (RF-11)
        Toast.show({
          type: 'error',
          text1: 'Error al cargar perfil',
        });
      }
    };

    fetchProfile();
  }, [setValue]);

  /**
   * Función asíncrona para guardar los cambios del perfil en Firestore
   * 
   * Implementa la funcionalidad principal del RF-13: actualización de datos del ciudadano
   * Actualiza los campos editables del perfil en la base de datos de forma segura.
   * 
   * Campos actualizables:
   * - firstName: Nombres del ciudadano
   * - lastName: Apellidos del ciudadano
   * - dni: Documento Nacional de Identidad
   * - phone: Número de teléfono
   * 
   * @param {Object} formValues - Valores del formulario validados
   * @param {string} formValues.firstName - Nombres del usuario
   * @param {string} formValues.lastName - Apellidos del usuario
   * @param {string} formValues.dni - DNI del usuario
   * @param {string} formValues.phone - Teléfono del usuario
   * @throws {Error} Error si falla la actualización en Firestore
   * @async
   */
  const performSave = async (formValues: any) => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    try {
      // Referencia al documento del usuario en la colección 'users'
      const docRef = doc(db, 'users', currentUser.uid);
      
      // Actualizar solo los campos editables del perfil
      await updateDoc(docRef, {
        firstName: formValues.firstName,
        lastName: formValues.lastName,
        dni: formValues.dni,
        phone: formValues.phone,
      });
      
      // Mensaje de confirmación exitosa (RF-11: Mensajes de Retroalimentación)
      Toast.show({
        type: 'success',
        text1: 'Perfil actualizado con éxito',
      });
    } catch (error: any) {
      console.error('Error al actualizar perfil:', error);
      // Mensaje de error para retroalimentación al usuario (RF-11)
      Toast.show({
        type: 'error',
        text1: 'Error al guardar cambios',
      });
      throw error;
    }
  };

  /**
   * Función para manejar el evento de guardar perfil
   * 
   * Valida el formulario antes de proceder con el guardado y proporciona
   * retroalimentación inmediata al usuario sobre errores de validación.
   * Implementa el RF-11: Mensajes de Retroalimentación.
   * 
   * Proceso:
   * 1. Verifica que todos los campos sean válidos
   * 2. Si hay errores, muestra el primer error encontrado
   * 3. Si es válido, procede con el guardado
   * 
   * @function handleSaveProfile
   */
  const handleSaveProfile = () => {
    // Validación previa antes del guardado
    if (!isValid) {
      // Buscar el primer error de validación para mostrar al usuario
      const firstError = Object.keys(errors).find(key => errors[key as keyof typeof errors]);
      if (firstError && errors[firstError as keyof typeof errors]) {
        // Mostrar mensaje de error específico (RF-11: Mensajes de Retroalimentación)
        Toast.show({
          type: 'error',
          text1: 'Error de validación',
          text2: errors[firstError as keyof typeof errors],
        });
      }
      return;
    }
    // Si la validación es exitosa, proceder con el guardado
    handleSubmit(performSave);
  };

  return (
    /* RF-13: Pantalla principal de edición de perfil con animaciones suaves */
    <AnimatedScreen animationType="slideVertical" duration={800}>
      <ScrollView contentContainerStyle={commonContainers.screenContainer}>
        {/* RF-13: Título principal de la pantalla de edición */}
        <Animated.Text 
          entering={FadeInDown.duration(800)}
          style={commonTexts.title}
        >
          Editar Perfil
        </Animated.Text>

        {/* RF-13: Campo de entrada para nombres del ciudadano */}
        <Animated.Text 
          entering={FadeInUp.delay(100).duration(800)}
          style={commonTexts.subtitle}
        >
          Nombres
        </Animated.Text>
        <Animated.View 
          entering={FadeInUp.delay(200).duration(800)}
          style={commonContainers.inputContainer}
        >
          <Icon name="account" size={20} color={colors.gray600} style={commonInputs.icon} />
          <TextInput
            style={[
              commonInputs.authInput,
              errors.firstName && touched.firstName && commonInputs.textInputError
            ]}
            {...getFieldProps('firstName')}
            placeholder="Nombres"
            placeholderTextColor={colors.gray500}
          />
        </Animated.View>
        {/* RF-13: Mensaje de error para validación de nombres */}
        {errors.firstName && touched.firstName && (
          <Text style={commonTexts.errorText}>{errors.firstName}</Text>
        )}

        {/* RF-13: Campo de entrada para apellidos del ciudadano */}
        <Animated.Text 
          entering={FadeInUp.delay(300).duration(800)}
          style={commonTexts.subtitle}
        >
          Apellidos
        </Animated.Text>
        <Animated.View 
          entering={FadeInUp.delay(400).duration(800)}
          style={commonContainers.inputContainer}
        >
          <Icon name="account-box" size={20} color={colors.gray600} style={commonInputs.icon} />
          <TextInput
            style={[
              commonInputs.authInput,
              errors.lastName && touched.lastName && commonInputs.textInputError
            ]}
            {...getFieldProps('lastName')}
            placeholder="Apellidos"
            placeholderTextColor={colors.gray500}
          />
        </Animated.View>
        {/* RF-13: Mensaje de error para validación de apellidos */}
        {errors.lastName && touched.lastName && (
          <Text style={commonTexts.errorText}>{errors.lastName}</Text>
        )}

        {/* RF-13: Campo de entrada para DNI del ciudadano con validación numérica */}
        <Animated.Text 
          entering={FadeInUp.delay(500).duration(800)}
          style={commonTexts.subtitle}
        >
          DNI
        </Animated.Text>
        <Animated.View 
          entering={FadeInUp.delay(600).duration(800)}
          style={commonContainers.inputContainer}
        >
          <Icon name="card-account-details" size={20} color={colors.gray600} style={commonInputs.icon} />
          <TextInput
            style={[
              commonInputs.authInput,
              errors.dni && touched.dni && commonInputs.textInputError
            ]}
            {...getFieldProps('dni')}
            placeholder="DNI"
            placeholderTextColor={colors.gray500}
            keyboardType="numeric"
            maxLength={8}
          />
        </Animated.View>
        {/* RF-13: Mensaje de error para validación de DNI */}
        {errors.dni && touched.dni && (
          <Text style={commonTexts.errorText}>{errors.dni}</Text>
        )}

        {/* RF-13: Campo de entrada para teléfono del ciudadano con validación numérica */}
        <Animated.Text 
          entering={FadeInUp.delay(700).duration(800)}
          style={commonTexts.subtitle}
        >
          Teléfono
        </Animated.Text>
        <Animated.View 
          entering={FadeInUp.delay(800).duration(800)}
          style={commonContainers.inputContainer}
        >
          <Icon name="phone" size={20} color={colors.gray600} style={commonInputs.icon} />
          <TextInput
            style={[
              commonInputs.authInput,
              errors.phone && touched.phone && commonInputs.textInputError
            ]}
            {...getFieldProps('phone')}
            placeholder="Teléfono"
            placeholderTextColor={colors.gray500}
            keyboardType="numeric"
            maxLength={9}
          />
        </Animated.View>
        {/* RF-13: Mensaje de error para validación de teléfono */}
        {errors.phone && touched.phone && (
          <Text style={commonTexts.errorText}>{errors.phone}</Text>
        )}

        {/* RF-13: Botón para guardar cambios del perfil con estado de carga */}
        <Animated.View entering={FadeInUp.delay(900).duration(800)}>
          <AnimatedButton
            style={[commonButtons.primaryButton, isSubmitting && commonButtons.buttonDisabled]}
            onPress={handleSaveProfile}
            disabled={isSubmitting}
            animationType="scale"
          >
            <View style={styles.buttonContent}>
              <Icon name="content-save" size={20} color={colors.white} style={{ marginRight: spacing.xs }} />
              <Animated.Text style={commonButtons.buttonText}>
                {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
              </Animated.Text>
            </View>
          </AnimatedButton>
        </Animated.View>

        {/* RF-11: Componente Toast para mensajes de retroalimentación */}
        <Toast />
      </ScrollView>
    </AnimatedScreen>
  );
};

export default CitizenProfileScreen;

const styles = StyleSheet.create({
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
