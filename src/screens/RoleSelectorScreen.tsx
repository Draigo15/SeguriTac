import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
} from 'react-native';
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
    <View style={styles.background}>
      <Animatable.View animation="fadeInUp" duration={800} style={styles.container}>

        <Image
          source={require('../../assets/roleimageen4.png')}
          style={styles.headerImage}
          resizeMode="contain"
        />

        <Image
          source={require('../../assets/iconselector.png')}
          style={styles.logo}
          resizeMode="contain"
        />

        <Text style={styles.title}>¿Quién eres?</Text>

        <Text style={styles.description}>
          Reporta incidentes o responde como autoridad en tu comunidad.
        </Text>

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
      </Animatable.View>
    </View>
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
  button: {
    borderRadius: 16,
    marginBottom: 16,
    width: '80%',
    elevation: 4,
  },
  buttonContent: {
    paddingVertical: 10,
  },
});
