import { Easing } from 'react-native-reanimated';

/**
 * Configuraciones de transiciones personalizadas para la navegación
 * Utiliza React Native Reanimated para crear animaciones fluidas
 */

// Duración base para las animaciones (en milisegundos)
const DURATION = 400;

// Transición con desvanecimiento suave
export const fadeTransition = {
  gestureEnabled: true,
  transitionSpec: {
    open: {
      animation: 'timing',
      config: {
        duration: DURATION,
        easing: Easing.inOut(Easing.ease),
      },
    },
    close: {
      animation: 'timing',
      config: {
        duration: DURATION,
        easing: Easing.inOut(Easing.ease),
      },
    },
  },
  cardStyleInterpolator: ({ current }: { current: { progress: any } }) => ({
    cardStyle: {
      opacity: current.progress,
    },
  }),
};

// Transición con deslizamiento horizontal
export const slideHorizontalTransition = {
  gestureEnabled: true,
  transitionSpec: {
    open: {
      animation: 'timing',
      config: {
        duration: DURATION,
        easing: Easing.out(Easing.poly(4)),
      },
    },
    close: {
      animation: 'timing',
      config: {
        duration: DURATION,
        easing: Easing.in(Easing.poly(4)),
      },
    },
  },
  cardStyleInterpolator: ({ current, layouts }: { current: { progress: any }, layouts: { screen: { width: number } } }) => {
    return {
      cardStyle: {
        transform: [
          {
            translateX: current.progress.interpolate({
              inputRange: [0, 1],
              outputRange: [layouts.screen.width, 0],
            }),
          },
        ],
      },
    };
  },
};

// Transición con deslizamiento vertical
export const slideVerticalTransition = {
  gestureEnabled: true,
  transitionSpec: {
    open: {
      animation: 'timing',
      config: {
        duration: DURATION,
        easing: Easing.out(Easing.poly(4)),
      },
    },
    close: {
      animation: 'timing',
      config: {
        duration: DURATION,
        easing: Easing.in(Easing.poly(4)),
      },
    },
  },
  cardStyleInterpolator: ({ current, layouts }: { current: { progress: any }, layouts: { screen: { height: number } } }) => {
    return {
      cardStyle: {
        transform: [
          {
            translateY: current.progress.interpolate({
              inputRange: [0, 1],
              outputRange: [layouts.screen.height, 0],
            }),
          },
        ],
      },
    };
  },
};

// Transición con zoom
export const zoomTransition = {
  gestureEnabled: true,
  transitionSpec: {
    open: {
      animation: 'timing',
      config: {
        duration: DURATION,
        easing: Easing.out(Easing.poly(3)),
      },
    },
    close: {
      animation: 'timing',
      config: {
        duration: DURATION,
        easing: Easing.in(Easing.poly(3)),
      },
    },
  },
  cardStyleInterpolator: ({ current }: { current: { progress: any } }) => {
    return {
      cardStyle: {
        opacity: current.progress,
        transform: [
          {
            scale: current.progress.interpolate({
              inputRange: [0, 1],
              outputRange: [0.85, 1],
            }),
          },
        ],
      },
    };
  },
};

// Transición con rotación y zoom
export const rotateZoomTransition = {
  gestureEnabled: true,
  transitionSpec: {
    open: {
      animation: 'timing',
      config: {
        duration: DURATION + 100,
        easing: Easing.bezier(0.2, 0.65, 0.4, 0.9),
      },
    },
    close: {
      animation: 'timing',
      config: {
        duration: DURATION,
        easing: Easing.bezier(0.5, 0.05, 1, 0.5),
      },
    },
  },
  cardStyleInterpolator: ({ current }: { current: { progress: any } }) => {
    return {
      cardStyle: {
        opacity: current.progress,
        transform: [
          {
            scale: current.progress.interpolate({
              inputRange: [0, 1],
              outputRange: [0.5, 1],
            }),
          },
          {
            rotate: current.progress.interpolate({
              inputRange: [0, 1],
              outputRange: ['10deg', '0deg'],
            }),
          },
        ],
      },
    };
  },
};