import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import {
  colors,
  spacing,
  fontSizes,
  borderRadius,
  shadows,
} from '../theme';
import AnimatedScreen from '../components/AnimatedScreen';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { auth } from '../services/firebase';
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import Toast from 'react-native-toast-message';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';

type ChangePasswordScreenNav = NativeStackNavigationProp<RootStackParamList>;

const ChangePasswordScreen = () => {
  const navigation = useNavigation<ChangePasswordScreenNav>();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const validatePasswords = () => {
    if (!currentPassword.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Ingresa tu contraseña actual',
      });
      return false;
    }

    if (!newPassword.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Ingresa una nueva contraseña',
      });
      return false;
    }

    if (newPassword.length < 6) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'La nueva contraseña debe tener al menos 6 caracteres',
      });
      return false;
    }

    if (newPassword !== confirmPassword) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Las contraseñas no coinciden',
      });
      return false;
    }

    if (currentPassword === newPassword) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'La nueva contraseña debe ser diferente a la actual',
      });
      return false;
    }

    return true;
  };

  const handleChangePassword = async () => {
    if (!validatePasswords()) return;

    setLoading(true);
    try {
      const user = auth.currentUser;
      if (!user || !user.email) {
        throw new Error('Usuario no autenticado');
      }

      // Reautenticar al usuario con su contraseña actual
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);

      // Actualizar la contraseña
      await updatePassword(user, newPassword);

      Toast.show({
        type: 'success',
        text1: 'Éxito',
        text2: 'Contraseña actualizada correctamente',
      });

      // Limpiar campos
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');

      // Volver a la pantalla anterior después de un breve delay
      setTimeout(() => {
        navigation.goBack();
      }, 2000);

    } catch (error: any) {
      console.error('Error al cambiar contraseña:', error);
      
      let errorMessage = 'Error al cambiar la contraseña';
      
      if (error.code === 'auth/wrong-password') {
        errorMessage = 'La contraseña actual es incorrecta';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'La nueva contraseña es muy débil';
      } else if (error.code === 'auth/requires-recent-login') {
        errorMessage = 'Por seguridad, inicia sesión nuevamente';
      }

      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  const InputField = ({ 
    label, 
    value, 
    onChangeText, 
    placeholder, 
    secureTextEntry, 
    showPassword, 
    onTogglePassword,
    delay = 0
  }: {
    label: string;
    value: string;
    onChangeText: (text: string) => void;
    placeholder: string;
    secureTextEntry: boolean;
    showPassword: boolean;
    onTogglePassword: () => void;
    delay?: number;
  }) => (
    <Animated.View entering={FadeInUp.delay(delay).duration(600)} style={styles.inputContainer}>
      <Text style={styles.inputLabel}>{label}</Text>
      <View style={styles.inputWrapper}>
        <TextInput
          style={styles.textInput}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.gray400}
          secureTextEntry={secureTextEntry && !showPassword}
          autoCapitalize="none"
        />
        <TouchableOpacity
          style={styles.eyeButton}
          onPress={onTogglePassword}
        >
          <Icon
            name={showPassword ? 'eye-off' : 'eye'}
            size={20}
            color={colors.gray500}
          />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );

  return (
    <AnimatedScreen animationType="slideVertical" duration={800}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <Animated.View entering={FadeInDown.duration(800)} style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Icon name="arrow-left" size={24} color={colors.white} />
            </TouchableOpacity>
            <Text style={styles.title}>Cambiar Contraseña</Text>
          </Animated.View>

          {/* Form */}
          <View style={styles.formContainer}>
            <InputField
              label="Contraseña Actual"
              value={currentPassword}
              onChangeText={setCurrentPassword}
              placeholder="Ingresa tu contraseña actual"
              secureTextEntry={true}
              showPassword={showCurrentPassword}
              onTogglePassword={() => setShowCurrentPassword(!showCurrentPassword)}
              delay={200}
            />

            <InputField
              label="Nueva Contraseña"
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="Ingresa tu nueva contraseña"
              secureTextEntry={true}
              showPassword={showNewPassword}
              onTogglePassword={() => setShowNewPassword(!showNewPassword)}
              delay={300}
            />

            <InputField
              label="Confirmar Nueva Contraseña"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Confirma tu nueva contraseña"
              secureTextEntry={true}
              showPassword={showConfirmPassword}
              onTogglePassword={() => setShowConfirmPassword(!showConfirmPassword)}
              delay={400}
            />

            {/* Password Requirements */}
            <Animated.View entering={FadeInUp.delay(500).duration(600)} style={styles.requirementsContainer}>
              <Text style={styles.requirementsTitle}>Requisitos de la contraseña:</Text>
              <Text style={styles.requirementText}>• Mínimo 6 caracteres</Text>
              <Text style={styles.requirementText}>• Debe ser diferente a la contraseña actual</Text>
            </Animated.View>

            {/* Change Password Button */}
            <Animated.View entering={FadeInUp.delay(600).duration(600)}>
              <TouchableOpacity
                style={[styles.changeButton, loading && styles.changeButtonDisabled]}
                onPress={handleChangePassword}
                disabled={loading}
              >
                <Text style={styles.changeButtonText}>
                  {loading ? 'Cambiando...' : 'Cambiar Contraseña'}
                </Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      <Toast />
    </AnimatedScreen>
  );
};

export default ChangePasswordScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  scrollContainer: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
    padding: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xl,
    paddingTop: spacing.md,
  },
  backButton: {
    marginRight: spacing.md,
    padding: spacing.sm,
  },
  title: {
    fontSize: fontSizes.xl,
    fontWeight: 'bold',
    color: colors.white,
    flex: 1,
  },
  formContainer: {
    flex: 1,
  },
  inputContainer: {
    marginBottom: spacing.lg,
  },
  inputLabel: {
    fontSize: fontSizes.base,
    fontWeight: '600',
    color: colors.white,
    marginBottom: spacing.sm,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    ...shadows.sm,
  },
  textInput: {
    flex: 1,
    fontSize: fontSizes.base,
    color: colors.gray800,
    paddingVertical: spacing.md,
  },
  eyeButton: {
    padding: spacing.sm,
  },
  requirementsContainer: {
    backgroundColor: colors.blue100,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.xl,
  },
  requirementsTitle: {
    fontSize: fontSizes.base,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  requirementText: {
    fontSize: fontSizes.sm,
    color: colors.gray800,
    marginBottom: spacing.xs,
  },
  changeButton: {
    backgroundColor: colors.secondary,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    ...shadows.md,
  },
  changeButtonDisabled: {
    backgroundColor: colors.gray400,
  },
  changeButtonText: {
    fontSize: fontSizes.base,
    fontWeight: '600',
    color: colors.white,
  },
});