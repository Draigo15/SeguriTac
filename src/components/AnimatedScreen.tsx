import React, { useEffect } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import Constants from 'expo-constants';

interface AnimatedScreenProps {
  children: React.ReactNode;
  style?: ViewStyle;
  animationType?: 'fade' | 'slideUp' | 'slideLeft' | 'zoom' | 'slideHorizontal' | 'slideVertical' | 'rotateZoom';
  duration?: number;
  onAnimationComplete?: () => void;
}

/**
 * Componente que envuelve las pantallas con animaciones de entrada
 * Utiliza React Native Reanimated para crear transiciones fluidas
 */
const AnimatedScreen: React.FC<AnimatedScreenProps> = ({
  children,
  style,
  animationType = 'fade',
  duration = 400,
  onAnimationComplete,
}) => {
  const isDetoxE2E = !!Constants.expoConfig?.extra?.detoxE2E;
  // Valores compartidos para las animaciones
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(50);
  const translateX = useSharedValue(50);
  const scale = useSharedValue(0.9);
  const rotate = useSharedValue(-15);

  // Función que se ejecuta cuando la animación se completa
  const handleAnimationComplete = () => {
    if (onAnimationComplete) {
      onAnimationComplete();
    }
  };

  // Efecto para iniciar la animación al montar el componente
  useEffect(() => {
    // Configuración de la animación
    const animationConfig = {
      duration,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    };

    if (isDetoxE2E) {
      // En modo Detox E2E, evitar animaciones para no afectar visibilidad/estabilidad
      opacity.value = 1;
      translateY.value = 0;
      translateX.value = 0;
      scale.value = 1;
      rotate.value = 0;
      runOnJS(handleAnimationComplete)();
      return;
    }

    // Iniciar las animaciones
    opacity.value = withTiming(1, animationConfig, () => {
      runOnJS(handleAnimationComplete)();
    });
    
    translateY.value = withTiming(0, animationConfig);
    translateX.value = withTiming(0, animationConfig);
    scale.value = withTiming(1, animationConfig);
    rotate.value = withTiming(0, animationConfig);
  }, [isDetoxE2E, duration]);

  // Estilos animados basados en el tipo de animación
  const animatedStyle = useAnimatedStyle(() => {
    switch (animationType) {
      case 'slideUp':
      case 'slideVertical':
        return {
          opacity: opacity.value,
          transform: [{ translateY: translateY.value }],
        };
      case 'slideLeft':
        return {
          opacity: opacity.value,
          transform: [{ translateX: translateX.value }],
        };
      case 'slideHorizontal':
        return {
          opacity: opacity.value,
          transform: [{ translateX: translateX.value }],
        };
      case 'zoom':
        return {
          opacity: opacity.value,
          transform: [{ scale: scale.value }],
        };
      case 'rotateZoom':
        return {
          opacity: opacity.value,
          transform: [
            { scale: scale.value },
            { rotate: `${rotate.value}deg` }
          ],
        };
      case 'fade':
      default:
        return {
          opacity: opacity.value,
        };
    }
  });

  if (isDetoxE2E) {
    return (
      <View style={[styles.container, style]}>
        {children}
      </View>
    );
  }

  return (
    <Animated.View style={[styles.container, style, animatedStyle]}>
      {children}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default AnimatedScreen;