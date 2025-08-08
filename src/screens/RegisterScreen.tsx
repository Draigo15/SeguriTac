import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import AnimatedScreen from '../components/AnimatedScreen';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import AnimatedButton from '../components/AnimatedButton';
import { useNavigation, useRoute } from '@react-navigation/native';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../services/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { RootStackParamList } from '../navigation/types';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { colors, fontSizes, spacing } from '../theme';
import Icon from 'react-native-vector-icons/Ionicons';
import Toast from 'react-native-toast-message';

type RegisterScreenNav = NativeStackNavigationProp<RootStackParamList, 'Register'>;
type RegisterScreenRoute = RouteProp<RootStackParamList, 'Register'>;

const RegisterScreen = () => {
  const navigation = useNavigation<RegisterScreenNav>();
  const route = useRoute<RegisterScreenRoute>();
  const { role } = route.params ?? { role: 'ciudadano' };

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
  if (!email || !password || !firstName || !lastName) {
    Toast.show({
      type: 'error',
      text1: 'Campos requeridos',
      text2: 'Por favor completa todos los campos.',
    });
    return;
  }

  if (password.length < 8) {
    Toast.show({
      type: 'error',
      text1: 'Contraseña débil',
      text2: 'Debe tener al menos 8 caracteres.',
    });
    return;
  }

  setLoading(true);

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const uid = userCredential.user.uid;

    // 🔐 Guardar el rol SOLO desde navegación, no desde el formulario
    await setDoc(doc(db, 'users', uid), {
      email,
      firstName,
      lastName,
      role: role === 'autoridad' ? 'autoridad' : 'ciudadano', // Refuerzo de seguridad
    });

   Toast.show({
      type: 'success',
      text1: 'Registro exitoso',
      text2: 'Ahora puedes iniciar sesión.',
    });

    setTimeout(() => {
      navigation.navigate('Login', { role });
    }, 1000); // 1 segundo

  } catch (error: any) {
    if (error.code === 'auth/email-already-in-use') {
      Toast.show({
        type: 'error',
        text1: 'Correo en uso',
        text2: 'El correo electrónico ya está registrado.',
      });
    } else if (error.code === 'auth/invalid-email') {
      Toast.show({
        type: 'error',
        text1: 'Correo inválido',
        text2: 'Ingresa un correo válido.',
      });
    } else if (error.code === 'auth/weak-password') {
      Toast.show({
        type: 'error',
        text1: 'Contraseña débil',
        text2: 'Debe tener al menos 8 caracteres.',
      });
    } else {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'No se pudo completar el registro.',
      });
    }
  } finally {
    setLoading(false);
  }
};

  return (
    <AnimatedScreen animationType="slideUp" duration={600}>
      <KeyboardAvoidingView
        style={styles.background}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <Animated.Image
            entering={FadeInDown.duration(1000).springify()}
            source={require('../../assets/iconselector.png')}
            style={styles.logo}
            resizeMode="contain"
          />

          <Animated.Text 
            entering={FadeInUp.delay(200).duration(800)}
            style={styles.title}
          >
            Registro - {role === 'ciudadano' ? 'Ciudadano' : 'Autoridad'}
          </Animated.Text>

        <Animated.View 
          entering={FadeInUp.delay(300).duration(800)}
          style={styles.inputContainer}
        >
          <Icon name="person-outline" size={20} color="#000" style={styles.icon} />
          <TextInput
            style={styles.input}
            placeholder="Nombres"
            placeholderTextColor="#000"
            value={firstName}
            onChangeText={setFirstName}
          />
        </Animated.View>

        <Animated.View 
          entering={FadeInUp.delay(400).duration(800)}
          style={styles.inputContainer}
        >
          <Icon name="person-outline" size={20} color="#000" style={styles.icon} />
          <TextInput
            style={styles.input}
            placeholder="Apellidos"
            placeholderTextColor="#000"
            value={lastName}
            onChangeText={setLastName}
          />
        </Animated.View>

        <Animated.View 
          entering={FadeInUp.delay(500).duration(800)}
          style={styles.inputContainer}
        >
          <Icon name="mail-outline" size={20} color="#000" style={styles.icon} />
          <TextInput
            style={styles.input}
            placeholder="Correo electrónico"
            placeholderTextColor="#000"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
        </Animated.View>

        <Animated.View 
          entering={FadeInUp.delay(600).duration(800)}
          style={styles.inputContainer}
        >
          <Icon name="lock-closed-outline" size={20} color="#000" style={styles.icon} />
          <TextInput
            style={styles.input}
            placeholder="Contraseña"
            placeholderTextColor="#000"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
        </Animated.View>

        <Animated.View 
          entering={FadeInUp.delay(700).duration(800)}
          style={{width: '100%'}}
        >
          <AnimatedButton
            title={loading ? 'Registrando...' : 'Registrarse'}
            onPress={handleRegister}
            style={[styles.button, loading && styles.buttonDisabled]}
            animationType="scale"
            icon="person-add-outline"
            disabled={loading}
          />
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
    </AnimatedScreen>
  );
};

export default RegisterScreen;

const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: '#002B7F',
  },
  container: {
    padding: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 220,
    height: 220,
    marginBottom: spacing.md,
  },
  title: {
    fontSize: fontSizes.xl,
    fontWeight: 'bold',
    marginBottom: spacing.lg,
    textAlign: 'center',
    color: colors.white,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
    width: '100%',
  },
  icon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    height: 48,
    fontSize: 16,
    color: '#000',
  },
  button: {
    backgroundColor: '#0055CC',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    marginTop: spacing.sm,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 4,
  },
  buttonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.97 }],
  },
  buttonDisabled: {
    backgroundColor: colors.gray400 ?? '#aaa',
  },
  buttonText: {
    color: colors.white,
    fontSize: fontSizes.base,
    fontWeight: 'bold',
  },
});
