import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  ViewStyle,
  TextStyle,
  View,
  Platform,  
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';

interface AnimatedButtonProps {
  title?: string;
  onPress: () => void;
  style?: ViewStyle | any;
  textStyle?: TextStyle;
  icon?: string;
  iconName?: string;
  iconSize?: number;
  iconColor?: string;
  disabled?: boolean;
  animationType?: 'scale' | 'bounce' | 'highlight';
  children?: React.ReactNode;
  disableAndroidShadow?: boolean;
  testID?: string;
}

/**
 * Botón animado que proporciona retroalimentación visual al interactuar
 * Utiliza React Native Reanimated para crear animaciones fluidas
 */
const AnimatedButton: React.FC<AnimatedButtonProps> = ({
  title,
  onPress,
  style,
  textStyle,
  icon,
  iconName,
  iconSize = 20,
  iconColor = '#fff',
  disabled = false,
  animationType = 'scale',
  children,
   disableAndroidShadow = false, 
  testID,
}) => {
  // Valores compartidos para las animaciones
  const scale = useSharedValue(1);
  const translateY = useSharedValue(0);
  const backgroundColor = useSharedValue(0);

  // Función para manejar la animación al presionar
  const handlePressIn = () => {
    if (disabled) return;

    switch (animationType) {
      case 'scale':
        scale.value = withTiming(0.95, { duration: 100, easing: Easing.ease });
        break;
      case 'bounce':
        translateY.value = withTiming(5, { duration: 100, easing: Easing.ease });
        break;
      case 'highlight':
        backgroundColor.value = withTiming(1, { duration: 100, easing: Easing.ease });
        break;
    }
  };

  // Función para manejar la animación al soltar
  const handlePressOut = () => {
    if (disabled) return;

    switch (animationType) {
      case 'scale':
        scale.value = withTiming(1, { duration: 200, easing: Easing.ease });
        break;
      case 'bounce':
        translateY.value = withSequence(
          withTiming(-2, { duration: 100, easing: Easing.ease }),
          withDelay(
            50,
            withTiming(0, { duration: 100, easing: Easing.ease })
          )
        );
        break;
      case 'highlight':
        backgroundColor.value = withTiming(0, { duration: 200, easing: Easing.ease });
        break;
    }
  };

  // Estilos animados basados en el tipo de animación
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: scale.value },
        { translateY: translateY.value },
      ],
      // Solo aplicar backgroundColor para el tipo 'highlight'
      ...(animationType === 'highlight' && {
        backgroundColor: backgroundColor.value === 0 
          ? colors.secondary 
          : 'rgba(255, 255, 255, 0.2)'
      }),
    };
  });

  return (
    <TouchableWithoutFeedback
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress}
      disabled={disabled}
      testID={testID}
    >
      <Animated.View
        style={[
          styles.button,
          style,
          animatedStyle,
            (Platform.OS === 'android' && disableAndroidShadow) 
          ? { elevation: 0, shadowColor: 'transparent' } 
          : null,
          disabled && styles.disabled,
        ]}
      >
        {children ? (
          children
        ) : (
          <View style={styles.contentContainer}>
            {(icon || iconName) && (
              <Ionicons
                name={(iconName || icon) as any}
                size={iconSize}
                color={iconColor}
                style={styles.icon}
              />
            )}
            {title && (
              <Text style={[styles.text, textStyle, disabled && styles.disabledText]}>
                {title}
              </Text>
            )}
          </View>
        )}
      </Animated.View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: colors.secondary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    borderWidth: 0, // Eliminar cualquier borde
    overflow: 'hidden', // Para asegurar que el borderRadius funcione correctamente
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  icon: {
    marginRight: 8,
  },
  disabled: {
    backgroundColor: colors.gray400,
    elevation: 0,
  },
  disabledText: {
    color: colors.gray600,
  },
});

export default AnimatedButton;