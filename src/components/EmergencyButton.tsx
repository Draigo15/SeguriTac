import React, { useState } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  View,
  Animated as RNAnimated,
  Easing,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';

type EmergencyButtonNav = NativeStackNavigationProp<RootStackParamList>;

interface EmergencyButtonProps {
  style?: any;
}

const EmergencyButton: React.FC<EmergencyButtonProps> = ({ style }) => {
  const navigation = useNavigation<EmergencyButtonNav>();
  const [isPressed, setIsPressed] = useState(false);
  const [longPressTimeout, setLongPressTimeout] = useState<NodeJS.Timeout | null>(null);
  const [progress, setProgress] = useState(0);
  const [progressAnimation] = useState(new RNAnimated.Value(0));

  // Animación de pulso
  const pulseAnim = React.useRef(new RNAnimated.Value(1)).current;
  
  React.useEffect(() => {
    const pulse = RNAnimated.loop(
      RNAnimated.sequence([
        RNAnimated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        RNAnimated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    
    pulse.start();
    
    return () => {
      pulse.stop();
    };
  }, []);

  // Animación de progreso
  React.useEffect(() => {
    if (isPressed) {
      RNAnimated.timing(progressAnimation, {
        toValue: 1,
        duration: 2000, // 2 segundos para completar
        easing: Easing.linear,
        useNativeDriver: false,
      }).start(({ finished }) => {
        if (finished) {
          handleEmergencyActivation();
        }
      });

      progressAnimation.addListener(({ value }) => {
        setProgress(value);
      });
    } else {
      progressAnimation.stopAnimation();
      progressAnimation.setValue(0);
      setProgress(0);
    }

    return () => {
      progressAnimation.removeAllListeners();
    };
  }, [isPressed]);

  const handlePressIn = () => {
    setIsPressed(true);
    // Configurar un timeout para activar la emergencia después de mantener presionado
    const timeout = setTimeout(() => {
      handleEmergencyActivation();
    }, 2000); // 2 segundos
    
    setLongPressTimeout(timeout);
  };

  const handlePressOut = () => {
    setIsPressed(false);
    // Limpiar el timeout si se suelta antes de tiempo
    if (longPressTimeout) {
      clearTimeout(longPressTimeout);
      setLongPressTimeout(null);
    }
  };

  const handleEmergencyActivation = () => {
    // Navegar a la pantalla de emergencia
    navigation.navigate('Emergency');
  };

  return (
    <View style={[styles.container, style]}>
      <RNAnimated.View 
        style={[
          styles.pulseContainer,
          {
            transform: [{ scale: pulseAnim }],
            opacity: isPressed ? 0.8 : 0.3,
          }
        ]}
      />
      
      <TouchableOpacity
        style={[styles.button, isPressed && styles.buttonPressed]}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.7}
      >
        <Ionicons name="alert-circle" size={28} color="#fff" />
        <Text style={styles.text}>SOS</Text>
      </TouchableOpacity>
      
      {isPressed && (
        <View style={styles.progressContainer}>
          <View 
            style={[
              styles.progressBar, 
              { width: `${progress * 100}%` }
            ]} 
          />
          <Text style={styles.progressText}>
            {progress < 1 ? 'Mantenga presionado...' : 'Activando...'}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  pulseContainer: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FF5252',
  },
  button: {
    backgroundColor: '#D32F2F',
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
    zIndex: 1,
  },
  buttonPressed: {
    backgroundColor: '#B71C1C',
    transform: [{ scale: 0.95 }],
  },
  text: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    marginTop: 2,
  },
  progressContainer: {
    position: 'absolute',
    bottom: -40,
    width: 150,
    height: 30,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 15,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#FF5252',
    position: 'absolute',
    left: 0,
    top: 0,
  },
  progressText: {
    color: '#fff',
    fontSize: 12,
    textAlign: 'center',
    fontWeight: 'bold',
  },
});

export default EmergencyButton;