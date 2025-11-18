/**
 * ReportScreen.tsx
 * 
 * Pantalla principal para crear y enviar reportes de incidentes de seguridad ciudadana.
 * Permite a los usuarios reportar diferentes tipos de incidentes con información detallada,
 * ubicación automática, imágenes y descripción del evento.
 * 
 * Funcionalidades principales:
 * - Captura automática de fecha y ubicación GPS
 * - Selección de tipo de incidente mediante picker
 * - Captura de imágenes con cámara
 * - Validación de campos requeridos
 * - Envío seguro a Firebase Firestore
 * - Manejo de permisos de ubicación y cámara
 * - Feedback visual con animaciones y toasts
 * 
 * @author Equipo de Desarrollo
 * @version 1.0.0
 * @date 2024
 */

// Imports de React y React Native core
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  Platform,
  Alert,
  Image,
  TouchableOpacity,
} from 'react-native';

// Componentes personalizados y animaciones
import AnimatedScreen from '../components/AnimatedScreen';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import AnimatedButton from '../components/AnimatedButton';

// Componentes de terceros
import { Picker } from '@react-native-picker/picker';
import { ActivityIndicator } from 'react-native-paper';

// Firebase y servicios
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../services/firebase';

// Navegación y notificaciones
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import Toast from 'react-native-toast-message';
import { logMetric } from '../utils/metrics';

// Hooks optimizados para móvil
import { useReportForm } from '../hooks/useForm';
import { useLocation } from '../hooks/useLocation';
import { useReportCamera } from '../hooks/useCamera';
import { uploadImageToStorage } from '../services/imageUploadService';

// Tema y estilos
import { 
  colors, 
  spacing, 
  fontSizes,
  commonContainers,
  commonTexts,
  commonInputs,
  commonButtons
} from '../theme';

/**
 * Componente principal de la pantalla de reportes
 * 
 * Funcionalidades principales:
 * - Gestión de formulario de reporte con validación
 * - Captura automática de ubicación GPS
 * - Integración con cámara para evidencia fotográfica
 * - Envío seguro de datos a Firebase Firestore
 * - Manejo de estados de carga y errores
 * - Animaciones fluidas para mejor UX
 * 
 * @returns {JSX.Element} Componente de la pantalla de reportes
 */
const ReportScreen = () => {
  // Hook de navegación
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  
  // Hooks optimizados para móvil
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
  } = useReportForm();
  
  const {
    location,
    error: locationError,
    loading: locationLoading,
    hasPermission: locationPermission,
    requestPermission: requestLocationPermission,
    getCurrentLocation,
  } = useLocation({ enableHighAccuracy: true, timeout: 10000 });
  
  const {
    isLoading: cameraLoading,
    error: cameraError,
    hasPermission: cameraPermission,
    takeReportPhoto,
    pickReportImage,
  } = useReportCamera();
  
  // Local image state
  const [image, setImage] = useState<string | null>(null);
  
  // Estados adicionales
  const [dateFormatted, setDateFormatted] = useState(''); // Fecha formateada del reporte
  
  /**
   * Función para limpiar la imagen seleccionada del reporte
   * 
   * Remueve la imagen actual del estado local, permitiendo al usuario
   * seleccionar una nueva imagen o enviar el reporte sin evidencia fotográfica.
   * 
   * Casos de uso:
   * - Usuario quiere cambiar la imagen capturada
   * - Imagen seleccionada por error
   * - Reporte sin evidencia fotográfica
   * 
   * @function clearImage
   */
  const clearImage = () => {
    setImage(null);
  };
  
  /**
   * Función para capturar una nueva foto usando la cámara del dispositivo
   * 
   * Utiliza el hook useReportCamera optimizado que maneja automáticamente:
   * - Solicitud de permisos de cámara
   * - Configuración optimizada para reportes (calidad, compresión)
   * - Manejo de errores y estados de carga
   * - Compatibilidad multiplataforma (iOS/Android)
   * 
   * Flujo de captura:
   * 1. Verifica permisos de cámara
   * 2. Abre interfaz nativa de cámara
   * 3. Captura imagen con configuración optimizada
   * 4. Comprime imagen automáticamente
   * 5. Actualiza estado local con URI de imagen
   * 
   * @async
   * @function takePhoto
   * @throws {Error} Error de permisos o captura de imagen
   */
  const takePhoto = async () => {
    try {
      const result = await takeReportPhoto();
      if (result) {
        setImage(result.uri);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
    }
  };
  
  /**
   * Función para seleccionar imagen desde la galería del dispositivo
   * 
   * Permite al usuario elegir una imagen existente de su galería para
   * adjuntar como evidencia al reporte de incidente.
   * 
   * Características:
   * - Acceso a galería con permisos automáticos
   * - Filtrado por tipo de archivo (imágenes)
   * - Compresión automática para optimizar tamaño
   * - Extracción de metadatos de ubicación si disponible
   * - Compatibilidad con múltiples formatos (JPEG, PNG, HEIC)
   * 
   * Flujo de selección:
   * 1. Solicita permisos de galería/MediaLibrary
   * 2. Abre selector nativo de imágenes
   * 3. Usuario selecciona imagen
   * 4. Procesa y comprime imagen
   * 5. Actualiza estado con URI procesada
   * 
   * @async
   * @function pickFromGallery
   * @throws {Error} Error de permisos o selección de imagen
   */
  const pickFromGallery = async () => {
    try {
      const result = await pickReportImage();
      if (result) {
        setImage(result.uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
    }
  };

  /**
   * Hook de efecto para inicialización de datos del reporte
   * 
   * Ejecuta las siguientes tareas al montar el componente:
   * 1. Captura la fecha y hora actual formateada
   * 2. Los permisos de ubicación y GPS se manejan automáticamente con useLocation
   * 3. Los permisos de cámara se manejan automáticamente con useCamera
   */
  useEffect(() => {
    // Capturar fecha y hora actual en formato local peruano
    const currentDate = new Date().toLocaleString('es-PE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
    setDateFormatted(currentDate);
  }, []); // Ejecutar solo al montar el componente

  // Efecto para manejar errores de ubicación
  useEffect(() => {
    if (locationError) {
      Toast.show({
        type: 'error',
        text1: 'Error de ubicación',
        text2: locationError,
      });
    }
  }, [locationError]);

  // Efecto para manejar errores de cámara
  useEffect(() => {
    if (cameraError) {
      Toast.show({
        type: 'error',
        text1: 'Error de cámara',
        text2: cameraError,
      });
    }
  }, [cameraError]);

  /**
   * Manejador de eventos para captura de imagen desde cámara
   * 
   * Función wrapper que coordina la captura de imagen y proporciona
   * feedback visual al usuario mediante notificaciones toast.
   * 
   * Funcionalidades integradas:
   * - Invoca función de captura optimizada (takePhoto)
   * - Manejo de errores con logging detallado
   * - Feedback inmediato con Toast notifications
   * - Validación de resultado de captura
   * 
   * Flujo de interacción:
   * 1. Usuario presiona botón de cámara
   * 2. Se ejecuta captura con permisos automáticos
   * 3. Si es exitosa, muestra toast de confirmación
   * 4. Si falla, registra error en consola
   * 
   * @async
   * @function handleImagePick
   * @throws {Error} Errores de cámara o permisos
   */
  const handleImagePick = async () => {
    try {
      await takePhoto();
      if (image) {
        Toast.show({
          type: 'success',
          text1: 'Imagen capturada',
          text2: 'Foto agregada al reporte',
        });
      }
    } catch (error) {
      console.error('❌ Error capturando imagen:', error);
    }
  };

  /**
   * Manejador de eventos para selección de imagen desde galería
   * 
   * Función wrapper que coordina la selección de imagen desde galería
   * y proporciona feedback visual al usuario.
   * 
   * Características:
   * - Invoca función de selección optimizada (pickFromGallery)
   * - Manejo robusto de errores con logging
   * - Notificaciones toast para confirmación
   * - Validación de imagen seleccionada
   * 
   * Flujo de interacción:
   * 1. Usuario presiona botón de galería
   * 2. Se abre selector nativo de imágenes
   * 3. Usuario selecciona imagen
   * 4. Si es exitosa, muestra toast de confirmación
   * 5. Si falla, registra error para debugging
   * 
   * @async
   * @function handleGalleryPick
   * @throws {Error} Errores de galería o permisos
   */
  const handleGalleryPick = async () => {
    try {
      await pickFromGallery();
      if (image) {
        Toast.show({
          type: 'success',
          text1: 'Imagen seleccionada',
          text2: 'Foto agregada al reporte',
        });
      }
    } catch (error) {
      console.error('❌ Error seleccionando imagen:', error);
    }
  };

  /**
   * Función para validar campos del formulario antes del envío
   * 
   * Utiliza el hook useForm optimizado que maneja:
   * 1. Validaciones automáticas en tiempo real
   * 2. Estados de error y validez
   * 3. Manejo de envío optimizado
   * 
   * @function validateAndConfirm
   */
  const validateAndConfirm = () => {
    // El hook useForm ya maneja las validaciones automáticamente
    if (!isValid) {
      // Mostrar errores específicos si existen
      const firstError = Object.values(errors)[0];
      if (firstError) {
        Toast.show({
          type: 'error',
          text1: 'Error de validación',
          text2: firstError,
        });
      }
      return;
    }

    // Si todas las validaciones pasan, mostrar confirmación
    showConfirmationAlert();
  };

  /**
   * Muestra una alerta de confirmación antes de enviar el reporte
   * 
   * Permite al usuario revisar su decisión antes de enviar el reporte,
   * evitando envíos accidentales y dando la oportunidad de cancelar.
   * 
   * @function showConfirmationAlert
   */
  const showConfirmationAlert = () => {
    Alert.alert(
      '¿Enviar reporte?',
      '¿Estás seguro de que deseas enviar este reporte? Una vez enviado, será revisado por las autoridades.',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Enviar',
          style: 'default',
          onPress: handleSubmitReport,
        },
      ],
      { cancelable: true }
    );
  };

  /**
   * Función principal para enviar el reporte a Firebase
   * 
   * Utiliza los hooks optimizados para:
   * 1. Manejo automático de estados de carga
   * 2. Validación automática de formulario
   * 3. Procesamiento optimizado de imágenes
   * 4. Manejo robusto de errores
   * 
   * @async
   * @function performSubmit
   */
  const performSubmit = async () => {
    const t0 = Date.now();
    try {
      console.log('📤 Iniciando envío de reporte...');

      let imageUrl = null;
      let imageBase64 = null;

      // Procesar imagen si existe
      if (image) {
        console.log('🖼️ Procesando imagen...');
        
        if (Platform.OS === 'web') {
          // En web, subir imagen a Firebase Storage
          try {
            imageUrl = await uploadImageToStorage(image, 'reports');
            console.log('✅ Imagen subida a Storage:', imageUrl);
          } catch (uploadError) {
            console.error('❌ Error subiendo imagen:', uploadError);
            Toast.show({
              type: 'error',
              text1: 'Error al subir imagen',
              text2: 'El reporte se enviará sin imagen',
            });
          }
        } else {
          // En móvil, convertir a base64 para mejor rendimiento
          try {
            const response = await fetch(image);
            const blob = await response.blob();
            const reader = new FileReader();
            
            imageBase64 = await new Promise((resolve, reject) => {
              reader.onloadend = () => resolve(reader.result);
              reader.onerror = reject;
              reader.readAsDataURL(blob);
            });
            
            console.log('✅ Imagen convertida a base64');
          } catch (base64Error) {
            console.error('❌ Error convirtiendo imagen:', base64Error);
            Toast.show({
              type: 'error',
              text1: 'Error procesando imagen',
              text2: 'El reporte se enviará sin imagen',
            });
          }
        }
      }

      // Crear objeto de datos del reporte usando valores del hook useForm
      const reportData = {
        incidentType: values.incidentType,
        description: values.description.trim(),
        location: location || null,
        timestamp: new Date().toISOString(),
        dateFormatted,
        imageUrl: imageUrl || null,
        imageBase64: imageBase64 || null,
        status: 'Pendiente',
        email: auth.currentUser?.email || null,
        platform: Platform.OS,
        createdAt: serverTimestamp(),
      };

      console.log('📋 Datos del reporte preparados:', {
        ...reportData,
        imageBase64: imageBase64 ? '[BASE64_DATA]' : null,
      });

      // Guardar en Firestore
      const docRef = await addDoc(collection(db, 'reports'), reportData);
      console.log('✅ Reporte guardado con ID:', docRef.id);

      // Métrica end-to-end del envío de reporte
      logMetric('report_submit_ms', Date.now() - t0, {
        docId: docRef.id,
        incidentType: values.incidentType,
        withImage: Boolean(imageUrl || imageBase64),
        platform: Platform.OS,
      });

      // Mostrar éxito
      Toast.show({
        type: 'success',
        text1: 'Reporte enviado',
        text2: 'Tu reporte ha sido enviado exitosamente',
        visibilityTime: 3000,
      });

      // Limpiar formulario usando el hook
      clearImage();
      
      // Navegar a MyReports
      navigation.navigate('MyReports');
      
    } catch (error) {
      // Métrica de error de envío
      logMetric('report_submit_error_ms', Date.now() - t0, {
        platform: Platform.OS,
        hasImage: Boolean(image),
      });
      console.error('❌ Error enviando reporte:', error);
      Toast.show({
        type: 'error',
        text1: 'Error al enviar',
        text2: 'No se pudo enviar el reporte. Intenta nuevamente.',
      });
      throw error; // Re-lanzar para que useForm maneje el estado
    }
  };

  // Función que maneja el envío usando useForm
  const handleSubmitReport = handleSubmit(performSubmit);

  // Renderizado del componente con estructura completa de UI
  return (
    <AnimatedScreen animationType="slideVertical" duration={800}>
      {/* Fondo azul consistente con las demás vistas */}
      <View style={styles.darkContainer}>
        {/* ScrollView para contenido desplazable */}
        <ScrollView contentContainerStyle={styles.container}>
      {/* Encabezado principal con animación de entrada */}
      <Animated.View entering={FadeInDown.duration(800)}>
        <Animated.Text style={styles.title}>Nuevo Reporte</Animated.Text>
        <Animated.Text style={styles.subtitle}>
          Tu reporte ayuda a mantener la seguridad
        </Animated.Text>
      </Animated.View>

      {/* Información de contexto: fecha y ubicación */}
      <Animated.View entering={FadeInDown.duration(1000).delay(200)}>
        <Animated.Text style={styles.dateText}>
          📅 {dateFormatted} {/* Fecha formateada del reporte */}
        </Animated.Text>
        
        {/* Sección de información de ubicación con indicadores de estado */}
        <Animated.View style={styles.locationContainer}>
          <Text style={styles.locationLabel}>📍 Ubicación:</Text>
          {locationLoading ? (
            <View style={styles.statusContainer}>
              <ActivityIndicator size="small" color="#4A90E2" />
              <Text style={styles.locationText}>Obteniendo ubicación...</Text>
            </View>
          ) : location ? (
            <Text style={styles.locationText}>
              Lat: {location.latitude.toFixed(6)}, Lng: {location.longitude.toFixed(6)}
            </Text>
          ) : (
            <View style={styles.statusContainer}>
              <Text style={styles.errorText}>❌ Ubicación no disponible</Text>
              {!locationPermission && (
                <TouchableOpacity 
                  style={styles.retryButton} 
                  onPress={requestLocationPermission}
                >
                  <Text style={styles.retryButtonText}>Solicitar permisos</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </Animated.View>
      </Animated.View>

        {/* Selector de tipo de incidente */}
        <Animated.Text 
          entering={FadeInDown.delay(300).duration(500)}
          style={styles.label}
        >
          Tipo de Incidente
        </Animated.Text>
        <Animated.View 
          entering={FadeInDown.delay(400).duration(500)}
          style={styles.pickerContainer}
        >
          {/* Picker para seleccionar categoría del incidente */}
          <Picker
            testID="incident-type-picker"
            selectedValue={values.incidentType}
            onValueChange={handleChange('incidentType')}
            dropdownIconColor="#000"
          >
            <Picker.Item label="Selecciona un tipo..." value="" />
            <Picker.Item label="Robo" value="Robo" />
            <Picker.Item label="Secuestro" value="Secuestro" />
            <Picker.Item label="Asalto" value="Asalto" />
            <Picker.Item label="Violencia" value="Violencia" />
            <Picker.Item label="Accidente" value="Accidente" />
            <Picker.Item label="Otro" value="Otro" />
          </Picker>
          {errors.incidentType && touched.incidentType && (
            <Text style={styles.errorText}>{errors.incidentType}</Text>
          )}
        </Animated.View>

        {/* Campo de descripción detallada */}
        <Animated.Text 
          entering={FadeInDown.delay(500).duration(500)}
          style={styles.label}
        >
          📝 Descripción:
        </Animated.Text>
        <Animated.View entering={FadeInDown.delay(600).duration(500)}>
          {/* TextInput multilínea para descripción detallada */}
          <TextInput
            testID="report-description-input"
            style={[styles.input, { height: 100 }]}
            placeholder="Describe el incidente en detalle..."
            {...getFieldProps('description')}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            placeholderTextColor="#666"
          />
          {errors.description && touched.description && (
            <Text style={styles.errorText}>{errors.description}</Text>
          )}
        </Animated.View>

        {/* Botón para capturar imagen de evidencia con indicadores de estado */}
        <Animated.View entering={FadeInUp.delay(600).duration(500)}>
          <Text style={styles.label}>📷 Evidencia fotográfica:</Text>
          
          {/* Indicador de estado de cámara */}
          {!cameraPermission && (
            <View style={styles.statusContainer}>
              <Text style={styles.warningText}>⚠️ Permisos de cámara requeridos</Text>
            </View>
          )}
          
          <View style={styles.imageButtonsContainer}>
             <AnimatedButton 
               style={[styles.imageButton, cameraLoading && { opacity: 0.7 }]} 
               onPress={handleImagePick}
               disabled={cameraLoading}
               animationType="scale"
               iconName="camera"
             >
               {cameraLoading ? (
                 <View style={styles.statusContainer}>
                   <ActivityIndicator size="small" color="#fff" />
                   <Text style={styles.imageButtonText}>Procesando...</Text>
                 </View>
               ) : (
                 <Animated.Text style={styles.imageButtonText}>📷 Tomar foto</Animated.Text>
               )}
             </AnimatedButton>
             
             <AnimatedButton 
               style={[styles.imageButton, styles.galleryButton, cameraLoading && { opacity: 0.7 }]} 
               onPress={handleGalleryPick}
               disabled={cameraLoading}
               animationType="scale"
               iconName="image"
             >
               <Animated.Text style={styles.imageButtonText}>🖼️ Galería</Animated.Text>
             </AnimatedButton>
           </View>
        </Animated.View>

        {/* Vista previa de imagen capturada */}
        {image && (
          <Animated.View entering={FadeInUp.delay(700).duration(500)}>
            <Animated.Image source={{ uri: image }} style={styles.imagePreview} />
            <View style={styles.imageActions}>
              <Text style={styles.imageText}>✅ Imagen capturada</Text>
              <TouchableOpacity 
                style={styles.removeImageButton} 
                onPress={clearImage}
              >
                <Text style={styles.removeImageText}>🗑️ Eliminar</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}

       {/* Botón principal para enviar el reporte */}
        <Animated.View entering={FadeInUp.delay(800).duration(500)}>
          <AnimatedButton
             style={[styles.sendButton, isSubmitting && { opacity: 0.7 }]}
             onPress={validateAndConfirm}
             disabled={isSubmitting}
             animationType="bounce"
             iconName="send"
           >
             {isSubmitting ? (
               <ActivityIndicator size="small" color="#fff" />
             ) : (
               <Animated.Text style={styles.sendButtonText}>Enviar Reporte</Animated.Text>
             )}
           </AnimatedButton>
        </Animated.View>
     </ScrollView>
      </View>
   </AnimatedScreen>
  );
 };

/**
 * Exportación por defecto del componente ReportScreen
 * 
 * Pantalla principal para el reporte de incidentes de seguridad ciudadana.
 * Integra captura de ubicación, selección de tipo de incidente, descripción
 * detallada, captura de evidencia fotográfica y envío a Firebase Firestore.
 * 
 * Utilizada en la navegación principal de la aplicación para permitir
 * a los ciudadanos reportar situaciones que requieren atención de las autoridades.
 */
export default ReportScreen;

/**
 * Estilos específicos para ReportScreen
 * 
 * Define la apariencia visual de todos los elementos del formulario de reporte,
 * incluyendo contenedores, textos, inputs, botones y animaciones.
 * Complementa los estilos del tema global con elementos específicos de esta pantalla.
 * 
 * Categorías de estilos:
 * - Contenedores y layout
 * - Textos y etiquetas
 * - Campos de entrada (inputs, picker)
 * - Botones y elementos interactivos
 * - Estados especiales (carga, deshabilitado)
 */
const styles = StyleSheet.create({
  darkContainer: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  container: {
    flexGrow: 1,
    padding: spacing.lg,
  },
  title: {
    fontSize: fontSizes.xl,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: spacing.lg,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  subtitle: {
    fontSize: fontSizes.base,
    color: '#E3F2FD',
    textAlign: 'center',
    marginBottom: spacing.lg,
    fontWeight: '500',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  dateText: {
    fontSize: fontSizes.sm,
    color: '#FFFFFF',
    marginBottom: spacing.xs,
    textAlign: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 20,
    alignSelf: 'center',
    overflow: 'hidden',
    fontWeight: '600',
  },
  locationText: {
    fontSize: fontSizes.sm,
    color: '#FFFFFF',
    marginBottom: spacing.lg,
    textAlign: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 20,
    alignSelf: 'center',
    overflow: 'hidden',
    fontWeight: '600',
  },
  box: {
    backgroundColor: colors.white,
    borderRadius: 10,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: colors.secondary,
  },
  labelLight: {
    fontSize: fontSizes.sm,
    color: colors.gray600,
  },
  value: {
    fontSize: fontSizes.base,
    fontWeight: '600',
    marginTop: spacing.xs,
  },
  label: {
    fontSize: fontSizes.base,
    color: '#FFFFFF',
    marginBottom: spacing.xs,
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  pickerContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 15,
    marginBottom: spacing.md,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: spacing.md,
    borderRadius: 15,
    marginBottom: spacing.lg,
    fontSize: fontSizes.sm,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    color: colors.gray900,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  imageButton: {
    backgroundColor: '#FF6B35',
    paddingVertical: spacing.md,
    borderRadius: 15,
    marginBottom: spacing.md,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  imageButtonText: {
    color: colors.white,
    fontSize: fontSizes.base,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  imagePreview: {
    width: '100%',
    height: 220,
    borderRadius: 20,
    marginBottom: spacing.lg,
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 12,
  },
  loading: {
    color: colors.primary,
    textAlign: 'center',
    marginBottom: spacing.sm,
    fontSize: fontSizes.base,
  },
  sendButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: spacing.lg,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 12,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    marginTop: spacing.md,
  },
  sendButtonText: {
    color: colors.white,
    fontSize: fontSizes.lg,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: fontSizes.sm,
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
    fontWeight: '500',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  locationContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 15,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  locationLabel: {
    fontSize: fontSizes.sm,
    color: '#FFFFFF',
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  warningText: {
    color: '#FFB74D',
    fontSize: fontSizes.sm,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  retryButton: {
    backgroundColor: 'rgba(74, 144, 226, 0.8)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 10,
    marginLeft: spacing.sm,
  },
  retryButtonText: {
     color: '#FFFFFF',
     fontSize: fontSizes.xs,
     fontWeight: '600',
   },
   imageButtonsContainer: {
     flexDirection: 'row',
     justifyContent: 'space-between',
     gap: spacing.md,
   },
   galleryButton: {
     backgroundColor: 'rgba(156, 39, 176, 0.8)',
   },
   imageActions: {
     flexDirection: 'row',
     justifyContent: 'space-between',
     alignItems: 'center',
     marginTop: spacing.sm,
     paddingHorizontal: spacing.sm,
   },
   removeImageButton: {
     backgroundColor: 'rgba(244, 67, 54, 0.8)',
     paddingHorizontal: spacing.md,
     paddingVertical: spacing.xs,
     borderRadius: 10,
   },
   removeImageText: {
     color: '#FFFFFF',
     fontSize: fontSizes.sm,
     fontWeight: '600',
   },
   imageText: {
     color: '#FFFFFF',
     fontSize: fontSizes.sm,
     fontWeight: '600',
     textShadowColor: 'rgba(0, 0, 0, 0.3)',
     textShadowOffset: { width: 1, height: 1 },
     textShadowRadius: 2,
   },
 });
