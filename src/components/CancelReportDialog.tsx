/**
 * CancelReportDialog.tsx - Componente de Diálogo de Confirmación
 * 
 * REQUERIMIENTOS IMPLEMENTADOS:
 * - RF-11: Mensajes de Retroalimentación - Diálogo de confirmación para cancelar reportes
 * 
 * FUNCIONALIDADES:
 * - Modal de confirmación con animaciones suaves
 * - Interfaz clara con iconos y mensajes descriptivos
 * - Botones de acción diferenciados (cancelar/confirmar)
 * - Retroalimentación visual inmediata al usuario
 * - Diseño responsivo y accesible
 * 
 * TECNOLOGÍAS:
 * - React Native Modal para overlay
 * - Reanimated para animaciones fluidas
 * - Iconos vectoriales para mejor UX
 */

import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSizes, shadows } from '../theme';
import Animated, { FadeIn, SlideInDown, FadeOut, SlideOutDown } from 'react-native-reanimated';

// RF-11: Interfaz para props del diálogo de confirmación
// Define la estructura de datos necesaria para mostrar mensajes de retroalimentación
interface CancelReportDialogProps {
  visible: boolean;     // RF-11: Control de visibilidad del diálogo
  reportType: string;   // RF-11: Tipo de reporte para mensaje personalizado
  onCancel: () => void; // RF-11: Callback para cancelar acción
  onConfirm: () => void; // RF-11: Callback para confirmar acción
}

const { width } = Dimensions.get('window');

/**
 * CancelReportDialog - Componente de confirmación para cancelar reportes
 * 
 * RF-11: Implementa un diálogo modal que proporciona retroalimentación clara
 * al usuario antes de realizar acciones destructivas como cancelar un reporte.
 * 
 * CARACTERÍSTICAS:
 * - Mensaje personalizado según el tipo de reporte
 * - Animaciones suaves para mejor experiencia de usuario
 * - Botones claramente diferenciados para evitar errores
 * - Diseño centrado en la accesibilidad y usabilidad
 */
const CancelReportDialog: React.FC<CancelReportDialogProps> = ({
  visible,
  reportType,
  onCancel,
  onConfirm,
}) => {
  return (
    /* RF-11: Modal principal para diálogo de confirmación */
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onCancel} // RF-11: Permite cerrar con botón de retroceso
    >
      {/* RF-11: Overlay con animación de entrada/salida para retroalimentación visual */}
      <Animated.View 
        testID="cancel-dialog"
        entering={FadeIn.duration(200)}
        exiting={FadeOut.duration(150)}
        style={styles.overlay}
      >
        {/* RF-11: Área táctil para cerrar diálogo tocando fuera */}
        <TouchableOpacity 
          style={styles.overlayTouch} 
          activeOpacity={1} 
          onPress={onCancel} // RF-11: Retroalimentación intuitiva para cerrar
        />
        
        {/* RF-11: Contenedor principal del diálogo con animación deslizante */}
        <Animated.View 
          entering={SlideInDown.duration(300).springify()}
          exiting={SlideOutDown.duration(200)}
          style={styles.dialogContainer}
        >
          {/* RF-11: Icono de advertencia para retroalimentación visual clara */}
          <View style={styles.iconContainer}>
            <Ionicons 
              name="warning" 
              size={48} 
              color={colors.warning || '#FF9500'} 
            />
          </View>

          {/* RF-11: Título claro y directo para el usuario */}
          <Text style={styles.title}>¿Cancelar reporte?</Text>
          
          {/* RF-11: Mensaje descriptivo con información específica del reporte */}
          <Text style={styles.message}>
            ¿Estás seguro de que deseas cancelar este reporte de 
            <Text style={styles.reportTypeText}>"{reportType}"</Text>?
            {"\n\n"}Esta acción no se puede deshacer.
          </Text>

          {/* RF-11: Contenedor de botones de acción para retroalimentación del usuario */}
          <View style={styles.buttonsContainer}>
            {/* RF-11: Botón para mantener el reporte (acción segura) */}
            <TouchableOpacity 
              testID="no-cancel-button"
              style={[styles.button, styles.cancelButton]} 
              onPress={onCancel} // RF-11: Acción no destructiva
              activeOpacity={0.8}
            >
              <Ionicons name="close" size={20} color={colors.gray600} />
              <Text style={styles.cancelButtonText}>No cancelar</Text>
            </TouchableOpacity>

            {/* RF-11: Botón para confirmar cancelación (acción destructiva) */}
            <TouchableOpacity 
              testID="confirm-cancel-button"
              style={[styles.button, styles.confirmButton]} 
              onPress={onConfirm} // RF-11: Acción destructiva con confirmación
              activeOpacity={0.8}
            >
              <Ionicons name="trash" size={20} color="#FFFFFF" />
              <Text style={styles.confirmButtonText}>Sí, cancelar</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  overlayTouch: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  dialogContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: spacing.xl,
    width: width - (spacing.lg * 2),
    maxWidth: 400,
    alignItems: 'center',
    ...shadows.lg,
    ...(Platform.OS === 'android' ? {
      elevation: 10,
    } : {}),
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 149, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: fontSizes.xl,
    fontWeight: '700',
    color: colors.gray800,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  message: {
    fontSize: fontSizes.md,
    color: colors.gray600,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.xl,
  },
  reportTypeText: {
    fontWeight: '600',
    color: colors.primary,
  },
  buttonsContainer: {
    flexDirection: 'row',
    width: '100%',
    gap: spacing.md,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: 12,
    gap: spacing.xs,
  },
  cancelButton: {
    backgroundColor: colors.gray100,
    borderWidth: 1,
    borderColor: colors.gray300,
  },
  cancelButtonText: {
    fontSize: fontSizes.md,
    fontWeight: '600',
    color: colors.gray600,
  },
  confirmButton: {
    backgroundColor: '#FF4757',
  },
  confirmButtonText: {
    fontSize: fontSizes.md,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default CancelReportDialog;