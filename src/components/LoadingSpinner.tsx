/**
 * Componente de carga reutilizable
 * Utiliza los estilos comunes del tema para mantener consistencia
 */

import React from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import {
  colors,
  commonLoading,
  spacing,
  fontSizes,
} from '../theme';

interface LoadingSpinnerProps {
  /** Texto a mostrar debajo del spinner */
  text?: string;
  /** Tamaño del spinner */
  size?: 'small' | 'large';
  /** Color del spinner */
  color?: string;
  /** Si debe ocupar toda la pantalla */
  fullScreen?: boolean;
  /** Estilo personalizado para el contenedor */
  containerStyle?: ViewStyle;
  /** Estilo personalizado para el texto */
  textStyle?: TextStyle;
  /** Si debe mostrar un fondo semi-transparente */
  overlay?: boolean;
}

/**
 * Componente de spinner de carga con texto opcional
 */
export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  text = 'Cargando...',
  size = 'large',
  color = colors.white,
  fullScreen = false,
  containerStyle,
  textStyle,
  overlay = false,
}) => {
  const getContainerStyle = (): ViewStyle => {
    let baseStyle: ViewStyle = { ...styles.container };
    
    if (fullScreen) {
      baseStyle = { ...baseStyle, ...commonLoading.loadingContainer };
    }
    
    if (overlay) {
      baseStyle = { ...baseStyle, ...styles.overlay };
    }
    
    if (containerStyle) {
      baseStyle = { ...baseStyle, ...containerStyle };
    }
    
    return baseStyle;
  };

  const getTextStyle = (): TextStyle => {
    let baseStyle: TextStyle = { ...commonLoading.loadingText };
    
    if (textStyle) {
      baseStyle = { ...baseStyle, ...textStyle };
    }
    
    return baseStyle;
  };

  return (
    <View style={getContainerStyle()}>
      <ActivityIndicator 
        size={size} 
        color={color} 
        style={styles.spinner}
      />
      {text && (
        <Text style={getTextStyle()}>
          {text}
        </Text>
      )}
    </View>
  );
};

/**
 * Componente de carga para pantalla completa con overlay
 */
export const FullScreenLoader: React.FC<{
  text?: string;
  visible?: boolean;
}> = ({ text = 'Cargando...', visible = true }) => {
  if (!visible) return null;
  
  return (
    <LoadingSpinner
      text={text}
      fullScreen
      overlay
      containerStyle={styles.fullScreenOverlay}
    />
  );
};

/**
 * Componente de carga inline para usar dentro de otros componentes
 */
export const InlineLoader: React.FC<{
  text?: string;
  size?: 'small' | 'large';
  color?: string;
}> = ({ text, size = 'small', color = colors.secondary }) => {
  return (
    <LoadingSpinner
      text={text}
      size={size}
      color={color}
      containerStyle={styles.inlineContainer}
      textStyle={styles.inlineText}
    />
  );
};

/**
 * Componente de carga para botones
 */
export const ButtonLoader: React.FC<{
  size?: 'small' | 'large';
  color?: string;
}> = ({ size = 'small', color = colors.white }) => {
  return (
    <ActivityIndicator 
      size={size} 
      color={color}
      style={styles.buttonSpinner}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
  },
  spinner: {
    marginBottom: spacing.sm,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 1000,
  },
  fullScreenOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 43, 127, 0.9)', // colors.primary con transparencia
    zIndex: 1000,
  },
  inlineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
  },
  inlineText: {
    fontSize: fontSizes.sm,
    color: colors.gray600,
    marginLeft: spacing.sm,
  },
  buttonSpinner: {
    marginHorizontal: spacing.sm,
  },
});

export default LoadingSpinner;