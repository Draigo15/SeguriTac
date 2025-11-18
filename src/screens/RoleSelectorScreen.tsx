import React from 'react';
import {
  View,
  StyleSheet,
} from 'react-native';
import { 
  colors, 
  spacing, 
  fontSizes,
  commonContainers,
  commonTexts,
  commonButtons
} from '../theme';
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
            style={[styles.button, { backgroundColor: colors.white }]}
            labelStyle={{ color: colors.primary, fontWeight: 'bold' }}
            testID="role-ciudadano"
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
            style={[styles.button, { backgroundColor: colors.secondary }]}
            labelStyle={{ color: colors.white, fontWeight: 'bold' }}
            testID="role-autoridad"
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
    backgroundColor: colors.primary,
  },
  container: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerImage: {
    width: '90%',
    height: 150,
    marginTop: spacing.xl,
    marginBottom: spacing.xs,
  },
  logo: {
    width: 300,
    height: 300,
    marginBottom: spacing.xs,
  },
  title: {
    fontSize: fontSizes.xxl,
    fontWeight: 'bold',
    color: colors.white,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  description: {
    fontSize: fontSizes.base,
    color: colors.gray200,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  buttonContainer: {
    width: '95%',
    alignItems: 'center',
  },
  button: {
    borderRadius: 16,
    marginBottom: spacing.md,
    width: '100%',
    elevation: 4,
  },
  buttonContent: {
    paddingVertical: spacing.md,
  },
});
