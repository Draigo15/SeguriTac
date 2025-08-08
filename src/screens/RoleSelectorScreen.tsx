import React from 'react';
import {
  View,
  StyleSheet,
} from 'react-native';
import AnimatedScreen from '../components/AnimatedScreen';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import * as Animatable from 'react-native-animatable';
import { Button } from 'react-native-paper';

type RoleSelectorNav = NativeStackNavigationProp<RootStackParamList, 'RoleSelector'>;

const RoleSelectorScreen = () => {
  const navigation = useNavigation<RoleSelectorNav>();

  const handleSelectRole = (role: 'ciudadano' | 'autoridad') => {
    navigation.navigate('LoginMethod', { role });
  };

  return (
    <AnimatedScreen animationType="zoom" duration={800}>
      <View style={styles.background}>
        <View style={styles.container}>

          <Animated.Image
            entering={FadeInDown.duration(1000).springify()}
            source={require('../../assets/roleimageen4.png')}
            style={styles.headerImage}
            resizeMode="contain"
          />

          <Animated.Image
            entering={FadeInDown.delay(200).duration(1000).springify()}
            source={require('../../assets/iconselector.png')}
            style={styles.logo}
            resizeMode="contain"
          />

          <Animated.Text 
            entering={FadeInUp.delay(400).duration(800)}
            style={styles.title}
          >
            ¿Quién eres?
          </Animated.Text>

          <Animated.Text 
            entering={FadeInUp.delay(500).duration(800)}
            style={styles.description}
          >
            Reporta incidentes o responde como autoridad en tu comunidad.
          </Animated.Text>

        <Animated.View 
          entering={FadeInUp.delay(600).duration(800)}
          style={styles.buttonContainer}
        >
          <Button
            mode="contained"
            onPress={() => handleSelectRole('ciudadano')}
            contentStyle={styles.buttonContent}
            style={[styles.button, { backgroundColor: '#FFFFFF' }]}
            labelStyle={{ color: '#002B7F', fontWeight: 'bold' }}
            accessibilityRole="button"
            accessibilityLabel="Seleccionar rol Ciudadano"
          >
            🧍 Ciudadano
          </Button>
        </Animated.View>

        <Animated.View 
          entering={FadeInUp.delay(700).duration(800)}
          style={styles.buttonContainer}
        >
          <Button
            mode="contained"
            onPress={() => handleSelectRole('autoridad')}
            contentStyle={styles.buttonContent}
            style={[styles.button, { backgroundColor: '#0055CC' }]}
            labelStyle={{ color: '#FFFFFF', fontWeight: 'bold' }}
            accessibilityRole="button"
            accessibilityLabel="Seleccionar rol Autoridad"
          >
            🛡 Autoridad
          </Button>
        </Animated.View>
      </View>
    </View>
    </AnimatedScreen>
  );
};

export default RoleSelectorScreen;

const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: '#002B7F',
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerImage: {
    width: '90%',
    height: 150,
    marginTop: 32,
    marginBottom: 6,
  },
  logo: {
    width: 300,
    height: 300,
    marginBottom: 2,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 6,
  },
  description: {
    fontSize: 16,
    color: '#E6ECF3',
    textAlign: 'center',
    marginBottom: 20,
  },
  buttonContainer: {
    width: '95%',
    alignItems: 'center',
  },
  button: {
    borderRadius: 16,
    marginBottom: 16,
    width: '100%',
    elevation: 4,
  },
  buttonContent: {
    paddingVertical: 12,
  },
});
